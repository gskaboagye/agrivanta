import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { getDatabase } from "@/lib/mongodb";

const PAGE_SIZE = 12;

const REPORT_CATEGORIES = [
  "Crop Production",
  "Livestock",
  "Agribusiness",
  "Agricultural Technology",
  "Agricultural Policy",
  "Fisheries",
  "Climate and Environment",
  "General Agriculture",
];

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  await connection();

  try {
    const params = request.nextUrl.searchParams;
    const search = params.get("search")?.trim() ?? "";
    const category = params.get("category")?.trim() ?? "";
    const page = Number(params.get("page") ?? "1");

    if (
      search.length > 100 ||
      !Number.isInteger(page) ||
      page < 1 ||
      page > 100000
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid search parameters." },
        { status: 400 }
      );
    }

    if (category && !REPORT_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { success: false, message: "Invalid report category." },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection("agriculturalReports");

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
        { description: regex },
        { source: regex },
        { category: regex },
      ];
    }

    const skip = (page - 1) * PAGE_SIZE;

    const [totalReports, documents] = await Promise.all([
      collection.countDocuments(filter),
      collection
        .find(filter)
        .project({
          title: 1,
          description: 1,
          category: 1,
          type: 1,
          resource: 1,
          source: 1,
          publicationDate: 1,
          publishedAt: 1,
        })
        .sort({ publicationDate: -1, createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .toArray(),
    ]);

    const reports = documents.map((document) => ({
      id: document._id.toString(),
      title: document.title ?? "",
      description: document.description ?? "",
      category: document.category ?? "",
      type: document.type ?? "pdf",
      resource: document.resource ?? null,
      source: document.source ?? "",
      publicationDate: document.publicationDate ?? null,
      publishedAt: document.publishedAt ?? null,
    }));

    return NextResponse.json({
      success: true,
      reports,
      categories: REPORT_CATEGORIES,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total: totalReports,
        totalPages: Math.ceil(totalReports / PAGE_SIZE),
      },
    });
  } catch (error) {
    console.error("Public agricultural reports error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve agricultural reports.",
      },
      { status: 500 }
    );
  }
}