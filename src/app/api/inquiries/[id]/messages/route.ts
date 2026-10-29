
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function validId(value: string) {
  return /^[a-fA-F0-9]{24}$/.test(value) && ObjectId.isValid(value);
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to view this conversation." },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!validId(id)) {
      return NextResponse.json(
        { error: "Invalid inquiry ID." },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const inquiry = await db.collection("inquiries").findOne({
      _id: new ObjectId(id),
    });

    if (!inquiry) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }

    const userId = String(user.id);
    const buyerId = String(inquiry.buyerId ?? "");
    const sellerId = String(inquiry.sellerId ?? "");

    if (userId !== buyerId && userId !== sellerId) {
      return NextResponse.json(
        { error: "You do not have access to this conversation." },
        { status: 403 }
      );
    }

    const storedMessages = await db
      .collection("messages")
      .find({ inquiryId: id })
      .sort({ createdAt: 1 })
      .toArray();

    const initialMessage = {
      id: `initial-${id}`,
      senderId: buyerId,
      senderName: String(inquiry.buyerName ?? "Buyer"),
      body: String(inquiry.message ?? ""),
      createdAt: inquiry.createdAt ?? null,
      initial: true,
    };

    const replies = storedMessages.map((message) => ({
      id: message._id.toString(),
      senderId: String(message.senderId ?? ""),
      senderName: String(message.senderName ?? "User"),
      body: String(message.body ?? ""),
      createdAt: message.createdAt ?? null,
      initial: false,
    }));

    return NextResponse.json({
      success: true,
      inquiry: {
        id,
        listingId: String(inquiry.listingId ?? ""),
        listingTitle: String(inquiry.listingTitle ?? "Listing"),
        buyerId,
        sellerId,
        buyerName: String(inquiry.buyerName ?? "Buyer"),
        sellerName: String(inquiry.sellerName ?? "Seller"),
        status: String(inquiry.status ?? "new"),
        participantName:
          userId === buyerId
            ? String(inquiry.sellerName ?? "Seller")
            : String(inquiry.buyerName ?? "Buyer"),
      },
      messages: [initialMessage, ...replies],
    });
  } catch (error) {
    console.error("Load conversation error:", error);
    return NextResponse.json(
      { error: "Unable to load this conversation." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to send a message." },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!validId(id)) {
      return NextResponse.json(
        { error: "Invalid inquiry ID." },
        { status: 400 }
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

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const messageBody =
      typeof (body as { message?: unknown }).message === "string"
        ? (body as { message: string }).message.trim()
        : "";

    if (!messageBody || messageBody.length > 3000) {
      return NextResponse.json(
        { error: "Your message must be between 1 and 3000 characters." },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const inquiry = await db.collection("inquiries").findOne({
      _id: new ObjectId(id),
    });

    if (!inquiry) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }

    const senderId = String(user.id);
    const buyerId = String(inquiry.buyerId ?? "");
    const sellerId = String(inquiry.sellerId ?? "");

    if (senderId !== buyerId && senderId !== sellerId) {
      return NextResponse.json(
        { error: "You cannot send messages in this conversation." },
        { status: 403 }
      );
    }

    const recipientId = senderId === buyerId ? sellerId : buyerId;
    const senderName = String(user.name ?? "AgriVanta user");
    const now = new Date();

    const result = await db.collection("messages").insertOne({
      inquiryId: id,
      listingId: String(inquiry.listingId ?? ""),
      senderId,
      senderName,
      body: messageBody,
      createdAt: now,
      read: false,
    });

    await db.collection("inquiries").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          updatedAt: now,
          status: senderId === sellerId ? "responded" : "new",
        },
      }
    );

    let notificationCreated = false;

    try {
      await db.collection("notifications").insertOne({
        userId: recipientId,
        type: "new_message",
        title: "New message",
        message: `${senderName} sent you a message about "${String(
          inquiry.listingTitle ?? "a listing"
        )}".`,
        listingId: String(inquiry.listingId ?? ""),
        inquiryId: id,
        read: false,
        createdAt: now,
        updatedAt: now,
      });

      notificationCreated = true;
    } catch (error) {
      console.error("Create message notification error:", error);
    }

    return NextResponse.json(
      {
        success: true,
        notificationCreated,
        message: {
          id: result.insertedId.toString(),
          senderId,
          senderName,
          body: messageBody,
          createdAt: now,
          initial: false,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Unable to send your message right now." },
      { status: 500 }
    );
  }
}
