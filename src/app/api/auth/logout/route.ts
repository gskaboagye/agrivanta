import { NextResponse } from "next/server";
import { revokeCurrentSession } from "@/lib/auth";

export async function POST() {
  try {
    await revokeCurrentSession();

    return NextResponse.json({
      success: true,
      message: "You have been logged out.",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to complete logout. Please try again.",
      },
      { status: 500 }
    );
  }
}
