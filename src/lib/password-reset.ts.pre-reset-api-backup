import "server-only";

import { getDatabase } from "@/lib/mongodb";
import {
  PASSWORD_RESET_TOKEN_EXPIRY_MS,
  generatePasswordResetToken,
  hashPasswordResetToken,
  verifyPasswordResetTokenHash,
} from "@/lib/auth-verification";

export {
  PASSWORD_RESET_TOKEN_EXPIRY_MS,
  generatePasswordResetToken,
  hashPasswordResetToken,
  verifyPasswordResetTokenHash,
};

export type PasswordResetTokenDocument = {
  userId: string;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
};

let indexesPromise: Promise<void> | null = null;

export async function ensurePasswordResetIndexes(): Promise<void> {
  if (!indexesPromise) {
    indexesPromise = (async () => {
      const db = await getDatabase();
      const tokens = db.collection<PasswordResetTokenDocument>(
        "passwordResetTokens"
      );

      await Promise.all([
        tokens.createIndex(
          { userId: 1 },
          {
            unique: true,
            name: "password_reset_user_unique",
          }
        ),
        tokens.createIndex(
          { expiresAt: 1 },
          {
            expireAfterSeconds: 0,
            name: "password_reset_expiry",
          }
        ),
      ]);
    })().catch((error) => {
      indexesPromise = null;
      throw error;
    });
  }

  return indexesPromise;
}
