
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";

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
        },
      }
    );

    if (!profile) {
      return NextResponse.json(
        { message: "Profile not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      profile: {
        name: String(profile.name ?? ""),
        email: String(profile.email ?? ""),
        phone: String(profile.phone ?? ""),
        role: String(profile.role ?? ""),
        phonePublic: profile.phonePublic === true,
        whatsappEnabled: profile.whatsappEnabled === true,
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
    const phone = typeof data.phone === "string" ? data.phone.trim() : "";
    const phonePublic = data.phonePublic;
    const whatsappEnabled = data.whatsappEnabled;

    if (name.length < 2 || name.length > 80) {
      return NextResponse.json(
        { message: "Name must be 2–80 characters." },
        { status: 400 }
      );
    }

    if (phone.length > 30 || (phone && !/^[+\d\s().-]+$/.test(phone))) {
      return NextResponse.json(
        { message: "Enter a valid phone number." },
        { status: 400 }
      );
    }

    if (typeof phonePublic !== "boolean" ||
        typeof whatsappEnabled !== "boolean") {
      return NextResponse.json(
        { message: "Choose valid contact preferences." },
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

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(currentUser.id) },
      {
        $set: {
          name,
          phone,
          phonePublic: phonePublic && Boolean(phone),
          whatsappEnabled: whatsappEnabled && Boolean(phone),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Profile not found." },
        { status: 404 }
      );
    }

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
