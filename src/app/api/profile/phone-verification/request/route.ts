import { connection, NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { sendSms } from "@/lib/sms";
import {
  ensurePhoneVerificationIndexes,
  generatePhoneOtp,
  hashPhoneOtp,
  PHONE_OTP_EXPIRY_MS,
  PHONE_OTP_RESEND_COOLDOWN_MS,
  type PhoneVerificationDocument,
} from "@/lib/phone-verification";

function invalidOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");

  return Boolean(origin && origin !== request.nextUrl.origin);
}

export async function POST(request: NextRequest) {
  await connection();

  try {
    if (invalidOrigin(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Please log in to verify your phone." },
        { status: 401 }
      );
    }

    if (process.env.ARKESEL_SMS_ENABLED !== "true") {
      return NextResponse.json(
        {
          success: false,
          message: "Phone verification is temporarily unavailable.",
        },
        { status: 503 }
      );
    }

    const db = await getDatabase();

    await ensurePhoneVerificationIndexes();

    const profile = await db.collection("users").findOne(
      { _id: new ObjectId(user.id) },
      { projection: { phone: 1 } }
    );

    const phone = String(profile?.phone ?? "").trim();

    if (!/^\+233\d{9}$/.test(phone)) {
      return NextResponse.json(
        {
          success: false,
          message: "Add a valid Ghanaian phone number to your profile first.",
        },
        { status: 400 }
      );
    }

    const collection =
      db.collection<PhoneVerificationDocument>("phoneVerifications");

    const now = new Date();
    const cooldownCutoff = new Date(
      now.getTime() - PHONE_OTP_RESEND_COOLDOWN_MS
    );

    const code = generatePhoneOtp();
    const codeHash = hashPhoneOtp(user.id, phone, code);

    const verification: PhoneVerificationDocument = {
      userId: user.id,
      phone,
      codeHash,
      attempts: 0,
      createdAt: now,
      expiresAt: new Date(now.getTime() + PHONE_OTP_EXPIRY_MS),
    };

    try {
      await collection.findOneAndUpdate(
        {
          userId: user.id,
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

    const result = await sendSms({
      recipient: phone,
      message: `Your AgriVanta phone verification code is ${code}. It expires in 5 minutes. Do not share this code with anyone.`,
    });

    if (!result.success) {
      // Keep the verification record so failed delivery
      // cannot bypass the 60-second resend cooldown.
      // The stored OTP remains hashed and expires normally.
      console.error("Phone verification SMS failed:", result.message);

      return NextResponse.json(
        {
          success: false,
          message: "We could not send your verification code. Please try again later.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "A verification code has been sent to your phone.",
      expiresInSeconds: PHONE_OTP_EXPIRY_MS / 1000,
      resendAfterSeconds: PHONE_OTP_RESEND_COOLDOWN_MS / 1000,
    });
  } catch (error) {
    console.error("Phone verification request failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to request phone verification right now.",
      },
      { status: 500 }
    );
  }
}


