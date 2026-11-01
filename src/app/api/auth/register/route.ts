
import { NextResponse } from "next/server";
import { MongoServerError } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import {
  ACCOUNT_ROLES,
  createSession,
  hashPassword,
  type AccountRole,
  type AuthUser,
} from "@/lib/auth";
import {
  emailSchema,
  optionalPhoneSchema,
} from "@/lib/validation";


export async function POST(request: Request) {
  try {
    // Parse request safely.
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

    // Validate name.
    if (name.length < 2 || name.length > 80) {
      return NextResponse.json(
        {
          success: false,
          message: "Name must be 2â€“80 characters.",
        },
        { status: 400 }
      );
    }

    // Validate and normalize email.
    const emailResult = emailSchema.safeParse(email);

    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid email address.",
        },
        { status: 400 }
      );
    }

    email = emailResult.data;

    // Validate and normalize the optional phone number.
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
// Validate password using its UTF-8 byte length.
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

    // Validate account role.
    if (!ACCOUNT_ROLES.includes(role as AccountRole)) {
      return NextResponse.json(
        {
          success: false,
          message: "Select a valid account type.",
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const users = db.collection("users");

    // Check for an existing account.
    const existingUser = await users.findOne(
      { email },
      { projection: { _id: 1 } }
    );

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    // Hash password before storing it.
    const passwordHash = await hashPassword(password);
    const now = new Date();

    // Only explicitly approved fields are stored.
    const result = await users.insertOne({
      name,
      email,
      phone,
      role,
      phonePublic: false,
      whatsappEnabled: false,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    const user: AuthUser = {
      id: result.insertedId.toString(),
      name,
      email,
      phone,
      role: role as AccountRole,
    };

    // Automatically log in the newly registered user.
    await createSession(user);

    return NextResponse.json(
      {
        success: true,
        message: "Your AgriVanta account has been created.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle duplicate email errors from MongoDB.
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

