import { connection, NextResponse } from "next/server";
import { ACCOUNT_ROLES, type AccountRole } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/mongodb";

const PAGE_SIZE = 20;

type UserDocument = {
  _id: import("mongodb").ObjectId;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  phonePublic?: boolean;
  whatsappEnabled?: boolean;
  status?: "active" | "disabled";
  createdAt?: Date;
  updatedAt?: Date;
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request) {
  await connection();
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);

    const search = (searchParams.get("search") ?? "").trim();
    const role = searchParams.get("role") ?? "";
    const requestedPage = Number(searchParams.get("page") ?? "1");

    if (
      !Number.isInteger(requestedPage) ||
      requestedPage < 1
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid page number." },
        { status: 400 }
      );
    }

    if (
      role &&
      role !== "all" &&
      !ACCOUNT_ROLES.includes(role as AccountRole)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid account role." },
        { status: 400 }
      );
    }

    if (search.length > 100) {
      return NextResponse.json(
        { success: false, message: "Search term is too long." },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const users = db.collection<UserDocument>("users");

    const filter: Record<string, unknown> = {};

    if (role && role !== "all") {
      filter.role = role;
    }

    if (search) {
      const safeSearch = escapeRegex(search);

      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const totalUsers = await users.countDocuments(filter);

    const totalPages = Math.max(
      1,
      Math.ceil(totalUsers / PAGE_SIZE)
    );

    const page = Math.min(requestedPage, totalPages);

    const records = await users
      .find(filter, {
        projection: {
          passwordHash: 0,
        },
      })
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .toArray();

    const result = records.map((user) => ({
      id: user._id.toString(),
      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      role: user.role ?? "",
      phonePublic: user.phonePublic ?? false,
      whatsappEnabled: user.whatsappEnabled ?? false,
      status: user.status ?? "active",
      createdAt: user.createdAt ?? null,
      updatedAt: user.updatedAt ?? null,
    }));

    return NextResponse.json({
      success: true,
      users: result,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        totalUsers,
        totalPages,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ADMIN_UNAUTHORIZED"
    ) {
      return NextResponse.json(
        { success: false, message: "Administrator authentication required." },
        { status: 401 }
      );
    }

    console.error("Admin users retrieval failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve users." },
      { status: 500 }
    );
  }
}