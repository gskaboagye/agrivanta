import { NextResponse } from "next/server";
import { consumeRateLimit, getRequestClientAddress } from "@/lib/rate-limit";
import { MongoServerError } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import {
  ACCOUNT_ROLES,
  hashPassword,
  createSession,
  type AccountRole,
} from "@/lib/auth";
import {
  emailSchema,
  optionalPhoneSchema,
} from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const requestLimit = await consumeRateLimit({
      scope: "registration-ip",
      identifier: getRequestClientAddress(request),
      limit: 5,
      windowMs: 3600000,
    });
    if (!requestLimit.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": String(requestLimit.retryAfterSeconds) } }
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

    if (data.termsAccepted !== true) {
      return NextResponse.json(
        {
          success: false,
          message: "You must agree to the Terms and Conditions and Privacy Policy before registering.",
        },
        { status: 400 }
      );
    }

    const name =
      typeof data.name === "string" ? data.name.trim() : "";

    let email =
      typeof data.email === "string"
        ? data.email.trim().toLowerCase()
        : "";

    let phone =
      typeof data.phone === "string" ? data.phone.trim() : "";

    const password =
      typeof data.password === "string" ? data.password : "";

    const role =
      typeof data.role === "string" ? data.role : "";

    if (name.length < 2 || name.length > 80) {
      return NextResponse.json(
        { success: false, message: "Name must be between 2 and 80 characters." },
        { status: 400 }
      );
    }

    const emailResult = emailSchema.safeParse(email);

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, message: "Enter a valid email address." },
        { status: 400 }
      );
    }

    email = emailResult.data;

    const phoneResult = optionalPhoneSchema.safeParse(phone);

    if (!phoneResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: phoneResult.error.issues[0]?.message ??
            "Enter a valid phone number.",
        },
        { status: 400 }
      );
    }

    phone = phoneResult.data;

    const passwordBytes = new TextEncoder().encode(password).length;

    if (password.length < 10 || passwordBytes > 72) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must contain at least 10 characters and not exceed 72 UTF-8 bytes.",
        },
        { status: 400 }
      );
    }

    if (!ACCOUNT_ROLES.includes(role as AccountRole)) {
      return NextResponse.json(
        { success: false, message: "Select a valid account type." },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const users = db.collection("users");

    const existingUser = await users.findOne(
      { email },
      { projection: { _id: 1 } }
    );

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists. Try logging in.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();

    const result = await users.insertOne({
      name,
      email,
      phone,
      role: role as AccountRole,
      phonePublic: false,
      whatsappEnabled: false,

      // MVP mode: account access is enabled without contact verification.
      // Contact verification remains pending for future activation.
      emailVerified: false,
      phoneVerified: false,
      accountVerified: true,

      // Registration consent records.
      termsAccepted: true,
      termsVersion: "1.0",
      privacyVersion: "1.0",
      termsAcceptedAt: now,
      privacyAcceptedAt: now,

      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    await createSession({
      id: result.insertedId.toString(),
      name,
      email,
      phone,
      role: role as AccountRole,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your account has been created successfully. You can now log in.",
        user: {
          id: result.insertedId.toString(),
          name,
          email,
          phone,
          role,
          emailVerified: false,
          phoneVerified: false,
          accountVerified: true,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof MongoServerError &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    console.error("Registration error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Registration failed. Please try again.",
      },
      { status: 500 }
    );
  }
}

