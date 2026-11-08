import { connection, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";

export async function GET() {
  await connection();
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Administrator authentication required." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      administrator: admin,
    });
  } catch (error) {
    console.error("Administrator session check failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to verify administrator session." },
      { status: 500 }
    );
  }
}