import "server-only";

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { getDatabase } from "@/lib/mongodb";

export const ADMIN_PHONE_OTP_EXPIRY_MS = 5 * 60 * 1000;
export const ADMIN_PHONE_OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const ADMIN_PHONE_OTP_MAX_ATTEMPTS = 5;

export type AdminPhoneVerificationDocument = {
  adminId: string;
  phone: string;
  codeHash: string;
  attempts: number;
  createdAt: Date;
  expiresAt: Date;
};

function getOtpSecret(): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }

  return secret;
}

export function generateAdminPhoneOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashAdminPhoneOtp(
  adminId: string,
  phone: string,
  code: string
): string {
  return createHmac("sha256", getOtpSecret())
    .update(`${adminId}:${phone}:${code}`)
    .digest("hex");
}

export function verifyAdminPhoneOtpHash(
  storedHash: string,
  adminId: string,
  phone: string,
  code: string
): boolean {
  if (!/^[a-f0-9]{64}$/i.test(storedHash)) {
    return false;
  }

  const expectedHash = Buffer.from(
    hashAdminPhoneOtp(adminId, phone, code),
    "hex"
  );

  const actualHash = Buffer.from(storedHash, "hex");

  return (
    actualHash.length === expectedHash.length &&
    timingSafeEqual(actualHash, expectedHash)
  );
}

let indexesPromise: Promise<void> | null = null;

export async function ensureAdminPhoneVerificationIndexes(): Promise<void> {
  if (!indexesPromise) {
    const db = await getDatabase();
    const collection = db.collection<AdminPhoneVerificationDocument>(
      "adminPhoneVerifications"
    );

    indexesPromise = Promise.all([
      collection.createIndex(
        { adminId: 1 },
        {
          unique: true,
          name: "admin_phone_verification_unique",
        }
      ),
      collection.createIndex(
        { expiresAt: 1 },
        {
          expireAfterSeconds: 0,
          name: "admin_phone_verification_expiry",
        }
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