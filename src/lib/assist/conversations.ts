import "server-only";

import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import type { AssistIdentity } from "@/lib/assist/identity";

const COLLECTION_NAME = "agrivanta_assist_conversations";
const MAX_TITLE_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 10000;

export type AssistMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
};

export type AssistConversation = {
  _id: ObjectId;
  ownerType: "user" | "visitor";
  ownerId: string;
  title: string;
  messages: AssistMessage[];
  createdAt: Date;
  updatedAt: Date;
};

type ConversationSummary = {
  id: string;
  title: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
};

function getOwner(identity: AssistIdentity) {
  if (identity.type === "user") {
    return {
      ownerType: "user" as const,
      ownerId: identity.userId,
    };
  }

  return {
    ownerType: "visitor" as const,
    ownerId: identity.visitorId,
  };
}

function getCollection() {
  return getDatabase().then((db) =>
    db.collection<Omit<AssistConversation, "_id"> & { _id?: ObjectId }>(
      COLLECTION_NAME
    )
  );
}

function titleFrom(question: string): string {
  const cleaned = question.trim().replace(/\s+/g, " ");

  return cleaned.length <= MAX_TITLE_LENGTH
    ? cleaned
    : `${cleaned.slice(0, MAX_TITLE_LENGTH - 3).trim()}...`;
}

function validConversationId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

export async function createConversation(
  identity: AssistIdentity,
  openingMessage: string
): Promise<ConversationSummary> {
  const question = openingMessage.trim();

  if (!question || question.length > MAX_MESSAGE_LENGTH) {
    throw new Error("Invalid opening message.");
  }

  const collection = await getCollection();
  const now = new Date();

  const conversation = {
    ...getOwner(identity),
    title: titleFrom(question),
    messages: [
      {
        role: "user" as const,
        content: question,
        createdAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(conversation);

  return {
    id: result.insertedId.toString(),
    title: conversation.title,
    messageCount: 1,
    createdAt: now,
    updatedAt: now,
  };
}

export async function listConversations(
  identity: AssistIdentity,
  limit = 50
): Promise<ConversationSummary[]> {
  const collection = await getCollection();
  const owner = getOwner(identity);

  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100);

  const conversations = await collection.aggregate<{
    _id: ObjectId;
    title: string;
    messageCount: number;
    createdAt: Date;
    updatedAt: Date;
  }>([
    { $match: owner },
    { $sort: { updatedAt: -1 } },
    { $limit: safeLimit },
    {
      $project: {
        title: 1,
        createdAt: 1,
        updatedAt: 1,
        messageCount: {
          $size: { $ifNull: ["$messages", []] },
        },
      },
    },
  ]).toArray();

  return conversations.map((conversation) => ({
    id: conversation._id.toString(),
    title: conversation.title,
    messageCount: conversation.messageCount,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  }));
}

export async function getConversation(
  identity: AssistIdentity,
  conversationId: string
): Promise<AssistConversation | null> {
  if (!validConversationId(conversationId)) {
    return null;
  }

  const collection = await getCollection();

  return collection.findOne({
    _id: new ObjectId(conversationId),
    ...getOwner(identity),
  }) as Promise<AssistConversation | null>;
}

export async function addConversationMessage(
  identity: AssistIdentity,
  conversationId: string,
  role: AssistMessage["role"],
  content: string
): Promise<boolean> {
  const message = content.trim();

  if (
    !validConversationId(conversationId) ||
    !message ||
    message.length > MAX_MESSAGE_LENGTH
  ) {
    return false;
  }

  const collection = await getCollection();
  const now = new Date();

  const result = await collection.updateOne(
    {
      _id: new ObjectId(conversationId),
      ...getOwner(identity),
    },
    {
      $push: {
        messages: {
          role,
          content: message,
          createdAt: now,
        },
      },
      $set: {
        updatedAt: now,
      },
    }
  );

  return result.matchedCount === 1;
}

export async function renameConversation(
  identity: AssistIdentity,
  conversationId: string,
  newTitle: string
): Promise<boolean> {
  const title = newTitle.trim().replace(/\s+/g, " ");

  if (
    !validConversationId(conversationId) ||
    !title ||
    title.length > MAX_TITLE_LENGTH
  ) {
    return false;
  }

  const collection = await getCollection();

  const result = await collection.updateOne(
    {
      _id: new ObjectId(conversationId),
      ...getOwner(identity),
    },
    {
      $set: {
        title,
        updatedAt: new Date(),
      },
    }
  );

  return result.matchedCount === 1;
}

export async function deleteConversation(
  identity: AssistIdentity,
  conversationId: string
): Promise<boolean> {
  if (!validConversationId(conversationId)) {
    return false;
  }

  const collection = await getCollection();

  const result = await collection.deleteOne({
    _id: new ObjectId(conversationId),
    ...getOwner(identity),
  });

  return result.deletedCount === 1;
}