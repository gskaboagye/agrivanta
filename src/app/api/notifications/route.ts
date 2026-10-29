
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";

function isValidObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to view notifications." },
        { status: 401 }
      );
    }

    const userId = String(user.id);
    const unreadOnly =
      request.nextUrl.searchParams.get("unreadOnly") === "true";

    const filter: Record<string, unknown> = { userId };

    if (unreadOnly) {
      filter.read = false;
    }

    const db = await getDatabase();
    const collection = db.collection("notifications");

    const [notifications, unreadCount] = await Promise.all([
      collection
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray(),

      collection.countDocuments({
        userId,
        read: false,
      }),
    ]);

    return NextResponse.json({
      success: true,
      notifications: notifications.map((item) => ({
        id: item._id.toString(),
        type: String(item.type ?? "general"),
        title: String(item.title ?? "Notification"),
        message: String(item.message ?? ""),
        listingId: String(item.listingId ?? ""),
        inquiryId: String(item.inquiryId ?? ""),
        read: item.read === true,
        createdAt: item.createdAt ?? null,
      })),
      unreadCount,
    });
  } catch (error) {
    console.error("Fetch notifications error:", error);

    return NextResponse.json(
      { error: "Unable to load notifications." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to update notifications." },
        { status: 401 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    if (!isValidObject(body)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const userId = String(user.id);
    const notificationId =
      typeof body.notificationId === "string"
        ? body.notificationId.trim()
        : "";
    const markAllRead = body.markAllRead === true;

    const db = await getDatabase();
    const collection = db.collection("notifications");

    if (markAllRead) {
      const result = await collection.updateMany(
        { userId, read: false },
        {
          $set: {
            read: true,
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json({
        success: true,
        message: "Notifications marked as read.",
        modifiedCount: result.modifiedCount,
      });
    }

    if (
      !/^[a-fA-F0-9]{24}$/.test(notificationId) ||
      !ObjectId.isValid(notificationId)
    ) {
      return NextResponse.json(
        { error: "A valid notification ID is required." },
        { status: 400 }
      );
    }

    const result = await collection.updateOne(
      {
        _id: new ObjectId(notificationId),
        userId,
      },
      {
        $set: {
          read: true,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Notification not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification marked as read.",
    });
  } catch (error) {
    console.error("Update notification error:", error);

    return NextResponse.json(
      { error: "Unable to update notifications." },
      { status: 500 }
    );
  }
}
