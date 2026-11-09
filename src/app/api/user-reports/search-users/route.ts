import { connection, NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  await connection();

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Please sign in to search for users." },
        { status: 401 }
      );
    }

    const query = (request.nextUrl.searchParams.get("q") ?? "").trim();

    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        users: [],
      });
    }

    if (query.length > 80) {
      return NextResponse.json(
        { success: false, message: "Search query is too long." },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const users = await db.collection("users")
      .find(
        {
          _id: { $ne: new (await import("mongodb")).ObjectId(currentUser.id) },
          name: {
            $regex: query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
        },
        {
          projection: {
            _id: 1,
            name: 1,
            role: 1,
            profileImage: 1,
            avatar: 1,
            username: 1,
          },
        }
      )
      .sort({ name: 1 })
      .limit(10)
      .toArray();

    return NextResponse.json({
      success: true,
      users: users.map((user) => ({
        id: user._id.toString(),
        name: String(user.name ?? "AgriVanta user"),
        role: String(user.role ?? "member"),
        profileImage:
          typeof user.profileImage === "string"
            ? user.profileImage
            : typeof user.avatar === "string"
              ? user.avatar
              : null,
        username:
          typeof user.username === "string" ? user.username : null,
      })),
    });
  } catch (error) {
    console.error("User report search error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to search for users." },
      { status: 500 }
    );
  }
}