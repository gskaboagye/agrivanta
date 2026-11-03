import { NextRequest, NextResponse } from "next/server";
import { getAssistIdentity } from "@/lib/assist/identity";
import {
  createConversation,
  listConversations,
} from "@/lib/assist/conversations";

export async function GET() {
  try {
    const identity = await getAssistIdentity();
    const conversations = await listConversations(identity);

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Assist conversation retrieval error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve conversations." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const identity = await getAssistIdentity();
    const body = await request.json();

    const openingMessage =
      typeof body.openingMessage === "string"
        ? body.openingMessage.trim()
        : "";

    if (!openingMessage || openingMessage.length > 10000) {
      return NextResponse.json(
        { error: "A valid opening message is required." },
        { status: 400 }
      );
    }

    const conversation = await createConversation(
      identity,
      openingMessage
    );

    return NextResponse.json(
      {
        message: "Conversation created successfully.",
        conversation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Assist conversation creation error:", error);

    return NextResponse.json(
      { error: "Unable to create conversation." },
      { status: 500 }
    );
  }
}