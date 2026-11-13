
import {
  connection,
  NextRequest,
  NextResponse,
} from "next/server";
import {
  ClientSession,
  ObjectId,
} from "mongodb";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import { hasPermission } from "@/lib/admin-permissions";
import {
  getDatabase,
  getMongoClient,
} from "@/lib/mongodb";

const assignmentSchema = z
  .object({
    adminId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/, "Invalid administrator ID.")
      .nullable(),
  })
  .strict();

type RouteContext = {
  params: Promise<{ id: string }>;
};

type AdministratorDocument = {
  _id: ObjectId;
  name: string;
  email: string;
  status: "active" | "disabled";
  role?: unknown;
};

type AssignmentOfficer = {
  adminId: string;
  name: string;
  email: string;
  assignedAt: Date;
  assignedBy: {
    adminId: string;
    name: string;
  };
};

type AssignmentResult = {
  action: "assigned" | "reassigned" | "unassigned";
  assignedTo: AssignmentOfficer | null;
};

class AssignmentError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AssignmentError";
    this.status = status;
  }
}

export async function GET() {
  await connection();

  try {
    const admin = await requireAdmin();

    if (
      !admin.role ||
      !hasPermission(admin.role, "assign_reports")
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to view report officers.",
        },
        { status: 403 }
      );
    }

    const db = await getDatabase();

    const officers = await db
      .collection<AdministratorDocument>("administrators")
      .find(
        {
          status: "active",
          role: "report_officer",
        },
        {
          projection: {
            _id: 1,
            name: 1,
          },
        }
      )
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      officers: officers.map((officer) => ({
        adminId: officer._id.toString(),
        name: officer.name,
      })),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ADMIN_UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Administrator authentication required.",
        },
        { status: 401 }
      );
    }

    console.error("Report officers lookup failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve report officers.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  await connection();

  let session: ClientSession | undefined;

  try {
    const admin = await requireAdmin();

    if (
      !admin.role ||
      !hasPermission(admin.role, "assign_reports")
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to manage report assignments.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id || id.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid report reference.",
        },
        { status: 400 }
      );
    }

    const origin = request.headers.get("origin");

    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request origin.",
        },
        { status: 403 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request body.",
        },
        { status: 400 }
      );
    }

    const validation = assignmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please provide a valid administrator ID or null.",
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { adminId } = validation.data;

    const db = await getDatabase();
    const client = await getMongoClient();

    const activeSession = client.startSession();
    session = activeSession;

    const reports = db.collection("userReports");

    const administrators =
      db.collection<AdministratorDocument>("administrators");

    const assignments = db.collection("reportAssignments");

    const result = await activeSession.withTransaction<AssignmentResult>(
      async () => {
        const report = await reports.findOne(
          { reportId: id },
          { session: activeSession }
        );

        if (!report) {
          throw new AssignmentError("Report not found.", 404);
        }

        const previousAssignee = report.assignedTo ?? null;

        let newAssignee: AssignmentOfficer | null = null;

        if (adminId !== null) {
          const officer = await administrators.findOne(
            {
              _id: new ObjectId(adminId),
              status: "active",
              role: "report_officer",
            },
            { session: activeSession }
          );

          if (!officer) {
            throw new AssignmentError(
              "The selected administrator is not an active Report Officer.",
              400
            );
          }

          newAssignee = {
            adminId: officer._id.toString(),
            name: officer.name,
            email: officer.email,
            assignedAt: new Date(),
            assignedBy: {
              adminId: admin.id,
              name: admin.name,
            },
          };
        }

        const previousAdminId =
          previousAssignee &&
          typeof previousAssignee.adminId === "string"
            ? previousAssignee.adminId
            : null;

        if (previousAdminId === adminId) {
          throw new AssignmentError(
            "This report is already assigned to the selected officer.",
            409
          );
        }

        const now = new Date();

        const action: AssignmentResult["action"] =
          adminId === null
            ? "unassigned"
            : previousAdminId === null
              ? "assigned"
              : "reassigned";

        const updateResult = await reports.updateOne(
          { reportId: id },
          {
            $set: {
              assignedTo: newAssignee,
              updatedAt: now,
            },
          },
          { session: activeSession }
        );

        if (updateResult.matchedCount !== 1) {
          throw new AssignmentError(
            "Unable to update the report assignment.",
            409
          );
        }

        await assignments.insertOne(
          {
            reportId: id,
            action,
            previousAssignee,
            newAssignee,
            performedBy: {
              adminId: admin.id,
              name: admin.name,
            },
            createdAt: now,
          },
          { session: activeSession }
        );

        return {
          action,
          assignedTo: newAssignee,
        };
      }
    );

    if (!result) {
      throw new Error(
        "Assignment transaction returned no result."
      );
    }

    return NextResponse.json({
      success: true,
      message:
        result.action === "assigned"
          ? "Report assigned successfully."
          : result.action === "reassigned"
            ? "Report reassigned successfully."
            : "Report unassigned successfully.",
      assignment: result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ADMIN_UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Administrator authentication required.",
        },
        { status: 401 }
      );
    }

    if (error instanceof AssignmentError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: error.status }
      );
    }

    console.error("Report assignment error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to complete report assignment.",
      },
      { status: 500 }
    );
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
