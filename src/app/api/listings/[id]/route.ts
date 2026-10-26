
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function ownsListing(listing: Record<string, unknown>, userId: string, email: string) {
  return (
    listing.userId === userId ||
    listing.sellerId === userId ||
    listing.ownerId === userId ||
    listing.createdBy === userId ||
    (typeof listing.userEmail === "string" &&
      listing.userEmail.toLowerCase() === email.toLowerCase()) ||
    (typeof listing.sellerEmail === "string" &&
      listing.sellerEmail.toLowerCase() === email.toLowerCase()) ||
    (typeof listing.ownerEmail === "string" &&
      listing.ownerEmail.toLowerCase() === email.toLowerCase())
  );
}

async function findOwnedListing(id: string, userId: string, email: string) {
  if (!ObjectId.isValid(id)) {
    return { error: "Invalid listing ID.", status: 400 as const };
  }

  const db = await getDatabase();
  const listing = await db.collection("listings").findOne({
    _id: new ObjectId(id),
  });

  if (!listing) {
    return { error: "Listing not found.", status: 404 as const };
  }

  if (!ownsListing(listing, userId, email)) {
    return { error: "You do not have permission to manage this listing.", status: 403 as const };
  }

  return { listing, db };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Please log in." }, { status: 401 });
    }

    const { id } = await context.params;
    const result = await findOwnedListing(id, user.id, user.email);

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const body = await request.json();
    const allowedFields = [
      "title",
      "description",
      "price",
      "unit",
      "category",
      "location",
      "type",
      "image",
      "images",
      "videos",
      "media",
    ] as const;

    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No supported fields were provided." },
        { status: 400 }
      );
    }

    if (
      "title" in updates &&
      (typeof updates.title !== "string" || !updates.title.trim())
    ) {
      return NextResponse.json({ error: "A valid title is required." }, { status: 400 });
    }

    if (
      "description" in updates &&
      typeof updates.description !== "string"
    ) {
      return NextResponse.json({ error: "Description must be text." }, { status: 400 });
    }

    if ("price" in updates) {
      const price = Number(updates.price);

      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json({ error: "Enter a valid price." }, { status: 400 });
      }

      updates.price = price;
    }

    if ("images" in updates && (
      !Array.isArray(updates.images) ||
      updates.images.length > 8 ||
      !updates.images.every((item) =>
        typeof item === "string" &&
        item.startsWith("https://res.cloudinary.com/")
      )
    )) {
      return NextResponse.json({ error: "Invalid listing images." }, { status: 400 });
    }

    if ("videos" in updates && (
      !Array.isArray(updates.videos) ||
      updates.videos.length > 2 ||
      !updates.videos.every((item) =>
        typeof item === "string" &&
        item.startsWith("https://res.cloudinary.com/")
      )
    )) {
      return NextResponse.json({ error: "Invalid listing videos." }, { status: 400 });
    }

    updates.updatedAt = new Date();

    await result.db.collection("listings").updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    const updated = await result.db.collection("listings").findOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({
      message: "Listing updated successfully.",
      listing: updated
        ? { ...updated, id: updated._id.toString(), _id: undefined }
        : null,
    });
  } catch (error) {
    console.error("Update listing error:", error);

    return NextResponse.json(
      { error: "Unable to update listing." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Please log in." }, { status: 401 });
    }

    const { id } = await context.params;
    const result = await findOwnedListing(id, user.id, user.email);

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    await result.db.collection("listings").deleteOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({ message: "Listing deleted successfully." });
  } catch (error) {
    console.error("Delete listing error:", error);

    return NextResponse.json(
      { error: "Unable to delete listing." },
      { status: 500 }
    );
  }
}
