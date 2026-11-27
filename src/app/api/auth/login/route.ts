import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import {
  ACCOUNT_ROLES,
  createSession,
  verifyPassword,
  isAccountDisabled,
  type AccountRole,
  type AuthUser,
} from "@/lib/auth";

import { emailSchema } from "@/lib/validation";
import { consumeRateLimit, getRequestClientAddress } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json({ success: false, message: "Invalid request origin." }, { status: 403 });
    }

    const clientAddress = getRequestClientAddress(request);
    const ipLimit = await consumeRateLimit({
      scope: "user-login-ip",
      identifier: clientAddress,
      limit: 30,
      windowMs: 15 * 60 * 1000,
    });
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } }
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

    const accountLimit = await consumeRateLimit({
      scope: "user-login-account",
      identifier: email,
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });
    if (!accountLimit.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(accountLimit.retryAfterSeconds) } }
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

    if (isAccountDisabled(user)) {
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

