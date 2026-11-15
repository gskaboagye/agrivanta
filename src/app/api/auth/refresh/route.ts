import { NextResponse } from "next/server";
import { refreshSession } from "@/lib/auth";


export async function POST() {
  try {
    const refreshed = await refreshSession();

    if (!refreshed) {
      return NextResponse.json(
        {
          success: false,
          message: "Your session has expired. Please log in again.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Session refreshed successfully.",
    });
  } catch (error) {
    console.error("Session refresh failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to refresh your session.",
      },
      { status: 500 }
    );
  }
}

