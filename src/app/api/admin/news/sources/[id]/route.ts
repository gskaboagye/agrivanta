import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin-auth";

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin) return false;

  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();

    if (!isSameOrigin(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid news source ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Status must be active or inactive." },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const result = await db.collection("newsSources").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          updatedAt: new Date(),
          lastUpdatedBy: {
            adminEmail: admin.email,
            name: admin.name,
            email: admin.email,
          },
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "News source not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `News source ${status === "active" ? "activated" : "deactivated"} successfully.`,
      source: {
        id,
        status,
      },
    });
  } catch (error) {
    console.error("Update news source error:", error);

    const message =
      error instanceof Error ? error.message : "Unable to update news source.";

    const status = message === "ADMIN_UNAUTHORIZED" ? 401 : 500;

    return NextResponse.json(
      { success: false, message: status === 401 ? "Unauthorized." : message },
      { status }
    );
  }
}