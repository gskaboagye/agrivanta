
import { connection, NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { hasPermission } from "@/lib/admin-permissions";
import { getDatabase } from "@/lib/mongodb";

const VALID_STATUSES = [
  "pending",
  "investigating",
  "resolved",
  "dismissed",
];

const VALID_CATEGORIES = [
  "Fraud or Scam",
  "Suspicious Listing",
  "User Misconduct",
  "Misleading Information",
  "Platform Issue",
  "Other",
];

export async function GET(request: NextRequest) {
  await connection();

  try {
    const admin = await requireAdmin();

    if (!admin.role) {
      return NextResponse.json(
        {
          success: false,
          message: "Administrator role has not been configured.",
        },
        { status: 403 }
      );
    }

    // Super Admins and Report Managers can view all reports.
    // Report Officers can only view reports assigned to them.
    const canViewAllReports = hasPermission(
      admin.role,
      "view_all_reports"
    );

    const canViewAssignedReports = hasPermission(
      admin.role,
      "view_assigned_reports"
    );

    if (!canViewAllReports && !canViewAssignedReports) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to view user reports.",
        },
        { status: 403 }
      );
    }

    // This scope is applied to every report query and status count.
    const scopeFilter: Record<string, unknown> = {};

    if (!canViewAllReports) {
      scopeFilter["assignedTo.adminId"] = admin.id;
    }

    const searchParams = request.nextUrl.searchParams;

    const pageValue = Number(searchParams.get("page") ?? "1");

    const page = Number.isFinite(pageValue)
      ? Math.max(1, Math.floor(pageValue))
      : 1;

    const pageSize = 15;

    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.trim() ?? "";

    // Start with the administrator's permitted report scope.
    const filter: Record<string, unknown> = {
      ...scopeFilter,
    };

    if (status && status !== "all") {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid report status.",
          },
          { status: 400 }
        );
      }

      filter.status = status;
    }

    if (category && category !== "all") {
      if (!VALID_CATEGORIES.includes(category)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid report category.",
          },
          { status: 400 }
        );
      }

      filter.category = category;
    }

    if (search) {
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const searchRegex = new RegExp(escapedSearch, "i");

      filter.$or = [
        { referenceNumber: searchRegex },
        { subject: searchRegex },
        { "reporter.name": searchRegex },
        { "reporter.email": searchRegex },
      ];
    }

    const db = await getDatabase();
    const collection = db.collection("userReports");

    const [reports, total, statusCounts] = await Promise.all([
      collection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray(),

      collection.countDocuments(filter),

      collection
        .aggregate<{ _id: string; count: number }>([
          {
            $match: scopeFilter,
          },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ])
        .toArray(),
    ]);

    const counts = {
      total: statusCounts.reduce(
        (sum, item) => sum + item.count,
        0
      ),
      pending: 0,
      investigating: 0,
      resolved: 0,
      dismissed: 0,
    };

    for (const item of statusCounts) {
      if (item._id in counts && item._id !== "total") {
        counts[item._id as keyof typeof counts] = item.count;
      }
    }

    return NextResponse.json({
      success: true,
      reports,
      counts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
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
          message: "Administrator authentication required.",
        },
        { status: 401 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "ADMIN_FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to access this resource.",
        },
        { status: 403 }
      );
    }

    console.error("Admin user reports retrieval error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve user reports.",
      },
      { status: 500 }
    );
  }
}
