import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin-auth";
import cloudinary from "@/lib/cloudinary";

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

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isValidCategory(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (REPORT_CATEGORIES as readonly string[]).includes(value)
  );
}

function validateResource(type: unknown, value: unknown) {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return { valid: false, resource: null };
  }

  const resource = value as Record<string, unknown>;

  if (type === "pdf") {
    if (
      typeof resource.url !== "string" ||
      typeof resource.publicId !== "string" ||
      resource.format !== "pdf"
    ) {
      return { valid: false, resource: null };
    }

    try {
      const url = new URL(resource.url);

      if (
        url.protocol !== "https:" ||
        url.hostname !== "res.cloudinary.com" ||
        !resource.publicId.startsWith("agrivanta/reports/")
      ) {
        return { valid: false, resource: null };
      }

      return {
        valid: true,
        resource: {
          url: url.toString(),
          publicId: resource.publicId,
          format: "pdf",
          bytes:
            typeof resource.bytes === "number" &&
            resource.bytes > 0
              ? resource.bytes
              : null,
        },
      };
    } catch {
      return { valid: false, resource: null };
    }
  }

  if (type === "external") {
    if (
      typeof resource.url !== "string" ||
      resource.url.length > 2048
    ) {
      return { valid: false, resource: null };
    }

    try {
      const url = new URL(resource.url);

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

function getPdfPublicId(report: Record<string, unknown>) {
  if (report.type !== "pdf" || !report.resource) {
    return null;
  }

  const resource = report.resource as Record<string, unknown>;

  if (
    typeof resource.publicId === "string" &&
    resource.publicId.startsWith("agrivanta/reports/")
  ) {
    return resource.publicId;
  }

  return null;
}

async function removeCloudinaryPdf(publicId: string) {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: "raw",
  });
}

async function getReportId(context: RouteContext) {
  const { id } = await context.params;

  if (!ObjectId.isValid(id)) return null;

  return new ObjectId(id);
}

function validateOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");

  return !origin || origin === request.nextUrl.origin;
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const admin = await requireAdmin();

    if (!validateOrigin(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    const objectId = await getReportId(context);

    if (!objectId) {
      return NextResponse.json(
        { success: false, message: "Invalid report ID." },
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

    const {
      title,
      description,
      category,
      type,
      resource,
      source,
      publicationDate,
    } = body;

    if (
      typeof title !== "string" ||
      title.trim().length < 5 ||
      title.trim().length > 180
    ) {
      return NextResponse.json(
        { success: false, message: "Title must contain 5-180 characters." },
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
          message: "Description must contain 10-1,000 characters.",
        },
        { status: 400 }
      );
    }

    if (!isValidCategory(category)) {
      return NextResponse.json(
        { success: false, message: "Invalid report category." },
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
        { success: false, message: "Source must contain 2-160 characters." },
        { status: 400 }
      );
    }

    if (
      typeof publicationDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(publicationDate) ||
      Number.isNaN(Date.parse(`${publicationDate}T00:00:00.000Z`)) ||
      new Date(`${publicationDate}T00:00:00.000Z`)
        .toISOString()
        .slice(0, 10) !== publicationDate
    ) {
      return NextResponse.json(
        { success: false, message: "Provide a valid publication date." },
        { status: 400 }
      );
    }

    const resourceResult = validateResource(type, resource);

    if (!resourceResult.valid || !resourceResult.resource) {
      return NextResponse.json(
        { success: false, message: "Invalid PDF file or external URL." },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection("agriculturalReports");

    const existingReport = await collection.findOne({
      _id: objectId,
    });

    if (!existingReport) {
      return NextResponse.json(
        { success: false, message: "Report not found." },
        { status: 404 }
      );
    }

    const oldPublicId = getPdfPublicId(
      existingReport as Record<string, unknown>
    );

    const newResource = resourceResult.resource as Record<string, unknown>;

    const newPublicId =
      typeof newResource.publicId === "string"
        ? newResource.publicId
        : null;

    const now = new Date();

    await collection.updateOne(
      { _id: objectId },
      {
        $set: {
          title: title.trim(),
          description: description.trim(),
          category,
          type,
          resource: newResource,
          source: source.trim(),
          publicationDate,
          updatedAt: now,
          lastEditedBy: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
          },
        },
      }
    );

    let cleanupWarning = false;

    if (oldPublicId && oldPublicId !== newPublicId) {
      try {
        await removeCloudinaryPdf(oldPublicId);
      } catch (error) {
        cleanupWarning = true;
        console.error("Old report PDF cleanup failed:", error);
      }
    }

    const updatedReport = await collection.findOne({
      _id: objectId,
    });

    return NextResponse.json({
      success: true,
      message: cleanupWarning
        ? "Report updated, but the previous PDF could not be removed from Cloudinary."
        : "Agricultural report updated successfully.",
      cleanupWarning,
      report: {
        ...updatedReport,
        id: objectId.toString(),
        _id: undefined,
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

    console.error("Admin report update error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update agricultural report." },
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

    if (!validateOrigin(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    const objectId = await getReportId(context);

    if (!objectId) {
      return NextResponse.json(
        { success: false, message: "Invalid report ID." },
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
    const collection = db.collection("agriculturalReports");

    const report = await collection.findOne({ _id: objectId });

    if (!report) {
      return NextResponse.json(
        { success: false, message: "Report not found." },
        { status: 404 }
      );
    }

    if ((report.status ?? "draft") === status) {
      return NextResponse.json(
        { success: false, message: `Report is already ${status}.` },
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
              : report.publishedAt ?? null,
          lastPublicationAction: historyEntry,
        },
        $push: {
          publicationHistory: historyEntry,
        },
      } as never
    );

    return NextResponse.json({
      success: true,
      message:
        status === "published"
          ? "Agricultural report published successfully."
          : "Agricultural report unpublished successfully.",
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

    console.error("Admin report publication error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to change report publication status.",
      },
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

    if (!validateOrigin(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    const objectId = await getReportId(context);

    if (!objectId) {
      return NextResponse.json(
        { success: false, message: "Invalid report ID." },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection("agriculturalReports");

    const report = await collection.findOne({ _id: objectId });

    if (!report) {
      return NextResponse.json(
        { success: false, message: "Report not found." },
        { status: 404 }
      );
    }

    const publicId = getPdfPublicId(
      report as Record<string, unknown>
    );

    await collection.deleteOne({ _id: objectId });

    let cleanupWarning = false;

    if (publicId) {
      try {
        await removeCloudinaryPdf(publicId);
      } catch (error) {
        cleanupWarning = true;
        console.error("Deleted report PDF cleanup failed:", error);
      }
    }

    return NextResponse.json({
      success: true,
      message: cleanupWarning
        ? "Report deleted, but its PDF could not be removed from Cloudinary."
        : "Agricultural report deleted successfully.",
      cleanupWarning,
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

    console.error("Admin report deletion error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to delete agricultural report." },
      { status: 500 }
    );
  }
}