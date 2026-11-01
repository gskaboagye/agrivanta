import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to send a message." },
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

    const data = body as {
      recipientId?: unknown;
      message?: unknown;
    };

    const recipientId =
      typeof data.recipientId === "string"
        ? data.recipientId.trim()
        : "";

    const message =
      typeof data.message === "string"
        ? data.message.trim()
        : "";

    if (
      !/^[a-fA-F0-9]{24}$/.test(recipientId) ||
      !ObjectId.isValid(recipientId)
    ) {
      return NextResponse.json(
        { error: "A valid recipient is required." },
        { status: 400 }
      );
    }

    const senderId = String(user.id);

    if (senderId === recipientId) {
      return NextResponse.json(
        { error: "You cannot send a message to yourself." },
        { status: 400 }
      );
    }

    if (!message || message.length > 3000) {
      return NextResponse.json(
        { error: "Your message must be between 1 and 3000 characters." },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const recipient = await db.collection("users").findOne(
      { _id: new ObjectId(recipientId) },
      {
        projection: {
          name: 1,
          email: 1,
        },
      }
    );

    if (!recipient) {
      return NextResponse.json(
        { error: "The recipient account could not be found." },
        { status: 404 }
      );
    }

    const senderName = String(user.name ?? "AgriVanta user");
    const recipientName = String(
      recipient.name ?? "AgriVanta user"
    );
    const now = new Date();

    // Find an existing direct conversation between these accounts.
    const existingConversation = await db
      .collection("inquiries")
      .findOne({
        conversationType: "direct",
        $or: [
          { buyerId: senderId, sellerId: recipientId },
          { buyerId: recipientId, sellerId: senderId },
        ],
      });

    let conversationId: string;
    let created = false;

    if (existingConversation) {
      conversationId = existingConversation._id.toString();

      await db.collection("messages").insertOne({
        inquiryId: conversationId,
        listingId: "",
        senderId,
        senderName,
        body: message,
        createdAt: now,
        read: false,
      });

      await db.collection("inquiries").updateOne(
        { _id: existingConversation._id },
        {
          $set: {
            updatedAt: now,
            status: "new",
          },
        }
      );
    } else {
      const result = await db.collection("inquiries").insertOne({
        conversationType: "direct",
        listingId: "",
        listingTitle: "Direct message",
        listingType: "direct",
        buyerId: senderId,
        buyerName: senderName,
        buyerEmail: String(user.email ?? ""),
        sellerId: recipientId,
        sellerName: recipientName,
        sellerEmail: String(recipient.email ?? ""),
        message,
        status: "new",
        createdAt: now,
        updatedAt: now,
      });

      conversationId = result.insertedId.toString();
      created = true;
    }

    let notificationCreated = false;

    try {
      await db.collection("notifications").insertOne({
        userId: recipientId,
        type: "new_message",
        title: "New direct message",
        message: `${senderName} sent you a direct message.`,
        listingId: "",
        inquiryId: conversationId,
        read: false,
        createdAt: now,
        updatedAt: now,
      });

      notificationCreated = true;
    } catch (notificationError) {
      console.error(
        "Create direct message notification error:",
        notificationError
      );
    }

    return NextResponse.json(
      {
        success: true,
        created,
        notificationCreated,
        conversationId,
        message: "Your message has been sent successfully.",
      },
      { status: created ? 201 : 200 }
    );
  } catch (error) {
    console.error("Create direct message error:", error);

    return NextResponse.json(
      { error: "Unable to send your message right now." },
      { status: 500 }
    );
  }
}
