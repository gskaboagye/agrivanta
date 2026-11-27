
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  createAdminSession,
  verifyAdminPassword,
  type AdminUser,
} from "@/lib/admin-auth";
import { isAdminRole } from "@/lib/admin-permissions";
import { consumeRateLimit, getRequestClientAddress } from "@/lib/rate-limit";

type AdminDocument = {
  _id: import("mongodb").ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  status: "active" | "disabled";
  role?: unknown;
  createdAt?: Date;
};

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
    }

    const ipLimit = await consumeRateLimit({
      scope: "administrator-login-ip",
      identifier: getRequestClientAddress(request),
      limit: 20,
      windowMs: 15 * 60 * 1000,
    });
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { message: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } }
      );
    }
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid request data." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Invalid request data." },
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
      !password
    ) {
      return NextResponse.json(
        { message: "Enter a valid email address and password." },
        { status: 400 }
      );
    }

    const accountLimit = await consumeRateLimit({
      scope: "administrator-login-account",
      identifier: email,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (!accountLimit.allowed) {
      return NextResponse.json(
        { message: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(accountLimit.retryAfterSeconds) } }
      );
    }

    const db = await getDatabase();

    const administrator = await db
      .collection<AdminDocument>("administrators")
      .findOne({ email });

    // Use a generic error to avoid revealing whether an account exists.
    if (!administrator || administrator.status !== "active") {
      return NextResponse.json(
        { message: "Invalid administrator credentials." },
        { status: 401 }
      );
    }

    const passwordMatches = await verifyAdminPassword(
      password,
      administrator.passwordHash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        { message: "Invalid administrator credentials." },
        { status: 401 }
      );
    }

    const admin: AdminUser = {
      id: administrator._id.toString(),
      name: administrator.name,
      email: administrator.email,
      status: administrator.status,
      role: isAdminRole(administrator.role)
        ? administrator.role
        : null,
      createdAt: administrator.createdAt,
    };

    await createAdminSession(admin);

    return NextResponse.json(
      {
        success: true,
        message: "Administrator login successful.",
        administrator: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          status: admin.status,
          role: admin.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Administrator login failed:", error);

    return NextResponse.json(
      { message: "Unable to complete administrator login." },
      { status: 500 }
    );
  }
}
