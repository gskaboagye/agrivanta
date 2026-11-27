import "server-only";

import { createHash } from "node:crypto";
import { getDatabase } from "@/lib/mongodb";

type RateLimitDocument = {
  _id: string;
  count: number;
  resetAt: Date;
};

let indexPromise: Promise<void> | null = null;

async function ensureRateLimitIndex() {
  if (!indexPromise) {
    indexPromise = (async () => {
      const db = await getDatabase();
      await db.collection<RateLimitDocument>("rateLimits").createIndex(
        { resetAt: 1 },
        { expireAfterSeconds: 0, name: "rate_limit_expiry" }
      );
    })().catch((error) => {
      indexPromise = null;
      throw error;
    });
  }

  return indexPromise;
}

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function getRequestClientAddress(request: Request) {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";

  return "unknown";
}

/**
 * Consumes one attempt from a MongoDB-backed fixed-window rate limit.
 * The atomic update works across serverless instances, unlike in-memory counters.
 */
export async function consumeRateLimit(input: {
  scope: string;
  identifier: string;
  limit: number;
  windowMs: number;
}): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  if (
    !input.scope ||
    !input.identifier ||
    !Number.isInteger(input.limit) ||
    input.limit < 1 ||
    !Number.isFinite(input.windowMs) ||
    input.windowMs < 1000
  ) {
    throw new Error("Invalid rate-limit configuration.");
  }

  await ensureRateLimitIndex();

  const now = new Date();
  const nextReset = new Date(now.getTime() + input.windowMs);
  const key = digest(`${input.scope}:${input.identifier.toLowerCase()}`);
  const stillActive = { $gt: ["$resetAt", now] };

  const db = await getDatabase();
  const bucket = await db.collection<RateLimitDocument>("rateLimits").findOneAndUpdate(
    { _id: key },
    [
      {
        $set: {
          count: {
            $cond: [
              stillActive,
              { $add: [{ $ifNull: ["$count", 0] }, 1] },
              1,
            ],
          },
          resetAt: {
            $cond: [stillActive, "$resetAt", nextReset],
          },
        },
      },
    ],
    { upsert: true, returnDocument: "after", includeResultMetadata: false }
  );

  if (!bucket) {
    throw new Error("Unable to apply rate limit.");
  }

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((bucket.resetAt.getTime() - now.getTime()) / 1000)
  );

  return {
    allowed: bucket.count <= input.limit,
    remaining: Math.max(0, input.limit - bucket.count),
    retryAfterSeconds,
  };
}
