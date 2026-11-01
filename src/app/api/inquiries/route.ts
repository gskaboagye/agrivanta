
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";

type ListingDocument = {
  _id: ObjectId;
  title?: string;
  type?: string;
  listingType?: string;
  status?: string;
  seller?: string;
  sellerName?: string;
  userId?: unknown;
  sellerId?: unknown;
  ownerId?: unknown;
  createdBy?: unknown;
  sellerEmail?: string;
  userEmail?: string;
};

type InquiryDocument = {
  _id: ObjectId;
  listingId?: string;
  listingTitle?: string;
  listingType?: string;
  sellerId?: string;
  sellerName?: string;
  sellerEmail?: string;
  buyerId?: string;
  buyerName?: string;
  buyerEmail?: string;
  message?: string;
  status?: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

type ContactPreferences = {
  phone?: string;
  phonePublic?: boolean;
  whatsappEnabled?: boolean;
};

function normalizeId(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (value instanceof ObjectId) {
    return value.toString();
  }

  return null;
}

function getListingOwnerId(
  listing: Record<string, unknown>
): string | null {
  const fields = ["sellerId", "userId", "ownerId", "createdBy"];

  for (const field of fields) {
    const id = normalizeId(listing[field]);

    if (id) return id;
  }

  return null;
}

function isValidObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function toObjectId(value: string): ObjectId | null {
  return /^[a-fA-F0-9]{24}$/.test(value) &&
    ObjectId.isValid(value)
    ? new ObjectId(value)
    : null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to contact a seller." },
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

    if (!isValidObject(body)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const listingId =
      typeof body.listingId === "string"
        ? body.listingId.trim()
        : "";

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    const parsedListingId = toObjectId(listingId);

    if (!parsedListingId) {
      return NextResponse.json(
        { error: "A valid listing ID is required." },
        { status: 400 }
      );
    }

    if (message.length < 10 || message.length > 3000) {
      return NextResponse.json(
        {
          error: "Your message must be between 10 and 3000 characters.",
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const listing = await db
      .collection<ListingDocument>("listings")
      .findOne({
        _id: parsedListingId,
        status: "active",
      });

    if (!listing) {
      return NextResponse.json(
        { error: "This listing is unavailable." },
        { status: 404 }
      );
    }

    const sellerId = getListingOwnerId(
      listing as unknown as Record<string, unknown>
    );

    if (!sellerId) {
      return NextResponse.json(
        {
          error: "The seller for this listing could not be identified.",
        },
        { status: 409 }
      );
    }

    const buyerId = String(user.id);

    if (sellerId === buyerId) {
      return NextResponse.json(
        {
          error: "You cannot send an inquiry about your own listing.",
        },
        { status: 400 }
      );
    }

    const now = new Date();

    const inquiry = {
      listingId,
      listingTitle: String(listing.title ?? "Untitled listing"),
      listingType: String(
        listing.type ?? listing.listingType ?? "product"
      ),

      sellerId,
      sellerName: String(
        listing.seller ?? listing.sellerName ?? "Seller"
      ),

      // Seller email remains visible to the buyer.
      sellerEmail:
        typeof listing.sellerEmail === "string"
          ? listing.sellerEmail
          : typeof listing.userEmail === "string"
            ? listing.userEmail
            : "",

      buyerId,
      buyerName: String(user.name ?? ""),

      // Buyer email remains visible to the seller.
      buyerEmail: String(user.email ?? ""),

      // Phone numbers are retrieved from current account settings.
      // Do not store a potentially outdated phone number here.
      message,
      status: "new",
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .collection("inquiries")
      .insertOne(inquiry);

    // Notify only the seller who owns this listing.
    let notificationCreated = false;

    try {
      await db.collection("notifications").insertOne({
        userId: sellerId,
        type: "new_inquiry",
        title: "New inquiry received",
        message: `${
          inquiry.buyerName || "A buyer"
        } sent an inquiry about "${inquiry.listingTitle}".`,
        listingId: inquiry.listingId,
        inquiryId: result.insertedId.toString(),
        read: false,
        createdAt: now,
        updatedAt: now,
      });

      notificationCreated = true;
    } catch (notificationError) {
      console.error(
        "Create inquiry notification error:",
        notificationError
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Your inquiry has been sent successfully.",
        inquiry: {
          id: result.insertedId.toString(),
          listingId: inquiry.listingId,
          listingTitle: inquiry.listingTitle,
          status: inquiry.status,
          createdAt: inquiry.createdAt,
        },
        notificationCreated,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create inquiry error:", error);

    return NextResponse.json(
      { error: "Unable to send your inquiry right now." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to view inquiries." },
        { status: 401 }
      );
    }

    const view =
      request.nextUrl.searchParams.get("view") ?? "all";

    if (!["all", "sent", "received"].includes(view)) {
      return NextResponse.json(
        { error: "View must be all, sent, or received." },
        { status: 400 }
      );
    }

    const userId = String(user.id);

    // Enforce account ownership directly in MongoDB.
    const filter =
      view === "sent"
        ? { buyerId: userId }
        : view === "received"
          ? { sellerId: userId }
          : {
              $or: [
                { buyerId: userId },
                { sellerId: userId },
              ],
            };

    const db = await getDatabase();

    const inquiries = await db
      .collection<InquiryDocument>("inquiries")
      .find(filter)
      .sort({ updatedAt: -1 })
      .limit(100)
      .toArray();

    // Collect the IDs of both participants.
    const participantIds = Array.from(
      new Set(
        inquiries.flatMap((item) => [
          String(item.buyerId ?? ""),
          String(item.sellerId ?? ""),
        ]).filter(Boolean)
      )
    );

    const participantObjectIds = participantIds
      .map((id) => toObjectId(id))
      .filter((id): id is ObjectId => id !== null);

    // Retrieve current contact preferences for both parties.
    const accounts = participantObjectIds.length
      ? await db
          .collection("users")
          .find(
            { _id: { $in: participantObjectIds } },
            {
              projection: {
                phone: 1,
                phonePublic: 1,
                whatsappEnabled: 1,
              },
            }
          )
          .toArray()
      : [];

    const contactPreferences = new Map<
      string,
      ContactPreferences
    >(
      accounts.map((account) => [
        String(account._id),
        {
          phone: String(account.phone ?? ""),
          phonePublic: account.phonePublic === true,
          whatsappEnabled: account.whatsappEnabled === true,
        },
      ])
    );

    return NextResponse.json({
      success: true,

      inquiries: inquiries.map((item) => {
        const isBuyer =
          String(item.buyerId ?? "") === userId;

        const isSeller =
          String(item.sellerId ?? "") === userId;

        const buyerId = String(item.buyerId ?? "");
        const sellerId = String(item.sellerId ?? "");

        const buyerContact = contactPreferences.get(buyerId);
        const sellerContact = contactPreferences.get(sellerId);

        return {
          id: item._id.toString(),
          listingId: String(item.listingId ?? ""),
          listingTitle: String(item.listingTitle ?? ""),
          listingType: String(item.listingType ?? "product"),

          sellerId,
          sellerName: String(item.sellerName ?? "Seller"),

          buyerId,
          buyerName: String(item.buyerName ?? ""),

          message: String(item.message ?? ""),
          status: String(item.status ?? "new"),
          createdAt: item.createdAt ?? null,
          updatedAt: item.updatedAt ?? null,

          // Seller sees buyer email and permitted contact details.
          ...(isSeller
            ? {
                buyerEmail: String(item.buyerEmail ?? ""),

                ...(buyerContact?.phonePublic === true
                  ? {
                      buyerPhone: buyerContact.phone ?? "",
                      buyerWhatsappEnabled:
                        buyerContact.whatsappEnabled === true,
                    }
                  : {}),
              }
            : {}),

          // Buyer sees seller email and permitted contact details.
          ...(isBuyer
            ? {
                sellerEmail: String(item.sellerEmail ?? ""),

                ...(sellerContact?.phonePublic === true
                  ? {
                      sellerPhone: sellerContact.phone ?? "",
                      sellerWhatsappEnabled:
                        sellerContact.whatsappEnabled === true,
                    }
                  : {}),
              }
            : {}),
        };
      }),
    });
  } catch (error) {
    console.error("Fetch inquiries error:", error);

    return NextResponse.json(
      { error: "Unable to load inquiries." },
      { status: 500 }
    );
  }
}
