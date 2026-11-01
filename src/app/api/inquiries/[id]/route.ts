
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const ALLOWED_STATUSES = ["read", "responded"] as const;

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // 1. Authenticate the user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in." },
        { status: 401 }
      );
    }

    // 2. Validate the inquiry ID
    const { id } = await context.params;

    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid inquiry ID." },
        { status: 400 }
      );
    }

    // 3. Safely parse the request body
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("status" in body)
    ) {
      return NextResponse.json(
        { error: "A valid status is required." },
        { status: 400 }
      );
    }

    const status = body.status;

    if (
      typeof status !== "string" ||
      !ALLOWED_STATUSES.includes(
        status as (typeof ALLOWED_STATUSES)[number]
      )
    ) {
      return NextResponse.json(
        { error: "Status must be read or responded." },
        { status: 400 }
      );
    }

    // 4. Update only an inquiry owned by this seller
    const db = await getDatabase();
    const inquiries = db.collection("inquiries");

    const result = await inquiries.updateOne(
      {
        _id: new ObjectId(id),
        sellerId: user.id,
      },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      }
    );

    // 5. Do not reveal whether another user's inquiry exists
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Inquiry not found or you are not authorized to update it." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Inquiry status updated successfully.",
      status,
    });
  } catch (error) {
    console.error("Update inquiry error:", error);

    return NextResponse.json(
      { error: "Unable to update inquiry status." },
      { status: 500 }
    );
  }
}
