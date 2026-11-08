import { connection, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/mongodb";

const ROLES = [
  "farmer",
  "buyer",
  "supplier",
  "worker",
  "expert",
] as const;

function getGhanaDateStart(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Accra",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return new Date(
    `${values.year}-${values.month}-${values.day}T00:00:00.000Z`
  );
}

export async function GET() {
  await connection();
  try {
    await requireAdmin();

    const db = await getDatabase();
    const users = db.collection("users");

    const now = new Date();
    const todayStart = getGhanaDateStart(now);

    const dayOfWeek = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Accra",
      weekday: "short",
    }).format(now);

    const weekdayNumbers: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };

    const daysSinceSunday = weekdayNumbers[dayOfWeek] ?? 0;

    const weekStart = new Date(todayStart);
    weekStart.setUTCDate(weekStart.getUTCDate() - daysSinceSunday);

    const monthStart = new Date(
      Date.UTC(
        todayStart.getUTCFullYear(),
        todayStart.getUTCMonth(),
        1
      )
    );

    const [
      totalUsers,
      activeUsers,
      disabledUsers,
      registrationsToday,
      registrationsThisWeek,
      registrationsThisMonth,
      roleResults,
      trendResults,
    ] = await Promise.all([
      users.countDocuments(),

      users.countDocuments({
        status: { $ne: "disabled" },
      }),

      users.countDocuments({
        status: "disabled",
      }),

      users.countDocuments({
        createdAt: { $gte: todayStart, $lte: now },
      }),

      users.countDocuments({
        createdAt: { $gte: weekStart, $lte: now },
      }),

      users.countDocuments({
        createdAt: { $gte: monthStart, $lte: now },
      }),

      users.aggregate<{
        _id: string;
        count: number;
      }>([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ]).toArray(),

      users.aggregate<{
        _id: string;
        count: number;
      }>([
        {
          $match: {
            createdAt: {
              $gte: new Date(
                todayStart.getTime() - 6 * 24 * 60 * 60 * 1000
              ),
              $lte: now,
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Africa/Accra",
              },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]).toArray(),
    ]);

    const roleCounts = Object.fromEntries(
      ROLES.map((role) => [
        role,
        roleResults.find((item) => item._id === role)?.count ?? 0,
      ])
    );

    const registrationTrend = Array.from(
      { length: 7 },
      (_, index) => {
        const date = new Date(todayStart);
        date.setUTCDate(date.getUTCDate() - (6 - index));

        const dateKey = date.toISOString().slice(0, 10);

        return {
          date: dateKey,
          registrations:
            trendResults.find((item) => item._id === dateKey)?.count ?? 0,
        };
      }
    );

    return NextResponse.json({
      success: true,
      analytics: {
        totalUsers,
        activeUsers,
        disabledUsers,
        registrationsToday,
        registrationsThisWeek,
        registrationsThisMonth,
        roleCounts,
        registrationTrend,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ADMIN_UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Administrator authentication required.",
        },
        { status: 401 }
      );
    }

    console.error("Admin analytics retrieval failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve platform analytics.",
      },
      { status: 500 }
    );
  }
}