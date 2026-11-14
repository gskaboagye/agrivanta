import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import {
  ACCOUNT_ROLES,
  createSession,
  verifyPassword,
  type AccountRole,
  type AuthUser,
} from "@/lib/auth";

import { emailSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request data." },
        { status: 400 }
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid request data." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const rawEmail =
      typeof data.email === "string" ? data.email : "";

    const emailResult = emailSchema.safeParse(rawEmail);
    const email = emailResult.success ? emailResult.data : "";

    const password =
      typeof data.password === "string"
        ? data.password
        : "";

    if (
      !emailResult.success ||
      !password ||
      new TextEncoder().encode(password).length > 72
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid email and password.",
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const user = await db.collection("users").findOne({
      email,
    });

    if (
      !user ||
      typeof user.passwordHash !== "string" ||
      !user.passwordHash
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    let passwordMatches = false;

    try {
      passwordMatches = await verifyPassword(
        password,
        user.passwordHash
      );
    } catch {
      passwordMatches = false;
    }

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    if (user.status === "disabled") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This account has been disabled. Please contact support.",
        },
        { status: 403 }
      );
    }

    if (!(user._id instanceof ObjectId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to authenticate this account.",
        },
        { status: 401 }
      );
    }

    if (
      typeof user.role !== "string" ||
      !ACCOUNT_ROLES.includes(user.role as AccountRole)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This account has an invalid account type.",
        },
        { status: 403 }
      );
    }

    const publicUser: AuthUser = {
      id: user._id.toString(),
      name: String(user.name ?? ""),
      email: String(user.email ?? ""),
      phone: String(user.phone ?? ""),
      role: user.role as AccountRole,
    };

    await createSession(publicUser);

    return NextResponse.json({
      success: true,
      message: "Login successful.",
      user: publicUser,
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Login failed. Please try again.",
      },
      { status: 500 }
    );
  }
}

