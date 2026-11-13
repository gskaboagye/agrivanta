
import { connection, NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { hasPermission } from "@/lib/admin-permissions";
import { getDatabase } from "@/lib/mongodb";

const updateSchema = z
  .object({
    status: z
      .enum(["pending", "investigating", "resolved", "dismissed"])
      .optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    adminNote: z.string().trim().min(1).max(3000).optional(),
    adminResponse: z.string().trim().min(1).max(3000).optional(),
    resolution: z.string().trim().max(3000).nullable().optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.status !== undefined ||
      data.priority !== undefined ||
      data.adminNote !== undefined ||
      data.adminResponse !== undefined ||
      data.resolution !== undefined,
    { message: "At least one update is required." }
  );

type RouteContext = {
  params: Promise<{ id: string }>;
};

function hasReportAccessFilter(
  admin: Awaited<ReturnType<typeof requireAdmin>>
) {
  const filter: Record<string, unknown> = {};

  if (admin.role && !hasPermission(admin.role, "view_all_reports")) {
    filter["assignedTo.adminId"] = admin.id;
  }

  return filter;
}

function canUpdateReport(
  admin: Awaited<ReturnType<typeof requireAdmin>>,
  permission: Parameters<typeof hasPermission>[1]
) {
  return admin.role !== null && hasPermission(admin.role, permission);
}

function forbiddenResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "You do not have permission to perform this action.",
    },
    { status: 403 }
  );
}

function unauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "Administrator authentication required.",
    },
    { status: 401 }
  );
}

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  await connection();

  try {
    const admin = await requireAdmin();

    if (!admin.role) {
      return forbiddenResponse();
    }

    const canViewAll = hasPermission(
      admin.role,
      "view_all_reports"
    );

    const canViewAssigned = hasPermission(
      admin.role,
      "view_assigned_reports"
    );

    if (!canViewAll && !canViewAssigned) {
      return forbiddenResponse();
    }

    const { id } = await params;

    if (!id || id.length > 100) {
      return NextResponse.json(
        { success: false, message: "Invalid report reference." },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const report = await db.collection("userReports").findOne(
      {
        reportId: id,
        ...hasReportAccessFilter(admin),
      },
      {
        projection: { _id: 0 },
      }
    );

    // Return 404 for reports that do not exist or are not assigned
    // to the requesting Report Officer.
    if (!report) {
      return NextResponse.json(
        { success: false, message: "Report not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ADMIN_UNAUTHORIZED"
    ) {
      return unauthorizedResponse();
    }

    console.error("Admin report details error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve report details." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  await connection();

  try {
    const admin = await requireAdmin();

    if (!admin.role) {
      return forbiddenResponse();
    }

    const canViewAll = hasPermission(
      admin.role,
      "view_all_reports"
    );

    const canViewAssigned = hasPermission(
      admin.role,
      "view_assigned_reports"
    );

    if (!canViewAll && !canViewAssigned) {
      return forbiddenResponse();
    }

    const { id } = await params;

    if (!id || id.length > 100) {
      return NextResponse.json(
        { success: false, message: "Invalid report reference." },
        { status: 400 }
      );
    }

    const origin = request.headers.get("origin");

    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please check the update details.",
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check permissions for each requested operation.
    if (data.status === "resolved" &&
        !canUpdateReport(admin, "resolve_reports")) {
      return forbiddenResponse();
    }

    if (data.status === "dismissed" &&
        !canUpdateReport(admin, "dismiss_reports")) {
      return forbiddenResponse();
    }

    if (
      (data.status === "pending" ||
        data.status === "investigating" ||
        data.priority !== undefined) &&
      !canUpdateReport(admin, "investigate_reports")
    ) {
      return forbiddenResponse();
    }

    if (
      data.resolution !== undefined &&
      !canUpdateReport(admin, "resolve_reports")
    ) {
      return forbiddenResponse();
    }

    if (
      data.adminNote !== undefined &&
      !canUpdateReport(admin, "add_internal_notes")
    ) {
      return forbiddenResponse();
    }

    if (
      data.adminResponse !== undefined &&
      !canUpdateReport(admin, "communicate_with_reporters")
    ) {
      return forbiddenResponse();
    }

    const db = await getDatabase();
    const collection = db.collection("userReports");

    // Scope the database lookup itself to the administrator's
    // permitted reports. Report Officers cannot access other cases.
    const reportFilter = {
      reportId: id,
      ...hasReportAccessFilter(admin),
    };

    const existingReport = await collection.findOne(reportFilter);

    if (!existingReport) {
      return NextResponse.json(
        { success: false, message: "Report not found." },
        { status: 404 }
      );
    }

    const now = new Date();

    const setFields: Record<string, unknown> = {
      updatedAt: now,
    };

    if (data.status !== undefined) {
      setFields.status = data.status;
      setFields.resolvedAt =
        data.status === "resolved" ? now : null;
    }

    if (data.priority !== undefined) {
      setFields.priority = data.priority;
    }

    if (data.resolution !== undefined) {
      setFields.resolution = data.resolution;
    }

    if (
      data.status === "resolved" &&
      data.resolution === undefined &&
      !existingReport.resolution
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please provide resolution details before resolving this report.",
        },
        { status: 400 }
      );
    }

    const pushes: Record<string, unknown> = {};

    if (data.adminNote) {
      pushes.adminNotes = {
        note: data.adminNote,
        adminId: admin.id,
        adminName: admin.name,
        createdAt: now,
      };
    }

    if (data.adminResponse) {
      pushes.adminResponses = {
        responseId: randomUUID(),
        message: data.adminResponse,
        adminId: admin.id,
        adminName: admin.name,
        createdAt: now,
      };
    }

    const updateOperation: Record<string, unknown> = {
      $set: setFields,
    };

    if (Object.keys(pushes).length > 0) {
      updateOperation.$push = pushes;
    }

    // Keep the ownership condition in the update query as well.
    // This prevents updating a report after it has been reassigned.
    const updateResult = await collection.updateOne(
      reportFilter,
      updateOperation
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Report not found." },
        { status: 404 }
      );
    }

    const updatedReport = await collection.findOne(
      reportFilter,
      { projection: { _id: 0 } }
    );

    if (!updatedReport) {
      return NextResponse.json(
        { success: false, message: "Report not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Report updated successfully.",
      report: updatedReport,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ADMIN_UNAUTHORIZED"
    ) {
      return unauthorizedResponse();
    }

    if (
      error instanceof Error &&
      error.message === "ADMIN_FORBIDDEN"
    ) {
      return forbiddenResponse();
    }

    console.error("Admin report update error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update this report." },
      { status: 500 }
    );
  }
}
