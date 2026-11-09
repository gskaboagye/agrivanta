import { randomUUID } from "node:crypto";
import { connection, NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";

const reportCategories = [
  "Fraud or Scam",
  "Suspicious Listing",
  "User Misconduct",
  "Misleading Information",
  "Platform Issue",
  "Other",
] as const;

const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid reference ID.");

const reportedEntitySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("listing"),
    id: objectIdSchema,
  }),
  z.object({
    type: z.literal("user"),
    id: objectIdSchema,
  }),
  z.object({
    type: z.literal("platform"),
  }),
]);

const reportSchema = z
  .object({
    category: z.enum(reportCategories),
    subject: z.string().trim().min(3).max(120),
    description: z.string().trim().min(10).max(3000),
    reportedEntity: reportedEntitySchema.optional(),
  })
  .strict();

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 15 * 60 * 1000;

let rateLimitIndexPromise: Promise<string> | null = null;

async function checkRateLimit(userId: string) {
  const db = await getDatabase();
  const collection = db.collection<{ _id: string; userId: string; expiresAt: Date; count: number }>("userReportRateLimits");

  rateLimitIndexPromise ??= collection.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
  );

  await rateLimitIndexPromise;

  const now = new Date();
  const windowStart = Math.floor(now.getTime() / RATE_WINDOW_MS);
  const expiresAt = new Date((windowStart + 1) * RATE_WINDOW_MS);

  const bucketId = `${userId}:${windowStart}`;

  await collection.updateOne(
    { _id: bucketId },
    {
      $setOnInsert: { userId, expiresAt },
      $inc: { count: 1 },
    },
    { upsert: true }
  );

  const bucket = await collection.findOne({ _id: bucketId });
  const count = Number(bucket?.count ?? 0);

  return {
    allowed: count <= RATE_LIMIT,
    retryAfter: Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000)),
  };
}

function getEntityOwnerId(entity: Record<string, unknown>) {
  const owner =
    entity.userId ??
    entity.sellerId ??
    entity.ownerId ??
    entity.createdBy;

  if (owner instanceof ObjectId) {
    return owner.toString();
  }

  return typeof owner === "string" ? owner : null;
}

export async function POST(request: NextRequest) {
  await connection();

  try {
    const origin = request.headers.get("origin");

    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Please sign in to submit a report." },
        { status: 401 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const validation = reportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please check the report details and try again.",
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = validation.data;
    const db = await getDatabase();

    let reportedEntity: Record<string, unknown> | null = null;

    if (data.reportedEntity?.type === "user") {
      const targetId = data.reportedEntity.id;

      if (targetId === user.id) {
        return NextResponse.json(
          { success: false, message: "You cannot report your own account." },
          { status: 400 }
        );
      }

      const targetUser = await db.collection("users").findOne(
        { _id: new ObjectId(targetId) },
        { projection: { _id: 1 } }
      );

      if (!targetUser) {
        return NextResponse.json(
          { success: false, message: "The reported user could not be found." },
          { status: 404 }
        );
      }

      reportedEntity = {
        type: "user",
        id: targetId,
      };
    } else if (data.reportedEntity?.type === "listing") {
      const targetId = data.reportedEntity.id;

      const listing = await db.collection("listings").findOne({
        _id: new ObjectId(targetId),
      });

      if (!listing) {
        return NextResponse.json(
          { success: false, message: "The reported listing could not be found." },
          { status: 404 }
        );
      }

      const ownerId = getEntityOwnerId(listing as Record<string, unknown>);

      if (ownerId === user.id) {
        return NextResponse.json(
          { success: false, message: "You cannot report your own listing." },
          { status: 400 }
        );
      }

      reportedEntity = {
        type: "listing",
        id: targetId,
        label:
          typeof listing.title === "string"
            ? listing.title
            : "Marketplace listing",
      };
    } else if (data.reportedEntity?.type === "platform") {
      reportedEntity = { type: "platform" };
    }

    const rateLimit = await checkRateLimit(user.id);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "You have submitted too many reports. Please try again later.",
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfter) },
        }
      );
    }

    const now = new Date();
    const reportId = randomUUID();
    const referenceNumber = `AGR-${now.getFullYear()}-${randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;

    const report = {
      reportId,
      referenceNumber,
      reporter: {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      category: data.category,
      subject: data.subject,
      description: data.description,
      reportedEntity,
      evidence: [],
      status: "pending",
      priority: "medium",
      adminNotes: [],
      resolution: null,
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
    };

    await db.collection("userReports").insertOne(report);

    return NextResponse.json(
      {
        success: true,
        message: "Your report has been submitted successfully.",
        report: {
          reportId,
          referenceNumber,
          status: "pending",
          createdAt: now,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("User report submission error:", error);

    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while submitting your report." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  await connection();

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Please sign in to view your reports." },
        { status: 401 }
      );
    }

    const pageParam = Number(request.nextUrl.searchParams.get("page") ?? "1");
    const page = Number.isFinite(pageParam)
      ? Math.max(1, Math.floor(pageParam))
      : 1;

    const pageSize = 10;
    const db = await getDatabase();
    const collection = db.collection("userReports");

    const filter = { "reporter.userId": user.id };

    const [reports, total] = await Promise.all([
      collection
        .find(filter, {
          projection: {
            _id: 0,
            reportId: 1,
            referenceNumber: 1,
            category: 1,
            subject: 1,
            description: 1,
            reportedEntity: 1,
            status: 1,
            priority: 1,
            createdAt: 1,
            updatedAt: 1,
            resolvedAt: 1,
          },
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      reports,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("User reports retrieval error:", error);

    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while retrieving your reports." },
      { status: 500 }
    );
  }
}