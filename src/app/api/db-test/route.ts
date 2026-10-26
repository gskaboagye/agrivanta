
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDatabase();
    await db.command({ ping: 1 });

    return NextResponse.json({
      success: true,
      message: "AgriVanta connected to MongoDB successfully.",
      database: db.databaseName,
    });
  } catch (error) {
    console.error("MongoDB connection test failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Could not connect to the database.",
      },
      { status: 500 }
    );
  }
}
