
import { connection, NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/mongodb";

const profileSchema = z.object({
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^\+233\d{9}$/, "Enter a valid Ghanaian number in +233 format."),
  smsNotificationsEnabled: z.boolean(),
});

function handleAdminError(error: unknown) {
  if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") {
    return NextResponse.json(
      { success: false, message: "Administrator authentication required." },
      { status: 401 }
    );
  }

  console.error("Administrator profile error:", error);

  return NextResponse.json(
    { success: false, message: "Unable to process administrator profile." },
    { status: 500 }
  );
}

export async function GET() {
  await connection();

  try {
    const admin = await requireAdmin();
    const db = await getDatabase();

    const profile = await db.collection("administrators").findOne(
      { _id: new ObjectId(admin.id) },
      {
        projection: {
          _id: 0,
          phone: 1,
          phoneVerified: 1,
          smsNotificationsEnabled: 1,
        },
      }
    );

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Administrator profile not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        phone: profile.phone ?? "",
        phoneVerified: profile.phoneVerified === true,
        smsNotificationsEnabled:
          profile.smsNotificationsEnabled === true,
      },
    });
  } catch (error) {
    return handleAdminError(error);
  }
}

export async function PATCH(request: NextRequest) {
  await connection();

  try {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (!origin || !host || new URL(origin).host !== host) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    const admin = await requireAdmin();

    const body: unknown = await request.json();
    const validation = profileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please check your profile details.",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const administrators = db.collection("administrators");

    const existing = await administrators.findOne(
      { _id: new ObjectId(admin.id) },
      { projection: { phone: 1, phoneVerified: 1 } }
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Administrator profile not found." },
        { status: 404 }
      );
    }

    const phoneChanged = existing.phone !== validation.data.phone;

    await administrators.updateOne(
      { _id: new ObjectId(admin.id) },
      {
        $set: {
          phone: validation.data.phone,
          phoneVerified: phoneChanged
            ? false
            : existing.phoneVerified === true,
          smsNotificationsEnabled: validation.data.smsNotificationsEnabled,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: phoneChanged
        ? "Phone number saved. Verify it before SMS notifications can be sent."
        : "Administrator notification preferences updated.",
      profile: {
        phone: validation.data.phone,
        phoneVerified: phoneChanged
          ? false
          : existing.phoneVerified === true,
        smsNotificationsEnabled: validation.data.smsNotificationsEnabled,
      },
    });
  } catch (error) {
    return handleAdminError(error);
  }
}
