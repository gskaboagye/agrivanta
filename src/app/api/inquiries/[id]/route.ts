

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in." },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid inquiry ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const status = body.status;

    if (!["read", "responded"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be read or responded." },
        { status: 400 }
      );
    }

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

    if (result.matchedCount === 0) {
      const existing = await inquiries.findOne({
        _id: new ObjectId(id),
      });

      if (!existing) {
        return NextResponse.json(
          { error: "Inquiry not found." },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: "Only the seller can update this inquiry." },
        { status: 403 }
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

