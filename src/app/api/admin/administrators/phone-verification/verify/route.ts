import { connection, NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/mongodb";
import {
  ensureAdminPhoneVerificationIndexes,
  verifyAdminPhoneOtpHash,
  ADMIN_PHONE_OTP_MAX_ATTEMPTS,
  type AdminPhoneVerificationDocument,
} from "@/lib/admin-phone-verification";

const verificationSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the six-digit verification code."),
}).strict();

export async function POST(request: NextRequest) {
  await connection();

  try {
    const origin = request.headers.get("origin");

    if (!origin || origin !== request.nextUrl.origin) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    const admin = await requireAdmin();

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

    await ensureAdminPhoneVerificationIndexes();

    const administrators = db.collection("administrators");

    const administrator = await administrators.findOne(
      {
        _id: new ObjectId(admin.id),
        status: "active",
      },
      {
        projection: {
          phone: 1,
          phoneVerified: 1,
        },
      }
    );

    if (!administrator) {
      return NextResponse.json(
        {
          success: false,
          message: "Active administrator account not found.",
        },
        { status: 404 }
      );
    }

    const phone = String(administrator.phone ?? "").trim();

    if (!/^\+233\d{9}$/.test(phone)) {
      return NextResponse.json(
        {
          success: false,
          message: "Add a valid Ghanaian phone number to your profile first.",
        },
        { status: 400 }
      );
    }

    if (administrator.phoneVerified === true) {
      return NextResponse.json({
        success: true,
        message: "This phone number is already verified.",
        phoneVerified: true,
      });
    }

    const verifications =
      db.collection<AdminPhoneVerificationDocument>(
        "adminPhoneVerifications"
      );

    const now = new Date();

    const verification = await verifications.findOne({
      adminId: admin.id,
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
        adminId: admin.id,
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

    if (verification.attempts >= ADMIN_PHONE_OTP_MAX_ATTEMPTS) {
      await verifications.deleteOne({
        adminId: admin.id,
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

    const codeIsValid = verifyAdminPhoneOtpHash(
      verification.codeHash,
      admin.id,
      phone,
      validation.data.code
    );

    if (!codeIsValid) {
      const updated = await verifications.findOneAndUpdate(
        {
          adminId: admin.id,
          phone,
          codeHash: verification.codeHash,
          expiresAt: { $gt: now },
          attempts: { $lt: ADMIN_PHONE_OTP_MAX_ATTEMPTS },
        },
        { $inc: { attempts: 1 } },
        {
          returnDocument: "after",
          includeResultMetadata: false,
        }
      );

      if (
        updated &&
        updated.attempts >= ADMIN_PHONE_OTP_MAX_ATTEMPTS
      ) {
        await verifications.deleteOne({
          adminId: admin.id,
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

    // Atomically consume the OTP to prevent reuse.
    const consumed = await verifications.deleteOne({
      adminId: admin.id,
      phone,
      codeHash: verification.codeHash,
      expiresAt: { $gt: now },
      attempts: { $lt: ADMIN_PHONE_OTP_MAX_ATTEMPTS },
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

    const updateResult = await administrators.updateOne(
      {
        _id: new ObjectId(admin.id),
        status: "active",
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
          message: "Your phone number changed. Request a new verification code.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your administrator phone number has been verified successfully.",
      phoneVerified: true,
      phoneVerifiedAt: now,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ADMIN_UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Administrator authentication required.",
        },
        { status: 401 }
      );
    }

    console.error("Administrator phone verification failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to verify your phone number right now.",
      },
      { status: 500 }
    );
  }
}