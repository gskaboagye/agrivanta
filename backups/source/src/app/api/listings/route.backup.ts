import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

const allowedTypes = [
  "product",
  "hire",
  "service",
  "worker",
  "expert",
] as const;

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

    const filter: Record<string, unknown> = { status: "active" };

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
      listings: listings.map(({ _id, ...listing }) => ({
        ...listing,
        id: _id.toString(),
      })),
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

    const required = [
      "title",
      "type",
      "category",
      "description",
      "priceUnit",
      "location",
      "seller",
      "image",
    ];

    const missing = required.some(
      (key) =>
        typeof data[key] !== "string" ||
        !(data[key] as string).trim()
    );

    if (
      missing ||
      !(allowedTypes as readonly unknown[]).includes(data.type) ||
      typeof data.price !== "number" ||
      !Number.isFinite(data.price) ||
      data.price < 0 ||
      (data.skills !== undefined &&
        (!Array.isArray(data.skills) ||
          !data.skills.every(
            (skill) => typeof skill === "string"
          )))
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide valid listing details.",
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const now = new Date();

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
      skills: data.skills ?? [],
      experience:
        typeof data.experience === "string"
          ? data.experience
          : "",
      availability:
        typeof data.availability === "string"
          ? data.availability
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
    console.error("Failed to create listing:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create listing." },
      { status: 500 }
    );
  }
}
