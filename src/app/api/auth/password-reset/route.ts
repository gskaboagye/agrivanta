import { ObjectId } from "mongodb";
import { consumeRateLimit, getRequestClientAddress } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { getDatabase, getMongoClient } from "@/lib/mongodb";
import { hashPassword } from "@/lib/auth";
import {
  ensurePasswordResetIndexes,
  hashPasswordResetToken,
  type PasswordResetTokenDocument,
} from "@/lib/password-reset";

export async function POST(request: NextRequest) {
  await connection();

  const requestLimit = await consumeRateLimit({
      scope: "password-reset-ip",
      identifier: getRequestClientAddress(request),
      limit: 8,
      windowMs: 900000,
    });
    if (!requestLimit.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": String(requestLimit.retryAfterSeconds) } }
      );
    }


  const origin = request.headers.get("origin");
  const requestOrigin = new URL(request.url).origin;

  if (origin && origin !== requestOrigin) {
    return NextResponse.json(
      { success: false, message: "Invalid request origin." },
      { status: 403 }
    );
  }

  let body: { resetToken?: unknown; newPassword?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body." },
      { status: 400 }
    );
  }

  const { resetToken, newPassword } = body;

  if (
    typeof resetToken !== "string" ||
    !/^[a-f0-9]{64}$/i.test(resetToken)
  ) {
    return NextResponse.json(
      { success: false, message: "Invalid or expired reset token." },
      { status: 400 }
    );
  }

  if (
    typeof newPassword !== "string" ||
    newPassword.length < 10 ||
    Buffer.byteLength(newPassword, "utf8") > 72
  ) {
    return NextResponse.json(
      {
        success: false,
        message: "Password must be at least 10 characters and no more than 72 bytes.",
      },
      { status: 400 }
    );
  }

  try {
    await ensurePasswordResetIndexes();

    const db = await getDatabase();
    const client = await getMongoClient();
    const session = client.startSession();

    let resetSucceeded = false;

    try {
      const tokenHash = hashPasswordResetToken(resetToken);
      const now = new Date();

      await session.withTransaction(async () => {
        const tokens = db.collection<PasswordResetTokenDocument>(
          "passwordResetTokens"
        );

        const tokenDocument = await tokens.findOne(
          {
            tokenHash,
            expiresAt: { $gt: now },
          },
          { session }
        );

        if (
          !tokenDocument ||
          !ObjectId.isValid(tokenDocument.userId)
        ) {
          return;
        }

        const users = db.collection("users");
        const userId = new ObjectId(tokenDocument.userId);

        const user = await users.findOne(
          {
            _id: userId,
            accountVerified: true,
            status: { $ne: "disabled" },
            disabled: { $ne: true },
          },
          { session, projection: { _id: 1 } }
        );

        if (!user) {
          return;
        }

        const passwordHash = await hashPassword(newPassword);

        const updateResult = await users.updateOne(
          {
            _id: userId,
            accountVerified: true,
            status: { $ne: "disabled" },
            disabled: { $ne: true },
          },
          {
            $set: {
              passwordHash,
              updatedAt: new Date(),
            },
            $inc: { sessionVersion: 1 },
          },
          { session }
        );

        if (updateResult.modifiedCount !== 1) {
          return;
        }

        const deleteResult = await tokens.deleteOne(
          {
            userId: tokenDocument.userId,
            tokenHash,
            expiresAt: tokenDocument.expiresAt,
          },
          { session }
        );

        if (deleteResult.deletedCount !== 1) {
          throw new Error("Reset token could not be consumed.");
        }

        await db.collection("authVerifications").deleteMany(
          {
            userId: tokenDocument.userId,
            purpose: "password-reset",
          },
          { session }
        );

        resetSucceeded = true;
      });
    } finally {
      await session.endSession();
    }

    if (!resetSucceeded) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired reset token." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your password has been reset. Please log in with your new password.",
    });
  } catch (error) {
    console.error("Password reset error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to reset your password. Please try again." },
      { status: 500 }
    );
  }
}
