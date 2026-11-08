
import { NextResponse } from "next/server";
import { destroyAdminSession } from "@/lib/admin-auth";

export async function POST() {
  try {
    await destroyAdminSession();

    return NextResponse.json({
      success: true,
      message: "Administrator logged out successfully.",
    });
  } catch (error) {
    console.error("Administrator logout failed:", error);

    return NextResponse.json(
      { message: "Unable to complete administrator logout." },
      { status: 500 }
    );
  }
}
