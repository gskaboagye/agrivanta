
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { MongoServerError } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { hashAdminPassword } from "@/lib/admin-auth";



const SETUP_LOCK_ID = "initial-administrator-setup";

function verifySetupSecret(provided: string, expected: string) {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  let setupLockAcquired = false;
  let setupCompleted = false;

  try {
    const expectedSecret = process.env.ADMIN_SETUP_SECRET;

    if (!expectedSecret || expectedSecret.length < 32) {
      return NextResponse.json(
        { message: "Administrator setup is not configured." },
        { status: 503 }
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

    const name =
      typeof data.name === "string" ? data.name.trim() : "";

    const email =
      typeof data.email === "string"
        ? data.email.trim().toLowerCase()
        : "";

    const password =
      typeof data.password === "string" ? data.password : "";

    const setupSecret =
      typeof data.setupSecret === "string" ? data.setupSecret : "";

    if (!verifySetupSecret(setupSecret, expectedSecret)) {
      return NextResponse.json(
        { message: "Invalid setup credentials." },
        { status: 403 }
      );
    }

    if (name.length < 2 || name.length > 80) {
      return NextResponse.json(
        { message: "Name must be between 2 and 80 characters." },
        { status: 400 }
      );
    }

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { message: "Enter a valid email address." },
        { status: 400 }
      );
    }

    const passwordBytes = new TextEncoder().encode(password).length;

    if (password.length < 12 || passwordBytes > 72) {
      return NextResponse.json(
        {
          message:
            "Password must contain at least 12 characters and not exceed 72 UTF-8 bytes.",
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const administrators = db.collection("administrators");

    const setupLocks = db.collection<{
      _id: string;
      createdAt: Date;
    }>("adminSetupLocks");

    await administrators.createIndex(
      { email: 1 },
      {
        unique: true,
        name: "unique_administrator_email",
      }
    );

    // Acquire a unique lock to prevent simultaneous initial setup.
    try {
      await setupLocks.insertOne({
        _id: SETUP_LOCK_ID,
        createdAt: new Date(),
      });

      setupLockAcquired = true;
    } catch (error) {
      if (
        error instanceof MongoServerError &&
        error.code === 11000
      ) {
        return NextResponse.json(
          {
            message:
              "Initial administrator setup has already been completed or started.",
          },
          { status: 409 }
        );
      }

      throw error;
    }

    const existingAdminCount =
      await administrators.countDocuments();

    if (existingAdminCount > 0) {
      setupCompleted = true;

      return NextResponse.json(
        {
          message:
            "An administrator account already exists. Initial setup is disabled.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashAdminPassword(password);
    const now = new Date();

    const result = await administrators.insertOne({
      name,
      email,
      passwordHash,
      status: "active",
      createdAt: now,
      updatedAt: now,
      createdBy: "initial-setup",
    });

    setupCompleted = true;

    return NextResponse.json(
      {
        success: true,
        message:
          "Initial administrator account created successfully.",
        administrator: {
          id: result.insertedId.toString(),
          name,
          email,
          status: "active",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Initial administrator setup failed:", error);

    // Release the lock after a controlled failure only if no
    // administrator account was created.
    if (setupLockAcquired && !setupCompleted) {
      try {
        const db = await getDatabase();

        const existingAdminCount = await db
          .collection("administrators")
          .countDocuments();

        if (existingAdminCount === 0) {
          await db
            .collection<{
              _id: string;
              createdAt: Date;
            }>("adminSetupLocks")
            .deleteOne({ _id: SETUP_LOCK_ID });
        }
      } catch (cleanupError) {
        console.error(
          "Unable to release administrator setup lock:",
          cleanupError
        );
      }
    }

    return NextResponse.json(
      {
        message:
          "Unable to complete administrator setup. Check the server logs.",
      },
      { status: 500 }
    );
  }
}
