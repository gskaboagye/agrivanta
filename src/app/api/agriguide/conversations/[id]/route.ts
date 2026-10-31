
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";

const COLLECTION_NAME = "agriguide_conversations";
const MAX_TITLE_LENGTH = 60;

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET: Retrieve one conversation
export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    if (user.role !== "farmer" && user.role !== "supplier") {
      return NextResponse.json(
        { error: "You are not authorized to access AgriGuide." },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid conversation ID." },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const conversation = await db
      .collection(COLLECTION_NAME)
      .findOne({
        _id: new ObjectId(id),
        userId: user.id,
      });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      conversation: {
        id: conversation._id.toString(),
        title: conversation.title,
        language: conversation.language,
        messages: conversation.messages ?? [],
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (error) {
    console.error("AgriGuide conversation retrieval error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve this conversation." },
      { status: 500 }
    );
  }
}

// PATCH: Rename one conversation
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    if (user.role !== "farmer" && user.role !== "supplier") {
      return NextResponse.json(
        { error: "You are not authorized to access AgriGuide." },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid conversation ID." },
        { status: 400 }
      );
    }

    let body: { title?: unknown };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    if (!title) {
      return NextResponse.json(
        { error: "Please enter a conversation title." },
        { status: 400 }
      );
    }

    if (title.length > MAX_TITLE_LENGTH) {
      return NextResponse.json(
        {
          error: `Conversation titles must be ${MAX_TITLE_LENGTH} characters or fewer.`,
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const result = await db
      .collection(COLLECTION_NAME)
      .updateOne(
        {
          _id: new ObjectId(id),
          userId: user.id,
        },
        {
          $set: {
            title,
            updatedAt: new Date(),
          },
        }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Conversation renamed successfully.",
      title,
    });
  } catch (error) {
    console.error("AgriGuide conversation rename error:", error);

    return NextResponse.json(
      { error: "Unable to rename this conversation." },
      { status: 500 }
    );
  }
}

// DELETE: Delete one conversation
export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    if (user.role !== "farmer" && user.role !== "supplier") {
      return NextResponse.json(
        { error: "You are not authorized to access AgriGuide." },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid conversation ID." },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const result = await db
      .collection(COLLECTION_NAME)
      .deleteOne({
        _id: new ObjectId(id),
        userId: user.id,
      });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Conversation deleted successfully.",
    });
  } catch (error) {
    console.error("AgriGuide conversation deletion error:", error);

    return NextResponse.json(
      { error: "Unable to delete this conversation." },
      { status: 500 }
    );
  }
}
