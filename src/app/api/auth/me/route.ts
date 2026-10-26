
import { NextResponse } from "next/server";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  await connection();

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { user: null, message: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Current-user lookup failed:", error);

    return NextResponse.json(
      { message: "Unable to retrieve the current user." },
      { status: 500 }
    );
  }
}
