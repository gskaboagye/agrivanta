import { NextResponse } from "next/server";
import { MongoServerError } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import {
  ACCOUNT_ROLES,
  createSession,
  hashPassword,
  type AccountRole,
} from "@/lib/auth";



const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid request data." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const name =
      typeof data.name === "string" ? data.name.trim() : "";
    const email =
      typeof data.email === "string"
        ? data.email.trim().toLowerCase()
        : "";
    const phone =
      typeof data.phone === "string" ? data.phone.trim() : "";
    const password =
      typeof data.password === "string" ? data.password : "";
    const role =
      typeof data.role === "string" ? data.role : "";

    if (name.length < 2 || name.length > 80) {
      return NextResponse.json(
        { success: false, message: "Name must be 2–80 characters." },
        { status: 400 }
      );
    }

    if (email.length > 254 || !emailPattern.test(email)) {
      return NextResponse.json(
        { success: false, message: "Enter a valid email address." },
        { status: 400 }
      );
    }

    if (phone.length > 30) {
      return NextResponse.json(
        { success: false, message: "Phone number is too long." },
        { status: 400 }
      );
    }

    if (password.length < 10 || password.length > 72) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must contain 10–72 characters.",
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
          message: "An account with this email already exists.",
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
      role,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    const user = {
      id: result.insertedId.toString(),
      name,
      email,
      phone,
      role: role as AccountRole,
    };

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