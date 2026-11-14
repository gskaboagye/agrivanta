import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import {
  getCurrentUser,
  verifyPassword,
  hashPassword,
  destroySession,
} from "@/lib/auth";

function invalidOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin !== request.nextUrl.origin);
}

export async function POST(request: NextRequest) {
  try {
    if (invalidOrigin(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    const currentUser = await getCurrentUser();

    if (!currentUser || !ObjectId.isValid(currentUser.id)) {
      return NextResponse.json(
        { success: false, message: "Please log in again to continue." },
        { status: 401 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request data." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid request data." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const currentPassword =
      typeof data.currentPassword === "string"
        ? data.currentPassword
        : "";

    const newPassword =
      typeof data.newPassword === "string"
        ? data.newPassword
        : "";

    const currentPasswordBytes =
      new TextEncoder().encode(currentPassword).length;

    const newPasswordBytes =
      new TextEncoder().encode(newPassword).length;

    if (!currentPassword || currentPasswordBytes > 72) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid current password." },
        { status: 400 }
      );
    }

    if (newPassword.length < 10 || newPasswordBytes > 72) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your new password must contain at least 10 characters and not exceed 72 UTF-8 bytes.",
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const users = db.collection("users");

    const account = await users.findOne(
      { _id: new ObjectId(currentUser.id) },
      { projection: { passwordHash: 1, sessionVersion: 1 } }
    );

    if (
      !account ||
      typeof account.passwordHash !== "string" ||
      !account.passwordHash
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to verify your account password.",
        },
        { status: 400 }
      );
    }

    const currentPasswordMatches = await verifyPassword(
      currentPassword,
      account.passwordHash
    );

    if (!currentPasswordMatches) {
      return NextResponse.json(
        {
          success: false,
          message: "Your current password is incorrect.",
        },
        { status: 400 }
      );
    }

    const samePassword = await verifyPassword(
      newPassword,
      account.passwordHash
    );

    if (samePassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your new password must be different from your current password.",
        },
        { status: 400 }
      );
    }

    const newPasswordHash = await hashPassword(newPassword);

    const sessionVersionFilter =
      typeof account.sessionVersion === "number"
        ? { sessionVersion: account.sessionVersion }
        : { sessionVersion: { $exists: false } };

    const result = await users.updateOne(
      {
        _id: new ObjectId(currentUser.id),
        passwordHash: account.passwordHash,
        ...sessionVersionFilter,
      },
      {
        $set: {
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        },
        $inc: {
          sessionVersion: 1,
        },
      }
    );

    if (result.modifiedCount !== 1) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account changed during this request. Please log in again and retry.",
        },
        { status: 409 }
      );
    }

    await destroySession();

    return NextResponse.json({
      success: true,
      message:
        "Your password has been changed successfully. Please log in again with your new password.",
      sessionInvalidated: true,
    });
  } catch (error) {
    console.error("Password change failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to change your password right now.",
      },
      { status: 500 }
    );
  }
}
