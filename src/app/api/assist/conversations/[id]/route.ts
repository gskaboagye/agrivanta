import { NextRequest, NextResponse } from "next/server";
import { getAssistIdentity } from "@/lib/assist/identity";
import {
  deleteConversation,
  getConversation,
  renameConversation,
} from "@/lib/assist/conversations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const identity = await getAssistIdentity();

    const conversation = await getConversation(identity, id);

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Assist conversation retrieval error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve conversation." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const identity = await getAssistIdentity();
    const body = await request.json();

    if (typeof body.title !== "string") {
      return NextResponse.json(
        { error: "A valid conversation title is required." },
        { status: 400 }
      );
    }

    const updated = await renameConversation(
      identity,
      id,
      body.title
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Conversation not found or title is invalid." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Conversation renamed successfully.",
    });
  } catch (error) {
    console.error("Assist conversation rename error:", error);

    return NextResponse.json(
      { error: "Unable to rename conversation." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const identity = await getAssistIdentity();

    const deleted = await deleteConversation(identity, id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Conversation deleted successfully.",
    });
  } catch (error) {
    console.error("Assist conversation deletion error:", error);

    return NextResponse.json(
      { error: "Unable to delete conversation." },
      { status: 500 }
    );
  }
}