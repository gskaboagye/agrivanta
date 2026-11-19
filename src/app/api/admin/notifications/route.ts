import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/mongodb";

function unauthorized() {
  return NextResponse.json(
    { success: false, message: "Administrator authentication required." },
    { status: 401 }
  );
}

function forbidden() {
  return NextResponse.json(
    { success: false, message: "You do not have permission to access notifications." },
    { status: 403 }
  );
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) return unauthorized();

    if (!["super_admin", "report_manager"].includes(admin.role ?? "")) {
      return forbidden();
    }

    const unreadOnly =
      request.nextUrl.searchParams.get("unreadOnly") === "true";

    const filter: Record<string, unknown> = {
      adminId: admin.id,
    };

    if (unreadOnly) filter.read = false;

    const collection = (await getDatabase()).collection("notifications");

    const [notifications, unreadCount] = await Promise.all([
      collection.find(filter).sort({ createdAt: -1 }).limit(50).toArray(),
      collection.countDocuments({ adminId: admin.id, read: false }),
    ]);

    return NextResponse.json({
      success: true,
      notifications: notifications.map((item) => ({
        id: item._id.toString(),
        type: String(item.type ?? "general"),
        title: String(item.title ?? "Notification"),
        message: String(item.message ?? ""),
        reportId: String(item.reportId ?? ""),
        referenceNumber: String(item.referenceNumber ?? ""),
        read: item.read === true,
        createdAt: item.createdAt ?? null,
      })),
      unreadCount,
    });
  } catch (error) {
    console.error("Admin notifications retrieval error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load notifications." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) return unauthorized();

    if (!["super_admin", "report_manager"].includes(admin.role ?? "")) {
      return forbidden();
    }

    const origin = request.headers.get("origin");

    if (origin && origin !== request.nextUrl.origin) {
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
        { success: false, message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;
    const collection = (await getDatabase()).collection("notifications");

    if (data.markAllRead === true) {
      const result = await collection.updateMany(
        { adminId: admin.id, read: false },
        { $set: { read: true, updatedAt: new Date() } }
      );

      return NextResponse.json({
        success: true,
        modifiedCount: result.modifiedCount,
      });
    }

    const notificationId =
      typeof data.notificationId === "string"
        ? data.notificationId.trim()
        : "";

    if (!/^[a-fA-F0-9]{24}$/.test(notificationId) ||
        !ObjectId.isValid(notificationId)) {
      return NextResponse.json(
        { success: false, message: "A valid notification ID is required." },
        { status: 400 }
      );
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(notificationId), adminId: admin.id },
      { $set: { read: true, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Notification not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin notifications update error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update notifications." },
      { status: 500 }
    );
  }
}
