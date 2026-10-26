import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { createSession, verifyPassword } from "@/lib/auth";



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

    const email =
      typeof data.email === "string"
        ? data.email.trim().toLowerCase()
        : "";
    const password =
      typeof data.password === "string" ? data.password : "";

    if (
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !password ||
      password.length > 72
    ) {
      return NextResponse.json(
        { success: false, message: "Enter a valid email and password." },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const user = await db.collection("users").findOne({ email });

    if (
      !user ||
      typeof user.passwordHash !== "string" ||
      !(await verifyPassword(password, user.passwordHash))
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const publicUser = {
      id: user._id.toString(),
      name: String(user.name ?? ""),
      email: String(user.email ?? ""),
      phone: String(user.phone ?? ""),
      role: user.role,
    };

    await createSession({
      ...publicUser,
      role: publicUser.role,
    });

    return NextResponse.json({
      success: true,
      message: "Login successful.",
      user: publicUser,
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { success: false, message: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}