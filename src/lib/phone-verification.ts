import "server-only";

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { getDatabase } from "@/lib/mongodb";

export const PHONE_OTP_EXPIRY_MS = 5 * 60 * 1000;
export const PHONE_OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const PHONE_OTP_MAX_ATTEMPTS = 5;

export type PhoneVerificationDocument = {
  userId: string;
  phone: string;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
};

function getOtpSecret(): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }

  return secret;
}

export function generatePhoneOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashPhoneOtp(
  userId: string,
  phone: string,
  code: string
): string {
  return createHmac("sha256", getOtpSecret())
    .update(`${userId}:${phone}:${code}`)
    .digest("hex");
}

export function verifyPhoneOtpHash(
  storedHash: string,
  userId: string,
  phone: string,
  code: string
): boolean {
  const expectedHash = Buffer.from(
    hashPhoneOtp(userId, phone, code),
    "hex"
  );

  let actualHash: Buffer;

  try {
    actualHash = Buffer.from(storedHash, "hex");
  } catch {
    return false;
  }

  if (
    actualHash.length !== expectedHash.length ||
    actualHash.length === 0
  ) {
    return false;
  }

  return timingSafeEqual(actualHash, expectedHash);
}

let indexesPromise: Promise<void> | null = null;

export async function ensurePhoneVerificationIndexes(): Promise<void> {
  if (!indexesPromise) {
    const db = await getDatabase();

    indexesPromise = Promise.all([
      db.collection<PhoneVerificationDocument>("phoneVerifications")
        .createIndex(
          { userId: 1 },
          { unique: true, name: "phone_verification_user_unique" }
        ),

      db.collection<PhoneVerificationDocument>("phoneVerifications")
        .createIndex(
          { expiresAt: 1 },
          { expireAfterSeconds: 0, name: "phone_verification_expiry" }
        ),
    ])
      .then(() => undefined)
      .catch((error) => {
        indexesPromise = null;
        throw error;
      });
  }

  return indexesPromise;
}
