import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { optionalPhoneSchema } from "@/lib/validation";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Please log in to view your profile." },
        { status: 401 }
      );
    }

    const db = await getDatabase();
    const profile = await db.collection("users").findOne(
      { _id: new ObjectId(currentUser.id) },
      {
        projection: {
          name: 1,
          email: 1,
          phone: 1,
          role: 1,
          phonePublic: 1,
          whatsappEnabled: 1,
          emailPublic: 1,
          phoneVerified: 1,
          phoneVerifiedAt: 1,
          smsNotificationsEnabled: 1,
          smsConsentAt: 1,
        },
      }
    );

    if (!profile) {
      return NextResponse.json(
        { message: "Profile not found." },
        { status: 404 }
      );
    }

    const hasPhone = Boolean(String(profile.phone ?? "").trim());
    const phoneVerified = hasPhone && profile.phoneVerified === true;

    return NextResponse.json({
      profile: {
        name: String(profile.name ?? ""),
        email: String(profile.email ?? ""),
        phone: String(profile.phone ?? ""),
        role: String(profile.role ?? ""),
        phonePublic: hasPhone && profile.phonePublic !== false,
        whatsappEnabled: hasPhone && profile.whatsappEnabled !== false,
        emailPublic: profile.emailPublic === true,
        phoneVerified,
        phoneVerifiedAt: phoneVerified
          ? profile.phoneVerifiedAt ?? null
          : null,
        smsNotificationsEnabled:
          phoneVerified && profile.smsNotificationsEnabled === true,
        smsConsentAt:
          phoneVerified && profile.smsNotificationsEnabled === true
            ? profile.smsConsentAt ?? null
            : null,
      },
    });
  } catch (error) {
    console.error("Profile retrieval failed:", error);

    return NextResponse.json(
      { message: "Unable to load your profile." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Please log in to update your profile." },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Invalid profile data." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;
    const name = typeof data.name === "string" ? data.name.trim() : "";
    let phone = typeof data.phone === "string" ? data.phone.trim() : "";
    const phonePublic = data.phonePublic;
    const whatsappEnabled = data.whatsappEnabled;
    const emailPublic = data.emailPublic;
    const smsNotificationsEnabled = data.smsNotificationsEnabled;

    if (name.length < 2 || name.length > 80) {
      return NextResponse.json(
        { message: "Name must be 2-80 characters." },
        { status: 400 }
      );
    }

    const phoneResult = optionalPhoneSchema.safeParse(phone);

    if (!phoneResult.success) {
      return NextResponse.json(
        {
          message:
            phoneResult.error.issues[0]?.message ??
            "Enter a valid phone number.",
        },
        { status: 400 }
      );
    }

    phone = phoneResult.data;

    if (
      typeof phonePublic !== "boolean" ||
      typeof whatsappEnabled !== "boolean" ||
      typeof emailPublic !== "boolean"
    ) {
      return NextResponse.json(
        { message: "Choose valid contact preferences." },
        { status: 400 }
      );
    }

    if (
      smsNotificationsEnabled !== undefined &&
      typeof smsNotificationsEnabled !== "boolean"
    ) {
      return NextResponse.json(
        { message: "Choose a valid SMS notification preference." },
        { status: 400 }
      );
    }

    if (phonePublic && !phone) {
      return NextResponse.json(
        { message: "Add a phone number before making it public." },
        { status: 400 }
      );
    }

    if (whatsappEnabled && !phone) {
      return NextResponse.json(
        { message: "Add a phone number before enabling WhatsApp." },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const users = db.collection("users");
    const userId = new ObjectId(currentUser.id);

    const existingProfile = await users.findOne(
      { _id: userId },
      {
        projection: {
          phone: 1,
          phoneVerified: 1,
          phoneVerifiedAt: 1,
          smsNotificationsEnabled: 1,
          smsConsentAt: 1,
        },
      }
    );

    if (!existingProfile) {
      return NextResponse.json(
        { message: "Profile not found." },
        { status: 404 }
      );
    }

    const previousPhone = String(existingProfile.phone ?? "").trim();
    const phoneChanged = previousPhone !== phone;
    const now = new Date();

    if (
      smsNotificationsEnabled === true &&
      (phoneChanged || !phone || existingProfile.phoneVerified !== true)
    ) {
      return NextResponse.json(
        {
          message:
            "Verify your current phone number before enabling SMS notifications.",
        },
        { status: 400 }
      );
    }

    const updateFields: Record<string, unknown> = {
      name,
      phone,
      phonePublic: phonePublic && Boolean(phone),
      whatsappEnabled: whatsappEnabled && Boolean(phone),
      emailPublic,
      updatedAt: now,
    };

    if (phoneChanged || !phone) {
      updateFields.phoneVerified = false;
      updateFields.phoneVerifiedAt = null;
      updateFields.smsNotificationsEnabled = false;
      updateFields.smsConsentAt = null;
    } else if (smsNotificationsEnabled !== undefined) {
      updateFields.smsNotificationsEnabled = smsNotificationsEnabled;
      updateFields.smsConsentAt = smsNotificationsEnabled
        ? existingProfile.smsNotificationsEnabled === true
          ? existingProfile.smsConsentAt ?? now
          : now
        : null;
    }

    const result = await users.updateOne(
      { _id: userId, phone: existingProfile.phone ?? null },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          message:
            "Your profile changed while you were updating it. Please refresh and try again.",
        },
        { status: 409 }
      );
    }

    if (phoneChanged) {
      await db.collection("phoneVerifications").deleteOne({
        userId: currentUser.id,
      });
    }

    const phoneVerified =
      !phoneChanged &&
      Boolean(phone) &&
      existingProfile.phoneVerified === true;

    const smsEnabled = phoneVerified &&
      (smsNotificationsEnabled === undefined
        ? existingProfile.smsNotificationsEnabled === true
        : smsNotificationsEnabled === true);

    return NextResponse.json({
      success: true,
      message: "Your profile has been updated.",
      profile: {
        name,
        email: currentUser.email,
        phone,
        role: currentUser.role,
        phonePublic: phonePublic && Boolean(phone),
        whatsappEnabled: whatsappEnabled && Boolean(phone),
        emailPublic,
        phoneVerified,
        phoneVerifiedAt: phoneVerified
          ? existingProfile.phoneVerifiedAt ?? null
          : null,
        smsNotificationsEnabled: smsEnabled,
        smsConsentAt: smsEnabled
          ? updateFields.smsConsentAt ?? existingProfile.smsConsentAt ?? null
          : null,
      },
    });
  } catch (error) {
    console.error("Profile update failed:", error);

    return NextResponse.json(
      { message: "Unable to update your profile. Please try again." },
      { status: 500 }
    );
  }
}
