import { NextRequest, NextResponse } from "next/server";
import { getAssistIdentity } from "@/lib/assist/identity";
import {
  addConversationMessage,
  createConversation,
  getConversation,
} from "@/lib/assist/conversations";
import { generateAssistResponse } from "@/lib/assist/agent";

const MAX_MESSAGE_LENGTH = 10000;

export async function POST(request: NextRequest) {
  let conversationId: string | null = null;

  try {
    const identity = await getAssistIdentity();
    const body = await request.json();

    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: "Please provide a valid message." },
        { status: 400 }
      );
    }

    if (
      body.conversationId !== undefined &&
      (typeof body.conversationId !== "string" ||
        !/^[a-fA-F0-9]{24}$/.test(body.conversationId))
    ) {
      return NextResponse.json(
        { error: "Invalid conversation ID." },
        { status: 400 }
      );
    }

    let activeConversationId: string;

    if (typeof body.conversationId === "string") {
      activeConversationId = body.conversationId;
      conversationId = activeConversationId;

      const existingConversation = await getConversation(
        identity,
        activeConversationId
      );

      if (!existingConversation) {
        return NextResponse.json(
          { error: "Conversation not found." },
          { status: 404 }
        );
      }
    } else {
      const conversation = await createConversation(identity, message);
      activeConversationId = conversation.id;
      conversationId = activeConversationId;
    }

    if (typeof body.conversationId === "string") {
      const userMessageSaved = await addConversationMessage(
        identity,
        activeConversationId,
        "user",
        message
      );

      if (!userMessageSaved) {
        return NextResponse.json(
          { error: "Unable to save your message." },
          { status: 500 }
        );
      }
    }

    const conversation = await getConversation(identity, activeConversationId);

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation could not be retrieved." },
        { status: 404 }
      );
    }

    let answer: string;

    try {
      answer = await generateAssistResponse(conversation.messages);
    } catch (error) {
      console.error("Assist AI generation error:", error);

      return NextResponse.json(
        {
          error: "Your message was saved, but Assist could not respond. Please try again.",
          conversationId,
        },
        { status: 502 }
      );
    }

    const assistantMessageSaved = await addConversationMessage(
      identity,
      activeConversationId,
      "assistant",
      answer
    );

    if (!assistantMessageSaved) {
      return NextResponse.json(
        {
          error: "Assist generated a response but could not save it.",
          conversationId,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      conversationId,
      answer,
    });
  } catch (error) {
    console.error("AgriVanta Assist API error:", error);

    return NextResponse.json(
      {
        error: "Unable to process your message.",
        ...(conversationId ? { conversationId } : {}),
      },
      { status: 500 }
    );
  }
}