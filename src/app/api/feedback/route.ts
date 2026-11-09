import { connection, NextResponse } from "next/server";
import { randomUUID, createHmac } from "node:crypto";
import { z } from "zod";
import { getDatabase } from "@/lib/mongodb";

const FEEDBACK_LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

let rateLimitIndexPromise: Promise<string> | null = null;

const feedbackSchema = z.object({
  type: z.enum([
    "General Feedback",
    "Suggestion",
    "Bug Report",
    "Complaint",
  ]),
  rating: z.number().int().min(1).max(5),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(3000),
  email: z.union([
    z.literal(""),
    z.email().max(254),
  ]).optional(),
  website: z.string().max(500).optional(),
});

import { isIP } from "node:net";

function getClientIp(request: Request): string | null {
  const realIp = request.headers.get("x-real-ip")?.trim();

  if (!realIp || isIP(realIp) === 0) {
    return null;
  }

  return realIp;
}

function hashClientIp(ip: string): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is required for feedback rate limiting.");
  }

  return createHmac("sha256", secret)
    .update(ip)
    .digest("hex");
}

async function checkFeedbackRateLimit(
  db: Awaited<ReturnType<typeof getDatabase>>,
  ipHash: string
) {
  const now = Date.now();
  const windowStart = Math.floor(now / WINDOW_MS) * WINDOW_MS;
  const windowEnd = windowStart + WINDOW_MS;

  const collection = db.collection<{ _id: string; count: number; windowStartedAt: Date; expiresAt: Date }>("feedbackRateLimits");

  if (!rateLimitIndexPromise) {
    rateLimitIndexPromise = collection
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
      .catch((error: unknown) => {
        rateLimitIndexPromise = null;
        throw error;
      });
  }

  await rateLimitIndexPromise;

  const documentId = `${ipHash}:${windowStart}`;

  let record;

  try {
    record = await collection.findOneAndUpdate(
      { _id: documentId },
      {
        $inc: { count: 1 },
        $setOnInsert: {
          windowStartedAt: new Date(windowStart),
          expiresAt: new Date(windowEnd + 60_000),
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        includeResultMetadata: false,
      }
    );
  } catch (error) {
    // Handle simultaneous first requests creating the same window.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      record = await collection.findOneAndUpdate(
        { _id: documentId },
        { $inc: { count: 1 } },
        {
          returnDocument: "after",
          includeResultMetadata: false,
        }
      );
    } else {
      throw error;
    }
  }

  if (!record) {
    throw new Error("Unable to verify feedback submission limit.");
  }

  return {
    allowed: record.count <= FEEDBACK_LIMIT,
    retryAfter: Math.max(
      1,
      Math.ceil((windowEnd - now) / 1000)
    ),
  };
}

export async function POST(request: Request) {
  await connection();

  try {
    const body: unknown = await request.json();
    const validation = feedbackSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please check your feedback details and try again.",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { website, ...feedback } = validation.data;

    // Honeypot: silently accept submissions from basic bots.
    if (website) {
      return NextResponse.json({
        success: true,
        message: "Your feedback has been submitted successfully.",
      });
    }

    const ip = getClientIp(request);

    if (!ip) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to verify your request. Please try again.",
        },
        { status: 503 }
      );
    }

    const ipHash = hashClientIp(ip);
    const db = await getDatabase();

    const rateLimit = await checkFeedbackRateLimit(db, ipHash);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "You have submitted too much feedback. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter),
          },
        }
      );
    }

    const feedbackId = randomUUID();

    await db.collection("feedback").insertOne({
      feedbackId,
      type: feedback.type,
      rating: feedback.rating,
      subject: feedback.subject,
      message: feedback.message,
      email: feedback.email?.trim().toLowerCase() || null,
      status: "new",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your feedback has been submitted successfully.",
        feedbackId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Feedback submission failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to submit your feedback right now. Please try again.",
      },
      { status: 500 }
    );
  }
}