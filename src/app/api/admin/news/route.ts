import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin-auth";

const PAGE_SIZE = 20;

const NEWS_CATEGORIES = [
  "Crop Production",
  "Livestock",
  "Agribusiness",
  "Agricultural Technology",
  "Agricultural Policy",
  "Fisheries",
  "Climate and Environment",
  "General Agriculture",
] as const;

type NewsStatus = "draft" | "published";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createSlug(title: string) {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function serializeArticle(article: Record<string, unknown>) {
  return {
    id: article._id instanceof ObjectId
      ? article._id.toString()
      : "",
    title: article.title ?? "",
    slug: article.slug ?? "",
    summary: article.summary ?? "",
    content: article.content ?? "",
    category: article.category ?? "",
    tags: Array.isArray(article.tags) ? article.tags : [],
    coverImage: article.coverImage ?? null,
    status: article.status ?? "draft",
    author: article.author ?? null,
    createdAt: article.createdAt ?? null,
    updatedAt: article.updatedAt ?? null,
    publishedAt: article.publishedAt ?? null,
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const params = request.nextUrl.searchParams;

    const search = params.get("search")?.trim() ?? "";
    const category = params.get("category")?.trim() ?? "";
    const status = params.get("status")?.trim() ?? "";
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
      category &&
      !(NEWS_CATEGORIES as readonly string[]).includes(category)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid news category." },
        { status: 400 }
      );
    }

    if (status && !["draft", "published"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid article status." },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection("agriculturalNews");

    const filter: Record<string, unknown> = {};

    if (category) filter.category = category;
    if (status) filter.status = status;

    if (search) {
      const regex = {
        $regex: escapeRegex(search),
        $options: "i",
      };

      filter.$or = [
        { title: regex },
        { summary: regex },
        { content: regex },
        { category: regex },
        { tags: regex },
      ];
    }

    const skip = (page - 1) * PAGE_SIZE;

    const [
      totalArticles,
      publishedArticles,
      draftArticles,
      filteredCount,
      documents,
    ] = await Promise.all([
      collection.countDocuments({}),
      collection.countDocuments({ status: "published" }),
      collection.countDocuments({
        $or: [
          { status: "draft" },
          { status: { $exists: false } },
        ],
      }),
      collection.countDocuments(filter),
      collection
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .toArray(),
    ]);

    return NextResponse.json({
      success: true,
      overview: {
        totalArticles,
        publishedArticles,
        draftArticles,
      },
      categories: NEWS_CATEGORIES,
      articles: documents.map((document) =>
        serializeArticle(document as Record<string, unknown>)
      ),
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        totalArticles: filteredCount,
        totalPages: Math.ceil(filteredCount / PAGE_SIZE),
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ADMIN_UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Administrator access required.",
        },
        { status: 401 }
      );
    }

    console.error("Admin news retrieval error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve agricultural news.",
      },
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
      title,
      summary,
      content,
      category,
      tags,
      coverImage,
      status,
    } = body;

    if (
      typeof title !== "string" ||
      title.trim().length < 5 ||
      title.trim().length > 180
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Title must contain between 5 and 180 characters.",
        },
        { status: 400 }
      );
    }

    if (
      typeof summary !== "string" ||
      summary.trim().length < 10 ||
      summary.trim().length > 400
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Summary must contain between 10 and 400 characters.",
        },
        { status: 400 }
      );
    }

    if (
      typeof content !== "string" ||
      content.trim().length < 20 ||
      content.trim().length > 50000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Article content must contain between 20 and 50,000 characters.",
        },
        { status: 400 }
      );
    }

    if (
      typeof category !== "string" ||
      !(NEWS_CATEGORIES as readonly string[]).includes(category)
    ) {
      return NextResponse.json(
        { success: false, message: "Please select a valid news category." },
        { status: 400 }
      );
    }

    const articleStatus: NewsStatus =
      status === undefined ? "draft" : status as NewsStatus;

    if (!["draft", "published"].includes(articleStatus)) {
      return NextResponse.json(
        { success: false, message: "Invalid article status." },
        { status: 400 }
      );
    }

    if (
      tags !== undefined &&
      (
        !Array.isArray(tags) ||
        tags.length > 10 ||
        tags.some(
          (tag) =>
            typeof tag !== "string" ||
            tag.trim().length === 0 ||
            tag.trim().length > 30
        )
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Provide up to 10 valid tags." },
        { status: 400 }
      );
    }

    let validatedCoverImage: {
      url: string;
      publicId: string;
    } | null = null;

    if (coverImage !== undefined && coverImage !== null) {
      if (
        typeof coverImage !== "object" ||
        typeof (coverImage as Record<string, unknown>).url !== "string" ||
        typeof (coverImage as Record<string, unknown>).publicId !== "string"
      ) {
        return NextResponse.json(
          { success: false, message: "Invalid cover image information." },
          { status: 400 }
        );
      }

      const image = coverImage as Record<string, unknown>;

      try {
        const imageUrl = new URL(image.url as string);

        if (
          imageUrl.protocol !== "https:" ||
          imageUrl.hostname !== "res.cloudinary.com" ||
          !(image.publicId as string).startsWith("agrivanta/news/")
        ) {
          throw new Error("Invalid Cloudinary image.");
        }

        validatedCoverImage = {
          url: imageUrl.toString(),
          publicId: image.publicId as string,
        };
      } catch {
        return NextResponse.json(
          { success: false, message: "Invalid Cloudinary cover image." },
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const db = await getDatabase();
    const collection = db.collection("agriculturalNews");

    const baseSlug = createSlug(title.trim());

    if (!baseSlug) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid article title." },
        { status: 400 }
      );
    }

    const slug = `${baseSlug}-${new ObjectId().toString().slice(-6)}`;

    const article = {
      title: title.trim(),
      slug,
      summary: summary.trim(),
      content: content.trim(),
      category,
      tags: Array.isArray(tags)
        ? [...new Set((tags as string[]).map((tag) => tag.trim()))]
        : [],
      coverImage: validatedCoverImage,
      status: articleStatus,
      author: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
      createdAt: now,
      updatedAt: now,
      publishedAt: articleStatus === "published" ? now : null,
    };

    const result = await collection.insertOne(article);

    return NextResponse.json(
      {
        success: true,
        message:
          articleStatus === "published"
            ? "Agricultural news article published successfully."
            : "Agricultural news article saved as a draft.",
        article: serializeArticle({
          ...article,
          _id: result.insertedId,
        }),
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ADMIN_UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Administrator access required.",
        },
        { status: 401 }
      );
    }

    console.error("Admin news creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create the agricultural news article.",
      },
      { status: 500 }
    );
  }
}