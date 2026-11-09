import { connection, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { sanitizeArticleHtml } from "@/lib/sanitize-html";

const PAGE_SIZE = 12;

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

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function serializeArticle(article: Record<string, unknown>, includeContent = false) {
  const author =
    article.author &&
    typeof article.author === "object"
      ? article.author as Record<string, unknown>
      : null;

  const coverImage =
    article.coverImage &&
    typeof article.coverImage === "object"
      ? article.coverImage as Record<string, unknown>
      : null;

  return {
    id: article._id?.toString?.() ?? "",
    title: article.title ?? "",
    slug: article.slug ?? "",
    summary: article.summary ?? "",
    category: article.category ?? "",
    tags: Array.isArray(article.tags) ? article.tags : [],
    coverImage:
      typeof coverImage?.url === "string"
        ? { url: coverImage.url }
        : null,
    author: {
      name:
        typeof author?.name === "string"
          ? author.name
          : "AgriVanta Editorial Team",
    },
    createdAt: article.createdAt ?? null,
    publishedAt: article.publishedAt ?? null,
    ...(includeContent
      ? {
          content:
            typeof article.content === "string"
              ? sanitizeArticleHtml(article.content)
              : "",
        }
      : {}),
  };
}

export async function GET(request: Request) {
  await connection();
  try {
    const params = new URL(request.url).searchParams;

    const search = (params.get("search") ?? "").trim();
    const category = (params.get("category") ?? "").trim();
    const slug = (params.get("slug") ?? "").trim();
    const requestedPage = Number(params.get("page") ?? "1");

    if (
      search.length > 100 ||
      slug.length > 140 ||
      !Number.isInteger(requestedPage) ||
      requestedPage < 1 ||
      requestedPage > 10000
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid news search parameters." },
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

    const db = await getDatabase();
    const collection = db.collection("agriculturalNews");

    if (slug) {
      const article = await collection.findOne({
        slug,
        status: "published",
      });

      if (!article) {
        return NextResponse.json(
          { success: false, message: "Article not found." },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        article: serializeArticle(
          article as Record<string, unknown>,
          true
        ),
      });
    }

    const filter: Record<string, unknown> = {
      status: "published",
    };

    if (category) {
      filter.category = category;
    }

    if (search) {
      const regex = {
        $regex: escapeRegex(search),
        $options: "i",
      };

      filter.$or = [
        { title: regex },
        { summary: regex },
        { category: regex },
        { tags: regex },
      ];
    }

    const skip = (requestedPage - 1) * PAGE_SIZE;

    const [totalArticles, documents, categories] = await Promise.all([
      collection.countDocuments(filter),
      collection
        .find(filter)
        .project({
          content: 0,
          "author.email": 0,
          "author.id": 0,
          publicationHistory: 0,
          lastPublicationAction: 0,
          lastEditedBy: 0,
        })
        .sort({ publishedAt: -1, createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .toArray(),
      collection.distinct("category", { status: "published" }),
    ]);

    return NextResponse.json({
      success: true,
      articles: documents.map((document) =>
        serializeArticle(document as Record<string, unknown>)
      ),
      categories: categories.filter(
        (value): value is string =>
          typeof value === "string" &&
          (NEWS_CATEGORIES as readonly string[]).includes(value)
      ),
      pagination: {
        page: requestedPage,
        pageSize: PAGE_SIZE,
        totalArticles,
        totalPages: Math.ceil(totalArticles / PAGE_SIZE),
      },
    });
  } catch (error) {
    console.error("Public agricultural news retrieval failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve agricultural news.",
      },
      { status: 500 }
    );
  }
}