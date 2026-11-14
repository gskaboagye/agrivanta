import { connection, NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import {
  ensurePhoneVerificationIndexes,
  verifyPhoneOtpHash,
  PHONE_OTP_MAX_ATTEMPTS,
  type PhoneVerificationDocument,
} from "@/lib/phone-verification";

const verificationSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the six-digit verification code."),
}).strict();

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
        { success: false, message: "Please log in to verify your phone." },
        { status: 401 }
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

    const validation = verificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid six-digit verification code.",
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    await ensurePhoneVerificationIndexes();

    const users = db.collection("users");
    const profile = await users.findOne(
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

    const verifications =
      db.collection<PhoneVerificationDocument>("phoneVerifications");

    const now = new Date();

    const verification = await verifications.findOne({
      userId: user.id,
      phone,
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
        userId: user.id,
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

    if (verification.attempts >= PHONE_OTP_MAX_ATTEMPTS) {
      await verifications.deleteOne({
        userId: user.id,
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

    const codeIsValid = verifyPhoneOtpHash(
      verification.codeHash,
      user.id,
      phone,
      validation.data.code
    );

    if (!codeIsValid) {
      const updated = await verifications.findOneAndUpdate(
        {
          userId: user.id,
          phone,
          codeHash: verification.codeHash,
          expiresAt: { $gt: now },
          attempts: { $lt: PHONE_OTP_MAX_ATTEMPTS },
        },
        { $inc: { attempts: 1 } },
        {
          returnDocument: "after",
          includeResultMetadata: false,
        }
      );

      if (updated && updated.attempts >= PHONE_OTP_MAX_ATTEMPTS) {
        await verifications.deleteOne({
          userId: user.id,
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

    // Atomically consume the OTP so it cannot be reused.
    const consumed = await verifications.deleteOne({
      userId: user.id,
      phone,
      codeHash: verification.codeHash,
      expiresAt: { $gt: now },
      attempts: { $lt: PHONE_OTP_MAX_ATTEMPTS },
    });

    if (consumed.deletedCount !== 1) {
      return NextResponse.json(
        {
          success: false,
          message: "This verification code is no longer active. Request a new code.",
        },
        { status: 400 }
      );
    }

    const updateResult = await users.updateOne(
      {
        _id: new ObjectId(user.id),
        phone,
      },
      {
        $set: {
          phoneVerified: true,
          phoneVerifiedAt: now,
          updatedAt: now,
        },
      }
    );

    if (updateResult.matchedCount !== 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Your phone number changed. Please request a new verification code.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your phone number has been verified successfully.",
      phoneVerified: true,
      phoneVerifiedAt: now,
    });
  } catch (error) {
    console.error("Phone verification failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to verify your phone number right now.",
      },
      { status: 500 }
    );
  }
}
