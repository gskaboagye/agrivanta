
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/mongodb";

type UserDocument = {
  _id: ObjectId;
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

type RouteContext = {
  params: Promise<{ id: string }>;
};

function unauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "Administrator authentication required.",
    },
    { status: 401 }
  );
}

function isAdminUnauthorized(error: unknown) {
  return (
    error instanceof Error &&
    error.message === "ADMIN_UNAUTHORIZED"
  );
}

function serializeUser(user: UserDocument) {
  return {
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
  };
}

// Retrieve an individual user profile.
export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    await requireAdmin();

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID." },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const user = await db
      .collection<UserDocument>("users")
      .findOne(
        { _id: new ObjectId(id) },
        { projection: { passwordHash: 0 } }
      );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: serializeUser(user),
    });
  } catch (error) {
    if (isAdminUnauthorized(error)) {
      return unauthorizedResponse();
    }

    console.error("Admin user profile retrieval failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve user profile.",
      },
      { status: 500 }
    );
  }
}

// Activate or disable an individual user account.
export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    await requireAdmin();

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID." },
        { status: 400 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request data." },
        { status: 400 }
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid request data." },
        { status: 400 }
      );
    }

    const status = (body as Record<string, unknown>).status;

    if (status !== "active" && status !== "disabled") {
      return NextResponse.json(
        {
          success: false,
          message: "Status must be active or disabled.",
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const result = await db
      .collection<UserDocument>("users")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {
            status,
            updatedAt: new Date(),
          },
        },
        {
          returnDocument: "after",
          projection: { passwordHash: 0 },
        }
      );

    if (!result) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        status === "disabled"
          ? "User account disabled successfully."
          : "User account activated successfully.",
      user: serializeUser(result),
    });
  } catch (error) {
    if (isAdminUnauthorized(error)) {
      return unauthorizedResponse();
    }

    console.error("Admin user status update failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update user account status.",
      },
      { status: 500 }
    );
  }
}
