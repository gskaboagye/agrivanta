import { connection, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/mongodb";

const updateSchema = z
  .object({
    status: z.enum(["pending", "investigating", "resolved", "dismissed"]).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    adminNote: z.string().trim().min(1).max(3000).optional(),
    resolution: z.string().trim().max(3000).nullable().optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.status !== undefined ||
      data.priority !== undefined ||
      data.adminNote !== undefined ||
      data.resolution !== undefined,
    { message: "At least one update is required." }
  );

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  await connection();

  try {
    await requireAdmin();

    const { id } = await params;

    if (!id || id.length > 100) {
      return NextResponse.json(
        { success: false, message: "Invalid report reference." },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const report = await db.collection("userReports").findOne(
      { reportId: id },
      { projection: { _id: 0 } }
    );

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
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "Administrator authentication required." },
        { status: 401 }
      );
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
    const db = await getDatabase();
    const collection = db.collection<any>("userReports");

    const existingReport = await collection.findOne({ reportId: id });

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

    if (data.status === "resolved" && data.resolution === undefined) {
      if (!existingReport.resolution) {
        return NextResponse.json(
          {
            success: false,
            message: "Please provide resolution details before resolving this report.",
          },
          { status: 400 }
        );
      }
    }

    if (data.adminNote) {
      await collection.updateOne(
        { reportId: id },
        {
          $set: setFields,
          $push: {
            adminNotes: {
              note: data.adminNote,
              adminId: admin.id,
              adminName: admin.name,
              createdAt: now,
            },
          },
        } as any
      );
    } else {
      await collection.updateOne(
        { reportId: id },
        { $set: setFields }
      );
    }

    const updatedReport = await collection.findOne(
      { reportId: id },
      { projection: { _id: 0 } }
    );

    return NextResponse.json({
      success: true,
      message: "Report updated successfully.",
      report: updatedReport,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "Administrator authentication required." },
        { status: 401 }
      );
    }

    console.error("Admin report update error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update this report." },
      { status: 500 }
    );
  }
}