import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin-auth";

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

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isValidCategory(category: unknown): category is string {
  return (
    typeof category === "string" &&
    (NEWS_CATEGORIES as readonly string[]).includes(category)
  );
}

function validateCoverImage(value: unknown) {
  if (value === null) return { valid: true, value: null };

  if (
    typeof value !== "object" ||
    typeof (value as Record<string, unknown>).url !== "string" ||
    typeof (value as Record<string, unknown>).publicId !== "string"
  ) {
    return { valid: false, value: null };
  }

  const image = value as Record<string, unknown>;

  try {
    const url = new URL(image.url as string);

    if (
      url.protocol !== "https:" ||
      url.hostname !== "res.cloudinary.com" ||
      !(image.publicId as string).startsWith("agrivanta/news/")
    ) {
      return { valid: false, value: null };
    }

    return {
      valid: true,
      value: {
        url: url.toString(),
        publicId: image.publicId as string,
      },
    };
  } catch {
    return { valid: false, value: null };
  }
}

async function getArticleId(context: RouteContext) {
  const { id } = await context.params;

  if (!ObjectId.isValid(id)) return null;

  return new ObjectId(id);
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const admin = await requireAdmin();

    const origin = request.headers.get("origin");

    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    const objectId = await getArticleId(context);

    if (!objectId) {
      return NextResponse.json(
        { success: false, message: "Invalid article ID." },
        { status: 400 }
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

    const { title, summary, content, category, tags, coverImage } = body;

    if (
      typeof title !== "string" ||
      title.trim().length < 5 ||
      title.trim().length > 180
    ) {
      return NextResponse.json(
        { success: false, message: "Title must contain 5–180 characters." },
        { status: 400 }
      );
    }

    if (
      typeof summary !== "string" ||
      summary.trim().length < 10 ||
      summary.trim().length > 400
    ) {
      return NextResponse.json(
        { success: false, message: "Summary must contain 10–400 characters." },
        { status: 400 }
      );
    }

    if (
      typeof content !== "string" ||
      content.trim().length < 20 ||
      content.trim().length > 50000
    ) {
      return NextResponse.json(
        { success: false, message: "Content must contain 20–50,000 characters." },
        { status: 400 }
      );
    }

    if (!isValidCategory(category)) {
      return NextResponse.json(
        { success: false, message: "Invalid news category." },
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

    const imageResult =
      coverImage === undefined
        ? null
        : validateCoverImage(coverImage);

    if (imageResult && !imageResult.valid) {
      return NextResponse.json(
        { success: false, message: "Invalid Cloudinary cover image." },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection("agriculturalNews");

    const existingArticle = await collection.findOne({ _id: objectId });

    if (!existingArticle) {
      return NextResponse.json(
        { success: false, message: "Article not found." },
        { status: 404 }
      );
    }

    const now = new Date();
    const baseSlug = title.trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 120);

    const updateFields: Record<string, unknown> = {
      title: title.trim(),
      slug: `${baseSlug}-${objectId.toString().slice(-6)}`,
      summary: summary.trim(),
      content: content.trim(),
      category,
      tags: Array.isArray(tags)
        ? [...new Set((tags as string[]).map((tag) => tag.trim()))]
        : [],
      updatedAt: now,
      lastEditedBy: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    };

    if (coverImage !== undefined) {
      updateFields.coverImage = imageResult?.value ?? null;
    }

    await collection.updateOne(
      { _id: objectId },
      { $set: updateFields }
    );

    const updatedArticle = await collection.findOne({ _id: objectId });

    return NextResponse.json({
      success: true,
      message: "Article updated successfully.",
      article: updatedArticle,
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

    console.error("Admin news update error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update article." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const admin = await requireAdmin();

    const origin = request.headers.get("origin");

    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    const objectId = await getArticleId(context);

    if (!objectId) {
      return NextResponse.json(
        { success: false, message: "Invalid article ID." },
        { status: 400 }
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

    const { status } = body;

    if (status !== "draft" && status !== "published") {
      return NextResponse.json(
        { success: false, message: "Status must be draft or published." },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection("agriculturalNews");

    const article = await collection.findOne({ _id: objectId });

    if (!article) {
      return NextResponse.json(
        { success: false, message: "Article not found." },
        { status: 404 }
      );
    }

    if ((article.status ?? "draft") === status) {
      return NextResponse.json(
        { success: false, message: `Article is already ${status}.` },
        { status: 409 }
      );
    }

    const now = new Date();

    const historyEntry = {
      action: status === "published" ? "published" : "unpublished",
      adminId: admin.id,
      adminName: admin.name,
      adminEmail: admin.email,
      timestamp: now,
    };

    await collection.updateOne(
      { _id: objectId },
      {
        $set: {
          status,
          updatedAt: now,
          publishedAt:
            status === "published"
              ? now
              : article.publishedAt ?? null,
          lastPublicationAction: historyEntry,
        },
        $push: {
          publicationHistory: historyEntry,
        },
      } as any
    );

    return NextResponse.json({
      success: true,
      message:
        status === "published"
          ? "Article published successfully."
          : "Article unpublished successfully.",
      status,
      publication: historyEntry,
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

    console.error("Admin news publication error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to change article publication status." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await requireAdmin();

    const origin = request.headers.get("origin");

    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    const objectId = await getArticleId(context);

    if (!objectId) {
      return NextResponse.json(
        { success: false, message: "Invalid article ID." },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection("agriculturalNews");

    const result = await collection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Article not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Article deleted successfully.",
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

    console.error("Admin news deletion error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to delete article." },
      { status: 500 }
    );
  }
}