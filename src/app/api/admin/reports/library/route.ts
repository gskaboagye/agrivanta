import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin-auth";

const PAGE_SIZE = 20;

const REPORT_CATEGORIES = [
  "Crop Production",
  "Livestock",
  "Agribusiness",
  "Agricultural Technology",
  "Agricultural Policy",
  "Fisheries",
  "Climate and Environment",
  "General Agriculture",
] as const;

type ReportStatus = "draft" | "published";
type ReportType = "pdf" | "external";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isValidCategory(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (REPORT_CATEGORIES as readonly string[]).includes(value)
  );
}

function validateReportResource(
  type: unknown,
  value: unknown
): { valid: boolean; resource: Record<string, unknown> | null } {
  if (type === "pdf") {
    if (
      typeof value !== "object" ||
      value === null ||
      typeof (value as Record<string, unknown>).url !== "string" ||
      typeof (value as Record<string, unknown>).publicId !== "string"
    ) {
      return { valid: false, resource: null };
    }

    const file = value as Record<string, unknown>;

    try {
      const url = new URL(file.url as string);

      if (
        url.protocol !== "https:" ||
        url.hostname !== "res.cloudinary.com" ||
        !(file.publicId as string).startsWith("agrivanta/reports/") ||
        file.format !== "pdf"
      ) {
        return { valid: false, resource: null };
      }

      return {
        valid: true,
        resource: {
          url: url.toString(),
          publicId: file.publicId,
          format: "pdf",
          bytes:
            typeof file.bytes === "number" && file.bytes > 0
              ? file.bytes
              : null,
        },
      };
    } catch {
      return { valid: false, resource: null };
    }
  }

  if (type === "external") {
    if (
      typeof value !== "object" ||
      value === null ||
      typeof (value as Record<string, unknown>).url !== "string" ||
      (value as Record<string, unknown>).url!.toString().length > 2048
    ) {
      return { valid: false, resource: null };
    }

    try {
      const externalResource = value as Record<string, unknown>;
      const url = new URL(externalResource.url as string);

      if (
        url.protocol !== "https:" ||
        !url.hostname ||
        url.username ||
        url.password
      ) {
        return { valid: false, resource: null };
      }

      return {
        valid: true,
        resource: { url: url.toString() },
      };
    } catch {
      return { valid: false, resource: null };
    }
  }

  return { valid: false, resource: null };
}

function serializeReport(report: Record<string, unknown>) {
  return {
    id: report._id instanceof ObjectId ? report._id.toString() : "",
    title: report.title ?? "",
    description: report.description ?? "",
    category: report.category ?? "",
    type: report.type ?? "pdf",
    resource: report.resource ?? null,
    source: report.source ?? "",
    publicationDate: report.publicationDate ?? null,
    status: report.status ?? "draft",
    author: report.author ?? null,
    createdAt: report.createdAt ?? null,
    updatedAt: report.updatedAt ?? null,
    publishedAt: report.publishedAt ?? null,
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

    if (category && !isValidCategory(category)) {
      return NextResponse.json(
        { success: false, message: "Invalid report category." },
        { status: 400 }
      );
    }

    if (status && !["draft", "published"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid report status." },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection("agriculturalReports");
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
        { description: regex },
        { source: regex },
        { category: regex },
      ];
    }

    const skip = (page - 1) * PAGE_SIZE;

    const [
      totalReports,
      publishedReports,
      draftReports,
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
        totalReports,
        publishedReports,
        draftReports,
      },
      categories: REPORT_CATEGORIES,
      reports: documents.map((document) =>
        serializeReport(document as Record<string, unknown>)
      ),
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        totalReports: filteredCount,
        totalPages: Math.ceil(filteredCount / PAGE_SIZE),
      },
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

    console.error("Admin reports retrieval error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve agricultural reports." },
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
      description,
      category,
      type,
      resource,
      source,
      publicationDate,
      status,
    } = body;

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
      typeof description !== "string" ||
      description.trim().length < 10 ||
      description.trim().length > 1000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Description must contain 10–1,000 characters.",
        },
        { status: 400 }
      );
    }

    if (!isValidCategory(category)) {
      return NextResponse.json(
        { success: false, message: "Please select a valid report category." },
        { status: 400 }
      );
    }

    if (type !== "pdf" && type !== "external") {
      return NextResponse.json(
        { success: false, message: "Report type must be PDF or external." },
        { status: 400 }
      );
    }

    if (
      typeof source !== "string" ||
      source.trim().length < 2 ||
      source.trim().length > 160
    ) {
      return NextResponse.json(
        { success: false, message: "Source must contain 2–160 characters." },
        { status: 400 }
      );
    }

    if (
      typeof publicationDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(publicationDate) ||
      Number.isNaN(Date.parse(`${publicationDate}T00:00:00.000Z`)) ||
      new Date(`${publicationDate}T00:00:00.000Z`).toISOString().slice(0, 10) !== publicationDate
    ) {
      return NextResponse.json(
        { success: false, message: "Provide a valid publication date." },
        { status: 400 }
      );
    }

    const reportStatus: ReportStatus =
      status === undefined ? "draft" : status as ReportStatus;

    if (!["draft", "published"].includes(reportStatus)) {
      return NextResponse.json(
        { success: false, message: "Invalid report status." },
        { status: 400 }
      );
    }

    const resourceResult = validateReportResource(type, resource);

    if (!resourceResult.valid || !resourceResult.resource) {
      return NextResponse.json(
        { success: false, message: "Invalid report file or external URL." },
        { status: 400 }
      );
    }

    const now = new Date();
    const db = await getDatabase();
    const collection = db.collection("agriculturalReports");

    const report = {
      title: title.trim(),
      description: description.trim(),
      category,
      type: type as ReportType,
      resource: resourceResult.resource,
      source: source.trim(),
      publicationDate,
      status: reportStatus,
      author: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
      createdAt: now,
      updatedAt: now,
      publishedAt: reportStatus === "published" ? now : null,
      publicationHistory:
        reportStatus === "published"
          ? [
              {
                action: "published",
                adminId: admin.id,
                adminName: admin.name,
                timestamp: now,
              },
            ]
          : [],
    };

    const result = await collection.insertOne(report);

    return NextResponse.json(
      {
        success: true,
        message:
          reportStatus === "published"
            ? "Agricultural report published successfully."
            : "Agricultural report saved as a draft.",
        report: serializeReport({
          ...report,
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
        { success: false, message: "Administrator access required." },
        { status: 401 }
      );
    }

    console.error("Admin report creation error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create the agricultural report." },
      { status: 500 }
    );
  }
}