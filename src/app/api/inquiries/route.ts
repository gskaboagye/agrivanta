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
  buyerPhone?: string;
  message?: string;
  status?: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
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

function isValidObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function toObjectId(value: string): ObjectId | null {
  return /^[a-fA-F0-9]{24}$/.test(value) && ObjectId.isValid(value)
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
      typeof body.listingId === "string" ? body.listingId.trim() : "";
    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    const parsedListingId = toObjectId(listingId);
    if (!parsedListingId) {
      return NextResponse.json(
        { error: "A valid listing ID is required." },
        { status: 400 }
      );
    }

    if (message.length < 10 || message.length > 3000) {
      return NextResponse.json(
        { error: "Your message must be between 10 and 3000 characters." },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const listing = await db
      .collection<ListingDocument>("listings")
      .findOne({ _id: parsedListingId, status: "active" });

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
        { error: "The seller for this listing could not be identified." },
        { status: 409 }
      );
    }

    const buyerId = String(user.id);
    if (sellerId === buyerId) {
      return NextResponse.json(
        { error: "You cannot send an inquiry about your own listing." },
        { status: 400 }
      );
    }

    // Only retain the buyer's phone number when the buyer has opted in
    // to public phone contact. Missing preference fields default to private.
    const buyerObjectId = toObjectId(buyerId);
    const buyerAccount = buyerObjectId
      ? await db
          .collection("users")
          .findOne(
            { _id: buyerObjectId },
            { projection: { phone: 1, phonePublic: 1 } }
          )
      : null;
    const buyerAllowsPhoneContact = buyerAccount?.phonePublic === true;
    const buyerPhone = buyerAllowsPhoneContact
      ? String(buyerAccount?.phone ?? user.phone ?? "").trim()
      : "";

    const now = new Date();
    const inquiry = {
      listingId,
      listingTitle: String(listing.title ?? "Untitled listing"),
      listingType: String(listing.type ?? listing.listingType ?? "product"),
      sellerId,
      sellerName: String(listing.seller ?? listing.sellerName ?? "Seller"),
      // Seller email is retained for the buyer-facing inquiry view, as in the
      // existing workflow. Do not return it to the seller in GET responses.
      sellerEmail:
        typeof listing.sellerEmail === "string"
          ? listing.sellerEmail
          : typeof listing.userEmail === "string"
            ? listing.userEmail
            : "",
      buyerId,
      buyerName: String(user.name ?? ""),
      buyerEmail: String(user.email ?? ""),
      buyerPhone,
      message,
      status: "new",
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("inquiries").insertOne(inquiry);

    let notificationCreated = false;
    try {
      await db.collection("notifications").insertOne({
        userId: sellerId,
        type: "new_inquiry",
        title: "New inquiry received",
        message: `${inquiry.buyerName || "A buyer"} sent an inquiry about "${inquiry.listingTitle}".`,
        listingId: inquiry.listingId,
        inquiryId: result.insertedId.toString(),
        read: false,
        createdAt: now,
        updatedAt: now,
      });
      notificationCreated = true;
    } catch (notificationError) {
      // The inquiry has already been saved, so notification failure should
      // not cause the buyer to be told that the inquiry itself failed.
      console.error("Create inquiry notification error:", notificationError);
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

    const view = request.nextUrl.searchParams.get("view") ?? "all";
    if (!["all", "sent", "received"].includes(view)) {
      return NextResponse.json(
        { error: "View must be all, sent, or received." },
        { status: 400 }
      );
    }

    const userId = String(user.id);
    const filter =
      view === "sent"
        ? { buyerId: userId }
        : view === "received"
          ? { sellerId: userId }
          : { $or: [{ buyerId: userId }, { sellerId: userId }] };

    const db = await getDatabase();
    const inquiries = await db
      .collection<InquiryDocument>("inquiries")
      .find(filter)
      .sort({ updatedAt: -1 })
      .limit(100)
      .toArray();

    // Re-check each buyer's current phone preference when displaying received
    // inquiries. This means turning public phone contact off also hides the
    // number in previously created inquiries. Missing preferences are private.
    const buyerIds = Array.from(
      new Set(
        inquiries
          .filter((item) => String(item.sellerId ?? "") === userId)
          .map((item) => String(item.buyerId ?? ""))
          .filter((id) => toObjectId(id) !== null)
      )
    );
    const buyerObjectIds = buyerIds
      .map((id) => toObjectId(id))
      .filter((id): id is ObjectId => id !== null);

    const buyerAccounts = buyerObjectIds.length
      ? await db
          .collection("users")
          .find(
            { _id: { $in: buyerObjectIds } },
            { projection: { phonePublic: 1 } }
          )
          .toArray()
      : [];
    const phonePublicByBuyerId = new Map<string, boolean>(
      buyerAccounts.map((account) => [
        String(account._id),
        account.phonePublic === true,
      ])
    );

    return NextResponse.json({
      success: true,
      inquiries: inquiries.map((item) => {
        const isBuyer = String(item.buyerId ?? "") === userId;
        const isSeller = String(item.sellerId ?? "") === userId;
        const buyerId = String(item.buyerId ?? "");
        const buyerPhoneIsPublic = phonePublicByBuyerId.get(buyerId) === true;

        return {
          id: item._id.toString(),
          listingId: String(item.listingId ?? ""),
          listingTitle: String(item.listingTitle ?? ""),
          listingType: String(item.listingType ?? "product"),
          sellerId: String(item.sellerId ?? ""),
          sellerName: String(item.sellerName ?? "Seller"),
          buyerId,
          buyerName: String(item.buyerName ?? ""),
          message: String(item.message ?? ""),
          status: String(item.status ?? "new"),
          createdAt: item.createdAt ?? null,
          updatedAt: item.updatedAt ?? null,
          // The seller sees buyer contact details only when the buyer has
          // explicitly enabled public phone contact.
          ...(isSeller
            ? {
                buyerEmail: String(item.buyerEmail ?? ""),
                ...(buyerPhoneIsPublic
                  ? { buyerPhone: String(item.buyerPhone ?? "") }
                  : {}),
              }
            : {}),
          // Preserve the existing buyer-facing seller email behavior.
          ...(isBuyer
            ? { sellerEmail: String(item.sellerEmail ?? "") }
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
