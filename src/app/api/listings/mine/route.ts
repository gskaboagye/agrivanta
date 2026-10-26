import { NextResponse } from "next/server";
import { connection } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  await connection();

  try {
    const user = await getCurrentUser();

    // Keep the rest of your existing GET logic here.

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Please log in to view your listings." },
        { status: 401 }
      );
    }

    const ownerConditions: Record<string, string>[] = [];

    if (user.id) {
      ownerConditions.push(
        { userId: user.id },
        { sellerId: user.id },
        { ownerId: user.id },
        { createdBy: user.id }
      );
    }

    if (user.email) {
      ownerConditions.push(
        { userEmail: user.email },
        { sellerEmail: user.email },
        { ownerEmail: user.email }
      );
    }

    if (ownerConditions.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        listings: [],
      });
    }

    const db = await getDatabase();

    const documents = await db
      .collection("listings")
      .find({ $or: ownerConditions })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    const listings = documents.map((document) => {
      const { _id, ...listing } = document;

      return {
        ...listing,
        id: _id.toString(),
      };
    });

    return NextResponse.json({
      success: true,
      count: listings.length,
      listings,
    });
  } catch (error) {
    console.error("Failed to load user's listings:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load your listings." },
      { status: 500 }
    );
  }
}
