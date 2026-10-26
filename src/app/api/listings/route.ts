
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

const allowedTypes = [
  "product",
  "hire",
  "service",
  "worker",
  "expert",
] as const;

type ListingType = (typeof allowedTypes)[number];

const rolePermissions: Record<string, readonly ListingType[]> = {
  farmer: ["product", "hire"],
  buyer: [],
  supplier: ["product", "service"],
  worker: ["worker"],
  expert: ["expert", "service"],
};

const fieldLimits: Record<string, number> = {
  title: 120,
  category: 80,
  description: 5000,
  priceUnit: 40,
  location: 120,
  image: 2000,
  experience: 500,
  availability: 500,
};

function isNonEmptyText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validText(
  value: unknown,
  maxLength: number
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const params = request.nextUrl.searchParams;

    const type = params.get("type");
    const category = params.get("category");
    const location = params.get("location");
    const search = params.get("q")?.trim();

    if (
      type &&
      !(allowedTypes as readonly string[]).includes(type)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid listing type." },
        { status: 400 }
      );
    }

    if (
      (category && category.length > 80) ||
      (location && location.length > 120) ||
      (search && search.length > 100)
    ) {
      return NextResponse.json(
        { success: false, message: "Search filters are too long." },
        { status: 400 }
      );
    }

    const filter: Record<string, unknown> = {
      status: "active",
    };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (location) filter.location = location;

    if (search) {
      const escaped = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { category: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
        { location: { $regex: escaped, $options: "i" } },
        { skills: { $regex: escaped, $options: "i" } },
      ];
    }

    const listings = await db
      .collection("listings")
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({
      success: true,
      count: listings.length,
      listings: listings.map((document) => {
        const {
          _id,
          userId: _userId,
          userEmail: _userEmail,
          sellerId: _sellerId,
          sellerEmail: _sellerEmail,
          ownerId: _ownerId,
          ownerEmail: _ownerEmail,
          createdBy: _createdBy,
          ...publicListing
        } = document;

        return {
          ...publicListing,
          id: _id.toString(),
        };
      }),
    });
  } catch (error) {
    console.error("Failed to retrieve listings:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load listings." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication must happen before accepting a listing.
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in before creating a listing.",
        },
        { status: 401 }
      );
    }

    const permittedTypes = rolePermissions[user.role] ?? [];

    if (permittedTypes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account type does not have permission to create listings.",
        },
        { status: 403 }
      );
    }

    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const requiredLimits = {
      title: fieldLimits.title,
      category: fieldLimits.category,
      description: fieldLimits.description,
      priceUnit: fieldLimits.priceUnit,
      location: fieldLimits.location,
      image: fieldLimits.image,
    };

    const missingOrInvalid = Object.entries(requiredLimits).some(
      ([key, maxLength]) => !validText(data[key], maxLength)
    );

    if (
      missingOrInvalid ||
      typeof data.type !== "string" ||
      !(allowedTypes as readonly string[]).includes(data.type) ||
      !permittedTypes.includes(data.type as ListingType) ||
      typeof data.price !== "number" ||
      !Number.isFinite(data.price) ||
      data.price < 0 ||
      data.price > 1_000_000_000 ||
      (data.skills !== undefined &&
        (!Array.isArray(data.skills) ||
          data.skills.length > 50 ||
          !data.skills.every(
            (skill) =>
              typeof skill === "string" &&
              skill.trim().length > 0 &&
              skill.trim().length <= 80
          ))) ||
      (data.experience !== undefined &&
        (typeof data.experience !== "string" ||
          data.experience.length > fieldLimits.experience)) ||
      (data.availability !== undefined &&
        (typeof data.availability !== "string" ||
          data.availability.length > fieldLimits.availability))
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please provide valid listing details for your account type.",
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const now = new Date();

    const listing = {
      title: (data.title as string).trim(),
      type: data.type as ListingType,
      category: (data.category as string).trim(),
      description: (data.description as string).trim(),
      price: data.price,
      priceUnit: (data.priceUnit as string).trim(),
      location: (data.location as string).trim(),

      // Seller identity comes from the authenticated session,
      // never from a user-supplied request field.
      seller: user.name,
      userId: user.id,
      userEmail: user.email,
      sellerId: user.id,
      sellerEmail: user.email,
      ownerId: user.id,
      ownerEmail: user.email,
      createdBy: user.id,
      sellerRole: user.role,

      image: (data.image as string).trim(),
      skills: Array.isArray(data.skills)
        ? data.skills.map((skill) => (skill as string).trim())
        : [],
      experience:
        typeof data.experience === "string"
          ? data.experience.trim()
          : "",
      availability:
        typeof data.availability === "string"
          ? data.availability.trim()
          : "",
      mediaCount: 1,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .collection("listings")
      .insertOne(listing);

    return NextResponse.json(
      {
        success: true,
        message: "Listing created successfully.",
        id: result.insertedId.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    console.error("Failed to create listing:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create listing." },
      { status: 500 }
    );
  }
}
