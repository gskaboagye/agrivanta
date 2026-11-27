import { connection, NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { consumeRateLimit, getRequestClientAddress } from "@/lib/rate-limit";
import { isAccountDisabled } from "@/lib/auth";
import { sendAuthVerificationEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import {
  AUTH_OTP_CHANNELS,
  AUTH_OTP_PURPOSES,
  AUTH_OTP_EXPIRY_MS,
  AUTH_OTP_RESEND_COOLDOWN_MS,
  generateAuthOtp,
  hashAuthOtp,
  ensureAuthVerificationIndexes,
  type AuthOtpChannel,
  type AuthOtpPurpose,
  type AuthVerificationDocument,
} from "@/lib/auth-verification";

function invalidOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin !== request.nextUrl.origin);
}

export async function POST(request: NextRequest) {
  await connection();

  try {
    const requestLimit = await consumeRateLimit({
      scope: "verification-request-ip",
      identifier: getRequestClientAddress(request),
      limit: 10,
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

    const channel = data.channel;
    const purpose = data.purpose;

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof channel !== "string" ||
      !AUTH_OTP_CHANNELS.includes(channel as AuthOtpChannel) ||
      typeof purpose !== "string" ||
      !AUTH_OTP_PURPOSES.includes(purpose as AuthOtpPurpose)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid verification request." },
        { status: 400 }
      );
    }

    const selectedChannel = channel as AuthOtpChannel;
    const selectedPurpose = purpose as AuthOtpPurpose;

    const db = await getDatabase();
    const users = db.collection("users");

    const user = await users.findOne({ email });

    // Password recovery must not disclose whether an account exists.
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If the account and selected contact method are eligible, a code will be sent.",
      });
    }

    if (isAccountDisabled(user)) {
      return NextResponse.json({
        success: true,
        message: "If the account and selected contact method are eligible, a code will be sent.",
      });
    }

    if (selectedPurpose === "registration" && user.accountVerified === true) {
      return NextResponse.json(
        { success: false, message: "This account has already been verified. Please log in." },
        { status: 409 }
      );
    }

    if (selectedPurpose === "password-reset" && user.accountVerified !== true) {
      return NextResponse.json({
        success: true,
        message: "If the account and selected contact method are eligible, a code will be sent.",
      });
    }

    let destination = "";

    if (selectedChannel === "email") {
      if (
        selectedPurpose === "password-reset" &&
        user.emailVerified !== true
      ) {
        return NextResponse.json({
          success: true,
          message: "If the account and selected contact method are eligible, a code will be sent.",
        });
      }

      destination = String(user.email ?? "").trim().toLowerCase();
    } else {
      destination = String(user.phone ?? "").replace(/[\s()-]/g, "");

      if (!/^\+233\d{9}$/.test(destination)) {
        return NextResponse.json(
          {
            success: false,
            message: "Add a valid Ghanaian phone number to your account before requesting SMS verification.",
          },
          { status: 400 }
        );
      }

      if (
        selectedPurpose === "password-reset" &&
        user.phoneVerified !== true
      ) {
        return NextResponse.json({
          success: true,
          message: "If the account and selected contact method are eligible, a code will be sent.",
        });
      }
    }

    if (selectedChannel === "sms" && process.env.ARKESEL_SMS_ENABLED !== "true") {
      return NextResponse.json(
        {
          success: false,
          message: "SMS verification is temporarily unavailable. Please choose email instead.",
        },
        { status: 503 }
      );
    }

    await ensureAuthVerificationIndexes();

    const userId = user._id.toString();
    const now = new Date();
    const cooldownCutoff = new Date(
      now.getTime() - AUTH_OTP_RESEND_COOLDOWN_MS
    );

    const code = generateAuthOtp();

    const codeHash = hashAuthOtp(
      userId,
      selectedPurpose,
      selectedChannel,
      destination,
      code
    );

    const verification: AuthVerificationDocument = {
      userId,
      purpose: selectedPurpose,
      channel: selectedChannel,
      destination,
      codeHash,
      attempts: 0,
      createdAt: now,
      expiresAt: new Date(now.getTime() + AUTH_OTP_EXPIRY_MS),
    };

    const verifications =
      db.collection<AuthVerificationDocument>("authVerifications");

    try {
      await verifications.findOneAndUpdate(
        {
          userId,
          purpose: selectedPurpose,
          channel: selectedChannel,
          $or: [
            { createdAt: { $lte: cooldownCutoff } },
            { createdAt: { $exists: false } },
          ],
        },
        { $set: verification },
        {
          upsert: true,
          returnDocument: "after",
          includeResultMetadata: false,
        }
      );
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === 11000
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Please wait one minute before requesting another code.",
          },
          { status: 429 }
        );
      }

      throw error;
    }

    let deliverySuccess = false;

    if (selectedChannel === "email") {
      const result = await sendAuthVerificationEmail({
        to: destination,
        userName: String(user.name ?? "AgriVanta user"),
        code,
        purpose: selectedPurpose,
      });

      deliverySuccess = result.success;

      if (!result.success) {
        console.error("Authentication email delivery failed:", result.error);
      }
    } else {
      const result = await sendSms({
        recipient: destination,
        message: `Your AgriVanta verification code is ${code}. It expires in 5 minutes. Do not share this code with anyone.`,
      });

      deliverySuccess = result.success;

      if (!result.success) {
        console.error("Authentication SMS delivery failed:", result.message);
      }
    }

    if (!deliverySuccess) {
      await verifications.deleteOne({
        userId,
        purpose: selectedPurpose,
        channel: selectedChannel,
        codeHash,
      });

      return NextResponse.json(
        {
          success: false,
          message: "We could not send your verification code. Please try again later or choose another method.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `A verification code has been sent to your ${selectedChannel === "email" ? "email address" : "phone number"}.`,
      expiresInSeconds: AUTH_OTP_EXPIRY_MS / 1000,
      resendAfterSeconds: AUTH_OTP_RESEND_COOLDOWN_MS / 1000,
    });
  } catch (error) {
    console.error("Authentication verification request failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to request a verification code right now.",
      },
      { status: 500 }
    );
  }
}
