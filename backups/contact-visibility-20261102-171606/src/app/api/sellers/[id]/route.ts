
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type SellerDocument = {
  _id: ObjectId;
  name?: string;
  role?: string;
  phone?: string;
  phonePublic?: boolean;
  whatsappEnabled?: boolean;
  createdAt?: Date | string | null;
};

type ListingMedia = {
  secure_url?: string;
  url?: string;
  type?: string;
  resource_type?: string;
};

type ListingDocument = {
  _id: ObjectId;
  title?: string;
  category?: string;
  description?: string;
  price?: number | null;
  priceUnit?: string;
  location?: string;
  image?: string;
  images?: string[];
  media?: ListingMedia[];
  type?: string;
  listingType?: string;
  status?: string;
  userId?: unknown;
  sellerId?: unknown;
  ownerId?: unknown;
  createdBy?: unknown;
  createdAt?: Date | string | null;
};

function isValidImageUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

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

function getListingImageData(listing: ListingDocument) {
  const directImages = [
    listing.image,
    ...(Array.isArray(listing.images) ? listing.images : []),
  ].filter(isValidImageUrl);

  const mediaImages = Array.isArray(listing.media)
    ? listing.media
        .filter(
          (item) =>
            item.type !== "video" &&
            item.resource_type !== "video"
        )
        .map((item) => item.secure_url ?? item.url ?? "")
        .filter(isValidImageUrl)
    : [];

  const images = Array.from(
    new Set([...directImages, ...mediaImages])
  );

  return {
    image: images[0] ?? "",
    images,
  };
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!/^[a-fA-F0-9]{24}$/.test(id) || !ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid seller ID.",
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const sellerObjectId = new ObjectId(id);
    const sellerIdString = sellerObjectId.toString();

    const users = db.collection<SellerDocument>("users");
    const listingsCollection =
      db.collection<ListingDocument>("listings");

    // Fetch only the fields needed to build the public seller profile.
    const seller = await users.findOne(
      { _id: sellerObjectId },
      {
        projection: {
          name: 1,
          role: 1,
          phone: 1,
          phonePublic: 1,
          whatsappEnabled: 1,
          createdAt: 1,
        },
      }
    );

    if (!seller) {
      return NextResponse.json(
        {
          success: false,
          error: "Seller not found.",
        },
        { status: 404 }
      );
    }

    // Support legacy ownership fields stored as strings or ObjectIds.
    const ownershipFilter = {
      status: "active",
      $or: [
        { userId: sellerIdString },
        { sellerId: sellerIdString },
        { ownerId: sellerIdString },
        { createdBy: sellerIdString },
        { userId: sellerObjectId },
        { sellerId: sellerObjectId },
        { ownerId: sellerObjectId },
        { createdBy: sellerObjectId },
      ],
    };

    const listings = await listingsCollection
      .find(ownershipFilter)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    const safeListings = listings.map((listing) => {
      const imageData = getListingImageData(listing);

      return {
        id: listing._id.toString(),
        title: listing.title ?? "",
        category: listing.category ?? "",
        description: listing.description ?? "",
        price: listing.price ?? null,
        priceUnit: listing.priceUnit ?? "",
        location: listing.location ?? "",
        image: imageData.image,
        images: imageData.images,
        type: listing.type ?? listing.listingType ?? "product",
        listingType:
          listing.listingType ?? listing.type ?? "product",
        createdAt: listing.createdAt ?? null,
      };
    });

    // Missing preferences on older accounts default to private.
    const hasPhone = Boolean(seller.phone?.trim());
    const phonePublic = seller.phonePublic === true && hasPhone;
    const whatsappEnabled =
      phonePublic && seller.whatsappEnabled === true;

    return NextResponse.json(
      {
        success: true,
        seller: {
          id: sellerIdString,
          name: seller.name ?? "AgriVanta Seller",
          role: seller.role ?? "seller",

          // Never return a phone number unless public contact is enabled.
          phone: phonePublic ? seller.phone!.trim() : "",
          phonePublic,
          whatsappEnabled,
          joinedAt: seller.createdAt ?? null,
        },
        listings: safeListings,
        count: safeListings.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Seller profile API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load seller profile.",
      },
      { status: 500 }
    );
  }
}
