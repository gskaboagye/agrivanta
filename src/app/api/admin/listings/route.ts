
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin-auth";

const ALLOWED_TYPES = [
  "product",
  "hire",
  "service",
  "worker",
  "expert",
] as const;

const PAGE_SIZE = 20;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function serializeListing(listing: Record<string, unknown>) {
  const sellerId =
    listing.sellerId ??
    listing.userId ??
    listing.ownerId ??
    listing.createdBy;

  const moderationHistory = Array.isArray(listing.moderationHistory)
    ? listing.moderationHistory.map((record) => {
        const entry = record as Record<string, unknown>;

        return {
          action: entry.action ?? "",
          reason: entry.reason ?? "",
          adminId: entry.adminId ?? "",
          adminName: entry.adminName ?? "",
          adminEmail: entry.adminEmail ?? "",
          timestamp: entry.timestamp ?? null,
        };
      })
    : [];

  return {
    id: listing._id?.toString(),
    title: listing.title ?? "",
    type: listing.type ?? "",
    category: listing.category ?? "",
    subcategory: listing.subcategory ?? "",
    description: listing.description ?? "",
    price: listing.price ?? null,
    priceUnit: listing.priceUnit ?? listing.unit ?? "",
    location: listing.location ?? "",
    region: listing.region ?? "",
    district: listing.district ?? "",
    town: listing.town ?? "",
    seller: listing.seller ?? "Seller not specified",
    sellerId:
      sellerId instanceof ObjectId
        ? sellerId.toString()
        : typeof sellerId === "string"
          ? sellerId
          : "",
    sellerEmail:
      listing.sellerEmail ??
      listing.userEmail ??
      listing.ownerEmail ??
      "",
    image: listing.image ?? "",
    images: listing.images ?? [],
    status: listing.status ?? "active",
    createdAt: listing.createdAt ?? null,
    updatedAt: listing.updatedAt ?? null,
    moderationHistory,
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const params = request.nextUrl.searchParams;

    const search = params.get("search")?.trim() ?? "";
    const type = params.get("type") ?? "";
    const status = params.get("status") ?? "";
    const page = Number(params.get("page") ?? "1");

    if (
      search.length > 100 ||
      !Number.isInteger(page) ||
      page < 1
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid search parameters." },
        { status: 400 }
      );
    }

    if (
      type &&
      !(ALLOWED_TYPES as readonly string[]).includes(type)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid listing type." },
        { status: 400 }
      );
    }

    if (status && !["active", "disabled"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid listing status." },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection("listings");

    const filter: Record<string, unknown> = {};

    if (type) filter.type = type;
    if (status) filter.status = status;

    if (search) {
      const regex = {
        $regex: escapeRegex(search),
        $options: "i",
      };

      filter.$or = [
        { title: regex },
        { category: regex },
        { subcategory: regex },
        { seller: regex },
        { sellerEmail: regex },
        { userEmail: regex },
        { ownerEmail: regex },
        { location: regex },
      ];
    }

    const skip = (page - 1) * PAGE_SIZE;

    const [
      totalListings,
      activeListings,
      disabledListings,
      filteredCount,
      documents,
    ] = await Promise.all([
      collection.countDocuments({}),
      collection.countDocuments({ status: "active" }),
      collection.countDocuments({ status: "disabled" }),
      collection.countDocuments(filter),
      collection
        .find(filter, {
          projection: {
            passwordHash: 0,
          },
        })
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .toArray(),
    ]);

    return NextResponse.json({
      success: true,
      overview: {
        totalListings,
        activeListings,
        disabledListings,
      },
      listings: documents.map((document) =>
        serializeListing(document as Record<string, unknown>)
      ),
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        totalListings: filteredCount,
        totalPages: Math.ceil(filteredCount / PAGE_SIZE),
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ADMIN_UNAUTHORIZED"
    ) {
      return NextResponse.json(
        { success: false, message: "Administrator access required." },
        { status: 401 }
      );
    }

    console.error("Admin listings error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve listings." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    const { listingId, status, reason } = body;

    if (
      typeof listingId !== "string" ||
      !ObjectId.isValid(listingId)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid listing ID." },
        { status: 400 }
      );
    }

    if (status !== "active" && status !== "disabled") {
      return NextResponse.json(
        { success: false, message: "Invalid listing status." },
        { status: 400 }
      );
    }

    if (
      reason !== undefined &&
      (typeof reason !== "string" || reason.trim().length > 500)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid moderation reason." },
        { status: 400 }
      );
    }

    const moderationReason =
      typeof reason === "string" ? reason.trim() : "";

    if (status === "disabled" && moderationReason.length < 10) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please provide a reason of at least 10 characters when disabling a listing.",
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const listingsCollection = db.collection("listings");

    const objectId = new ObjectId(listingId);

    const existingListing = await listingsCollection.findOne({
      _id: objectId,
    });

    if (!existingListing) {
      return NextResponse.json(
        { success: false, message: "Listing not found." },
        { status: 404 }
      );
    }

    const currentStatus = existingListing.status ?? "active";

    if (currentStatus === status) {
      return NextResponse.json(
        {
          success: false,
          message: `This listing is already ${status}.`,
        },
        { status: 409 }
      );
    }

    const now = new Date();

    const moderationRecord = {
      action: status === "disabled" ? "disabled" : "activated",
      reason: moderationReason,
      adminId: admin.id,
      adminName: admin.name,
      adminEmail: admin.email,
      timestamp: now,
    };

    await listingsCollection.updateOne(
      { _id: objectId },
      {
        $set: {
          status,
          updatedAt: now,
          lastModeratedAt: now,
          lastModeratedBy: admin.id,
          lastModerationReason: moderationReason,
        },
        $push: {
          moderationHistory: {
            $each: [moderationRecord],
          },
        },
      } as any
    );

    return NextResponse.json({
      success: true,
      message:
        status === "disabled"
          ? "Listing disabled successfully."
          : "Listing reactivated successfully.",
      moderation: {
        status,
        reason: moderationReason,
        adminName: admin.name,
        timestamp: now,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ADMIN_UNAUTHORIZED"
    ) {
      return NextResponse.json(
        { success: false, message: "Administrator access required." },
        { status: 401 }
      );
    }

    console.error("Admin listing moderation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update listing status.",
      },
      { status: 500 }
    );
  }
}
