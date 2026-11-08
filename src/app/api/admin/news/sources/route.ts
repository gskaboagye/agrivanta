import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin-auth";

const SOURCE_TYPES = ["rss", "api", "website"] as const;

const NEWS_CATEGORIES = [
  "Crop Production",
  "Livestock",
  "Agribusiness",
  "Agricultural Technology",
  "Agricultural Policy",
  "Fisheries",
  "Climate and Environment",
  "General Agriculture",
];

function validateSourceUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2048) {
    return false;
  }

  try {
    const url = new URL(value.trim());

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      !url.hostname.includes(".") ||
      url.hostname === "localhost" ||
      url.hostname.endsWith(".local")
    ) {
      return false;
    }

    // Reject literal private, loopback and link-local IPv4 addresses.
    const ipv4 = url.hostname.match(
      /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
    );

    if (ipv4) {
      const octets = ipv4.slice(1).map(Number);

      if (octets.some((part) => part > 255)) return false;

      const [a, b] = octets;

      if (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        a >= 224
      ) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    await requireAdmin();

    const db = await getDatabase();
    const collection = db.collection("newsSources");

    const sources = await collection
      .find({})
      .sort({ createdAt: -1, _id: -1 })
      .toArray();

    const totalSources = sources.length;
    const activeSources = sources.filter(
      (source) => source.status === "active"
    ).length;

    return NextResponse.json({
      success: true,
      overview: {
        totalSources,
        activeSources,
        inactiveSources: totalSources - activeSources,
      },
      sources: sources.map((source) => ({
        id: source._id.toString(),
        name: source.name,
        description: source.description ?? "",
        websiteUrl: source.websiteUrl,
        feedUrl: source.feedUrl,
        type: source.type,
        category: source.category,
        country: source.country ?? "",
        status: source.status,
        createdBy: source.createdBy,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt,
      })),
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

    console.error("Admin news sources retrieval error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve news sources." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    const origin = request.headers.get("origin");

    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      websiteUrl,
      feedUrl,
      type,
      category,
      country,
    } = body;

    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 120
    ) {
      return NextResponse.json(
        { success: false, message: "Source name must contain 2–120 characters." },
        { status: 400 }
      );
    }

    if (
      description !== undefined &&
      (
        typeof description !== "string" ||
        description.trim().length > 500
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Description must not exceed 500 characters." },
        { status: 400 }
      );
    }

    if (!validateSourceUrl(websiteUrl)) {
      return NextResponse.json(
        { success: false, message: "Enter a valid HTTPS publisher website URL." },
        { status: 400 }
      );
    }

    if (!validateSourceUrl(feedUrl)) {
      return NextResponse.json(
        { success: false, message: "Enter a valid HTTPS feed or API URL." },
        { status: 400 }
      );
    }

    if (
      typeof type !== "string" ||
      !(SOURCE_TYPES as readonly string[]).includes(type)
    ) {
      return NextResponse.json(
        { success: false, message: "Select a valid source type." },
        { status: 400 }
      );
    }

    if (
      typeof category !== "string" ||
      !NEWS_CATEGORIES.includes(category)
    ) {
      return NextResponse.json(
        { success: false, message: "Select a valid agricultural category." },
        { status: 400 }
      );
    }

    if (
      country !== undefined &&
      (typeof country !== "string" || country.trim().length > 80)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid country value." },
        { status: 400 }
      );
    }

    const normalizedWebsite = (websiteUrl as string).trim();
    const normalizedFeed = (feedUrl as string).trim();

    const db = await getDatabase();
    const collection = db.collection("newsSources");

    const existingSource = await collection.findOne({
      feedUrl: normalizedFeed,
    });

    if (existingSource) {
      return NextResponse.json(
        {
          success: false,
          message: "This news feed has already been registered.",
        },
        { status: 409 }
      );
    }

    const now = new Date();

    const source = {
      name: name.trim(),
      description:
        typeof description === "string" ? description.trim() : "",
      websiteUrl: normalizedWebsite,
      feedUrl: normalizedFeed,
      type,
      category,
      country:
        typeof country === "string" ? country.trim() : "",
      status: "active",
      createdBy: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
      createdAt: now,
      updatedAt: now,
      lastFetchedAt: null,
      lastFetchStatus: "not_started",
    };

    const result = await collection.insertOne(source);

    return NextResponse.json(
      {
        success: true,
        message: "Trusted news source registered successfully.",
        source: {
          id: result.insertedId.toString(),
          ...source,
        },
      },
      { status: 201 }
    );
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

    console.error("Admin news source creation error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to register news source." },
      { status: 500 }
    );
  }
}