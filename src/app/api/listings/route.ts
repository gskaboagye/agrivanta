
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

const listingTypes = [
  "product",
  "hire",
  "service",
  "worker",
  "expert",
] as const;

const requiredFields = [
  "title",
  "type",
  "category",
  "description",
  "price",
  "priceUnit",
  "location",
  "seller",
  "image",
] as const;

function isValidListing(body: Record<string, unknown>) {
  const hasRequiredFields = requiredFields.every(
    (field) =>
      typeof body[field] === "string" &&
      (body[field] as string).trim().length > 0
  );

  return (
    hasRequiredFields &&
    (listingTypes as readonly unknown[]).includes(body.type) &&
    typeof body.price === "number" &&
    Number.isFinite(body.price) &&
    body.price >= 0 &&
    (body.skills === undefined ||
      (Array.isArray(body.skills) &&
        body.skills.every((skill) => typeof skill === "string")))
  );
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const searchParams = request.nextUrl.searchParams;

    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const location = searchParams.get("location");
    const search = searchParams.get("q")?.trim();

    if (type && !(listingTypes as readonly string[]).includes(type)) {
      return NextResponse.json(
        { success: false, message: "Invalid listing type." },
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
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.$or = [
        { title: { $regex: escapedSearch, $options: "i" } },
        { category: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } },
        { location: { $regex: escapedSearch, $options: "i" } },
        { skills: { $regex: escapedSearch, $options: "i" } },
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
      listings: listings.map((listing) => ({
        ...listing,
        id: listing._id.toString(),
        _id: undefined,
      })),
    });
  } catch (error) {
    console.error("GET /api/listings failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load listings." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      !isValidListing(body as Record<string, unknown>)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid listing. Check the required fields, listing type, price, and skills.",
        },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;
    const db = await getDatabase();

    const listing = {
      title: (data.title as string).trim(),
      type: data.type,
      category: (data.category as string).trim(),
      description: (data.description as string).trim(),
      price: data.price,
      priceUnit: (data.priceUnit as string).trim(),
      location: (data.location as string).trim(),
      seller: (data.seller as string).trim(),
      image: (data.image as string).trim(),
      mediaCount: 1,
      skills: data.skills ?? [],
      experience:
        typeof data.experience === "string" ? data.experience : "",
      availability:
        typeof data.availability === "string" ? data.availability : "",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("listings").insertOne(listing);

    return NextResponse.json(
      {
        success: true,
        message: "Listing created successfully.",
        id: result.insertedId.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/listings failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create listing." },
      { status: 500 }
    );
  }
}
