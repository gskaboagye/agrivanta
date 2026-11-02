
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ListingRecord = Record<string, unknown>;

function ownsListing(
  listing: ListingRecord,
  userId: string,
  email: string
): boolean {
  const normalizedEmail = email.toLowerCase();

  return (
    listing.userId === userId ||
    listing.sellerId === userId ||
    listing.ownerId === userId ||
    listing.createdBy === userId ||
    (typeof listing.userEmail === "string" &&
      listing.userEmail.toLowerCase() === normalizedEmail) ||
    (typeof listing.sellerEmail === "string" &&
      listing.sellerEmail.toLowerCase() === normalizedEmail) ||
    (typeof listing.ownerEmail === "string" &&
      listing.ownerEmail.toLowerCase() === normalizedEmail)
  );
}

async function findOwnedListing(
  id: string,
  userId: string,
  email: string
) {
  if (!ObjectId.isValid(id)) {
    return { error: "Invalid listing ID.", status: 400 as const };
  }

  const db = await getDatabase();
  const objectId = new ObjectId(id);

  const listing = (await db.collection("listings").findOne({
    _id: objectId,
  })) as ListingRecord | null;

  if (!listing) {
    return { error: "Listing not found.", status: 404 as const };
  }

  if (!ownsListing(listing, userId, email)) {
    return {
      error: "You do not have permission to manage this listing.",
      status: 403 as const,
    };
  }

  return { listing, db, objectId };
}

function isValidSpecifications(value: unknown): boolean {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const entries = Object.entries(value);

  if (entries.length > 40) {
    return false;
  }

  return entries.every(([key, item]) => {
    if (!key.trim() || key.length > 100) {
      return false;
    }

    if (typeof item === "string") {
      return item.length <= 500;
    }

    if (typeof item === "number") {
      return Number.isFinite(item) && item >= 0;
    }

    return typeof item === "boolean";
  });
}

function isValidCloudinaryUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com"
    );
  } catch {
    return false;
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Please log in." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const result = await findOwnedListing(id, user.id, user.email);

    if ("error" in result) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: result.status }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid listing data." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const allowedFields = [
      "title",
      "description",
      "price",
      "unit",
      "priceUnit",
      "category",
      "subcategory",
      "specifications",
      "location",
      "type",
      "image",
      "images",
      "videos",
      "media",
    ] as const;

    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(data, field)) {
        updates[field] = data[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No supported fields were provided.",
        },
        { status: 400 }
      );
    }

    if (
      "title" in updates &&
      (typeof updates.title !== "string" ||
        !updates.title.trim() ||
        updates.title.length > 200)
    ) {
      return NextResponse.json(
        { success: false, message: "Enter a valid listing title." },
        { status: 400 }
      );
    }

    if (
      "description" in updates &&
      (typeof updates.description !== "string" ||
        updates.description.length > 10000)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Description must be text under 10,000 characters.",
        },
        { status: 400 }
      );
    }

    for (const field of [
      "category",
      "subcategory",
      "location",
    ] as const) {
      if (
        field in updates &&
        (typeof updates[field] !== "string" ||
          !updates[field].trim() ||
          updates[field].length > 200)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Enter a valid ${field}.`,
          },
          { status: 400 }
        );
      }
    }

    if ("price" in updates) {
      const price = Number(updates.price);

      if (
        !Number.isFinite(price) ||
        price < 0 ||
        price > 1_000_000_000
      ) {
        return NextResponse.json(
          { success: false, message: "Enter a valid price." },
          { status: 400 }
        );
      }

      updates.price = price;
    }

    // Accept both field names used by existing listing records and forms.
    if ("priceUnit" in updates && "unit" in updates) {
      if (
        typeof updates.priceUnit !== "string" ||
        typeof updates.unit !== "string" ||
        updates.priceUnit.trim() !== updates.unit.trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Provide one consistent price unit.",
          },
          { status: 400 }
        );
      }
    }

    const submittedUnit =
      "priceUnit" in updates ? updates.priceUnit : updates.unit;

    if (
      submittedUnit !== undefined &&
      (typeof submittedUnit !== "string" ||
        !submittedUnit.trim() ||
        submittedUnit.length > 100)
    ) {
      return NextResponse.json(
        { success: false, message: "Enter a valid price unit." },
        { status: 400 }
      );
    }

    if (submittedUnit !== undefined) {
      // Keep both names synchronized for compatibility with existing code.
      updates.priceUnit = submittedUnit;
      updates.unit = submittedUnit;
    }

    if (
      "specifications" in updates &&
      !isValidSpecifications(updates.specifications)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid listing specifications.",
        },
        { status: 400 }
      );
    }

    if (
      "images" in updates &&
      (!Array.isArray(updates.images) ||
        updates.images.length > 8 ||
        !updates.images.every(isValidCloudinaryUrl))
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid listing images." },
        { status: 400 }
      );
    }

    if (
      "videos" in updates &&
      (!Array.isArray(updates.videos) ||
        updates.videos.length > 2 ||
        !updates.videos.every(isValidCloudinaryUrl))
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid listing videos." },
        { status: 400 }
      );
    }

    if (
      "image" in updates &&
      updates.image !== "" &&
      !isValidCloudinaryUrl(updates.image)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid listing image." },
        { status: 400 }
      );
    }

    // Prevent media metadata from containing arbitrary malformed entries.
    if ("media" in updates) {
      if (!Array.isArray(updates.media) || updates.media.length > 8) {
        return NextResponse.json(
          { success: false, message: "Invalid listing media." },
          { status: 400 }
        );
      }

      const validMedia = updates.media.every((item) => {
        if (typeof item !== "object" || item === null) return false;

        const asset = item as Record<string, unknown>;
        const url = asset.secure_url ?? asset.url;

        return (
          isValidCloudinaryUrl(url) &&
          (asset.type === undefined ||
            asset.type === "image" ||
            asset.type === "video") &&
          (asset.resource_type === undefined ||
            asset.resource_type === "image" ||
            asset.resource_type === "video")
        );
      });

      if (!validMedia) {
        return NextResponse.json(
          { success: false, message: "Invalid listing media." },
          { status: 400 }
        );
      }
    }

    updates.updatedAt = new Date();

    await result.db.collection("listings").updateOne(
      { _id: result.objectId },
      { $set: updates }
    );

    const updated = await result.db.collection("listings").findOne({
      _id: result.objectId,
    });

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          message: "Listing was updated but could not be retrieved.",
        },
        { status: 500 }
      );
    }

    const { _id, ...listingData } = updated;

    return NextResponse.json({
      success: true,
      message: "Listing updated successfully.",
      listing: {
        ...listingData,
        id: _id.toString(),
      },
    });
  } catch (error) {
    console.error("Update listing error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update listing." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Please log in." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const result = await findOwnedListing(id, user.id, user.email);

    if ("error" in result) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: result.status }
      );
    }

    const deletion = await result.db.collection("listings").deleteOne({
      _id: result.objectId,
    });

    if (deletion.deletedCount !== 1) {
      return NextResponse.json(
        {
          success: false,
          message: "The listing could not be deleted.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Listing deleted successfully.",
    });
  } catch (error) {
    console.error("Delete listing error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to delete listing." },
      { status: 500 }
    );
  }
}
