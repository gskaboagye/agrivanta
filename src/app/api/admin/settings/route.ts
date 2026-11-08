import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getPlatformSettings,
} from "@/lib/platform-settings";

function unauthorized() {
  return NextResponse.json(
    {
      success: false,
      message: "Administrator access required.",
    },
    { status: 401 }
  );
}

function verifySameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (origin && origin !== request.nextUrl.origin) {
    return false;
  }

  return true;
}

export async function GET() {
  try {
    await requireAdmin();

    const settings = await getPlatformSettings();

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ADMIN_UNAUTHORIZED"
    ) {
      return unauthorized();
    }

    console.error("Platform settings retrieval error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve platform settings.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (!verifySameOrigin(request)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request origin.",
        },
        { status: 403 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid settings data.",
        },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const booleanFields = [
      "registrationEnabled",
      "marketplaceEnabled",
      "maintenanceMode",
    ] as const;

    for (const field of booleanFields) {
      if (typeof data[field] !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid value for ${field}.`,
          },
          { status: 400 }
        );
      }
    }

    const announcement = data.announcement;

    if (
      !announcement ||
      typeof announcement !== "object" ||
      Array.isArray(announcement)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid announcement settings.",
        },
        { status: 400 }
      );
    }

    const announcementData =
      announcement as Record<string, unknown>;

    if (
      typeof announcementData.enabled !== "boolean" ||
      typeof announcementData.title !== "string" ||
      typeof announcementData.message !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid announcement information.",
        },
        { status: 400 }
      );
    }

    const title = announcementData.title.trim();
    const message = announcementData.message.trim();

    if (
      title.length > 100 ||
      message.length > 1000 ||
      (announcementData.enabled &&
        (!title || !message))
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An enabled announcement requires a title and message. The title must not exceed 100 characters and the message must not exceed 1,000 characters.",
        },
        { status: 400 }
      );
    }

    const now = new Date();

    const settings = {
      registrationEnabled: data.registrationEnabled,
      marketplaceEnabled: data.marketplaceEnabled,
      maintenanceMode: data.maintenanceMode,
      announcement: {
        enabled: announcementData.enabled,
        title,
        message,
      },
      updatedAt: now,
      updatedBy: {
        adminId: admin.id,
        adminName: admin.name,
        adminEmail: admin.email,
      },
    };

    const db = await getDatabase();

    await db.collection("platformSettings").updateOne(
      { _id: "global" } as never,
      {
        $set: settings,
      } as never,
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Platform settings updated successfully.",
      settings: await getPlatformSettings(),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ADMIN_UNAUTHORIZED"
    ) {
      return unauthorized();
    }

    console.error("Platform settings update error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update platform settings.",
      },
      { status: 500 }
    );
  }
}