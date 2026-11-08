import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

const SETUP_LOCK_ID = "initial-administrator-setup";

type SetupLock = {
  _id: string;
  createdAt: Date;
};

export async function GET() {
  try {
    const db = await getDatabase();

    const administrators = db.collection("administrators");

    const setupLocks = db.collection<SetupLock>("adminSetupLocks");

    const [adminCount, setupLock] = await Promise.all([
      administrators.countDocuments(),
      setupLocks.findOne({ _id: SETUP_LOCK_ID }),
    ]);

    const available = adminCount === 0 && !setupLock;

    return NextResponse.json(
      { available },
      { status: 200 }
    );
  } catch (error) {
    console.error("Administrator setup status check failed:", error);

    return NextResponse.json(
      {
        available: false,
        message: "Unable to verify administrator setup availability.",
      },
      { status: 500 }
    );
  }
}