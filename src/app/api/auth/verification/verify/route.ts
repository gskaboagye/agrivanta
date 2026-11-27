import { connection, NextRequest, NextResponse } from "next/server";
import { consumeRateLimit, getRequestClientAddress } from "@/lib/rate-limit";
import { getDatabase, getMongoClient } from "@/lib/mongodb";
import { isAccountDisabled } from "@/lib/auth";
import {
  AUTH_OTP_CHANNELS,
  AUTH_OTP_MAX_ATTEMPTS,
  AUTH_OTP_PURPOSES,
  ensureAuthVerificationIndexes,
  verifyAuthOtpHash,
  type AuthOtpChannel,
  type AuthOtpPurpose,
  type AuthVerificationDocument,
} from "@/lib/auth-verification";
import {
  ensurePasswordResetIndexes,
  generatePasswordResetToken,
  hashPasswordResetToken,
  PASSWORD_RESET_TOKEN_EXPIRY_MS,
  type PasswordResetTokenDocument,
} from "@/lib/password-reset";

function invalidOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin !== request.nextUrl.origin);
}

export async function POST(request: NextRequest) {
  await connection();

  try {
    const requestLimit = await consumeRateLimit({
      scope: "verification-verify-ip",
      identifier: getRequestClientAddress(request),
      limit: 15,
      windowMs: 900000,
    });
    if (!requestLimit.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": String(requestLimit.retryAfterSeconds) } }
      );
    }


    if (invalidOrigin(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request data." },
        { status: 400 }
      );
    }

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

    const code =
      typeof data.code === "string" ? data.code.trim() : "";

    const channel = data.channel;
    const purpose = data.purpose;

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !/^\d{6}$/.test(code) ||
      typeof channel !== "string" ||
      !AUTH_OTP_CHANNELS.includes(channel as AuthOtpChannel) ||
      typeof purpose !== "string" ||
      !AUTH_OTP_PURPOSES.includes(purpose as AuthOtpPurpose)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid verification request and six-digit code.",
        },
        { status: 400 }
      );
    }

    const selectedChannel = channel as AuthOtpChannel;
    const selectedPurpose = purpose as AuthOtpPurpose;

    const db = await getDatabase();
    await ensureAuthVerificationIndexes();

    const users = db.collection("users");
    const user = await users.findOne({ email });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired verification code.",
        },
        { status: 400 }
      );
    }

    if (isAccountDisabled(user)) {
      return NextResponse.json(
        {
          success: false,
          message: "This account is unavailable.",
        },
        { status: 403 }
      );
    }

    if (selectedPurpose === "registration" && user.accountVerified === true) {
      return NextResponse.json(
        {
          success: true,
          message: "Your account is already verified.",
        }
      );
    }

    if (
      selectedPurpose === "password-reset" &&
      user.accountVerified !== true
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired verification code.",
        },
        { status: 400 }
      );
    }

    if (
      selectedPurpose === "password-reset" &&
      selectedChannel === "email" &&
      user.emailVerified !== true
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired verification code.",
        },
        { status: 400 }
      );
    }

    if (
      selectedPurpose === "password-reset" &&
      selectedChannel === "sms" &&
      user.phoneVerified !== true
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired verification code.",
        },
        { status: 400 }
      );
    }

    const userId = user._id.toString();

    const destination =
      selectedChannel === "email"
        ? String(user.email ?? "").trim().toLowerCase()
        : String(user.phone ?? "").replace(/[\s()-]/g, "");

    if (!destination) {
      return NextResponse.json(
        {
          success: false,
          message: "The selected contact method is unavailable.",
        },
        { status: 400 }
      );
    }

    const verifications =
      db.collection<AuthVerificationDocument>("authVerifications");

    const now = new Date();

    const verification = await verifications.findOne({
      userId,
      purpose: selectedPurpose,
      channel: selectedChannel,
      destination,
    });

    if (!verification) {
      return NextResponse.json(
        {
          success: false,
          message: "No active verification code was found. Request a new code.",
        },
        { status: 400 }
      );
    }

    if (verification.expiresAt.getTime() <= now.getTime()) {
      await verifications.deleteOne({
        userId,
        purpose: selectedPurpose,
        channel: selectedChannel,
        codeHash: verification.codeHash,
      });

      return NextResponse.json(
        {
          success: false,
          message: "Your verification code has expired. Request a new code.",
        },
        { status: 400 }
      );
    }

    if (verification.attempts >= AUTH_OTP_MAX_ATTEMPTS) {
      await verifications.deleteOne({
        userId,
        purpose: selectedPurpose,
        channel: selectedChannel,
        codeHash: verification.codeHash,
      });

      return NextResponse.json(
        {
          success: false,
          message: "Too many incorrect attempts. Request a new code.",
        },
        { status: 429 }
      );
    }

    const validCode = verifyAuthOtpHash(
      verification.codeHash,
      userId,
      selectedPurpose,
      selectedChannel,
      destination,
      code
    );

    if (!validCode) {
      const updated = await verifications.findOneAndUpdate(
        {
          userId,
          purpose: selectedPurpose,
          channel: selectedChannel,
          destination,
          codeHash: verification.codeHash,
          expiresAt: { $gt: now },
          attempts: { $lt: AUTH_OTP_MAX_ATTEMPTS },
        },
        { $inc: { attempts: 1 } },
        {
          returnDocument: "after",
          includeResultMetadata: false,
        }
      );

      if (updated && updated.attempts >= AUTH_OTP_MAX_ATTEMPTS) {
        await verifications.deleteOne({
          userId,
          purpose: selectedPurpose,
          channel: selectedChannel,
          codeHash: verification.codeHash,
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: updated
            ? "Incorrect verification code. Please try again."
            : "This verification code is no longer active. Request a new code.",
        },
        { status: updated ? 400 : 429 }
      );
    }

    const client = await getMongoClient();
    const session = client.startSession();

    if (selectedPurpose === "password-reset") {
      await ensurePasswordResetIndexes();

      const resetToken = generatePasswordResetToken();
      const resetTokenDocument: PasswordResetTokenDocument = {
        userId,
        tokenHash: hashPasswordResetToken(resetToken),
        createdAt: now,
        expiresAt: new Date(
          now.getTime() + PASSWORD_RESET_TOKEN_EXPIRY_MS
        ),
      };

      const resetTokens =
        db.collection<PasswordResetTokenDocument>("passwordResetTokens");

      try {
        await session.withTransaction(async () => {
          const currentUser = await users.findOne(
            {
              _id: user._id,
              accountVerified: true,
              status: { $ne: "disabled" },
              disabled: { $ne: true },
            },
            { session }
          );

          if (!currentUser) {
            throw new Error("ACCOUNT_NOT_ELIGIBLE");
          }

          const consumed = await verifications.deleteOne(
            {
              userId,
              purpose: "password-reset",
              channel: selectedChannel,
              destination,
              codeHash: verification.codeHash,
              expiresAt: { $gt: now },
              attempts: { $lt: AUTH_OTP_MAX_ATTEMPTS },
            },
            { session }
          );

          if (consumed.deletedCount !== 1) {
            throw new Error("OTP_CONSUMPTION_FAILED");
          }

          await resetTokens.replaceOne(
            { userId },
            resetTokenDocument,
            { upsert: true, session }
          );
        });

        return NextResponse.json({
          success: true,
          message: "Your recovery code has been verified. You can now choose a new password.",
          resetToken,
          expiresInSeconds: PASSWORD_RESET_TOKEN_EXPIRY_MS / 1000,
        });
      } catch (error) {
        console.error("Password-reset verification transaction failed:", error);

        return NextResponse.json(
          {
            success: false,
            message:
              "Unable to complete password recovery verification. Please request a new code.",
          },
          { status: 409 }
        );
      } finally {
        await session.endSession();
      }
    }

    const verificationUpdate =
      selectedChannel === "email"
        ? {
            emailVerified: true,
            emailVerifiedAt: now,
            accountVerified: true,
            accountVerifiedAt: now,
            updatedAt: now,
          }
        : {
            phoneVerified: true,
            phoneVerifiedAt: now,
            accountVerified: true,
            accountVerifiedAt: now,
            updatedAt: now,
          };

    try {
      await session.withTransaction(async () => {
        const updateResult = await users.updateOne(
          {
            _id: user._id,
            accountVerified: { $ne: true },
          },
          { $set: verificationUpdate },
          { session }
        );

        if (updateResult.matchedCount !== 1) {
          throw new Error("ACCOUNT_UPDATE_FAILED");
        }

        const consumed = await verifications.deleteOne(
          {
            userId,
            purpose: "registration",
            channel: selectedChannel,
            destination,
            codeHash: verification.codeHash,
            expiresAt: { $gt: now },
            attempts: { $lt: AUTH_OTP_MAX_ATTEMPTS },
          },
          { session }
        );

        if (consumed.deletedCount !== 1) {
          throw new Error("OTP_CONSUMPTION_FAILED");
        }
      });
    } catch (error) {
      console.error("Account verification transaction failed:", error);

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to complete verification. Your code may no longer be active. Please request a new code if necessary.",
        },
        { status: 409 }
      );
    } finally {
      await session.endSession();
    }

    return NextResponse.json({
      success: true,
      message:
        "Your AgriVanta account has been verified successfully. You can now log in.",
      accountVerified: true,
      verifiedChannel: selectedChannel,
    });
  } catch (error) {
    console.error("Authentication verification failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to verify your account right now.",
      },
      { status: 500 }
    );
  }
}
