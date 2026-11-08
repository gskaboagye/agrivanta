"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Download,
  RefreshCw,
  ShoppingBag,
  Users,
  UserCheck,
  UserX,
  UserPlus,
  AlertCircle,
  CalendarDays,
} from "lucide-react";

type Analytics = {
  totalUsers: number;
  activeUsers: number;
  disabledUsers: number;
  registrationsToday: number;
  registrationsThisWeek: number;
  registrationsThisMonth: number;
  roleCounts: Record<string, number>;
  registrationTrend: {
    date: string;
    registrations: number;
  }[];
};

type MarketplaceOverview = {
  totalListings: number;
  activeListings: number;
  disabledListings: number;
};

type ReportData = {
  analytics: Analytics;
  marketplace: MarketplaceOverview;
};

const roles = [
  { key: "farmer", label: "Farmers" },
  { key: "buyer", label: "Buyers" },
  { key: "supplier", label: "Suppliers" },
  { key: "worker", label: "Workers" },
  { key: "expert", label: "Experts" },
];

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function escapeCsv(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [analyticsResponse, listingsResponse] = await Promise.all([
        fetch("/api/admin/analytics", {
          credentials: "same-origin",
          cache: "no-store",
        }),
        fetch("/api/admin/listings", {
          credentials: "same-origin",
          cache: "no-store",
        }),
      ]);

      if (
        analyticsResponse.status === 401 ||
        listingsResponse.status === 401
      ) {
        window.location.assign("/admin/login");
        return;
      }

      const [analyticsResult, listingsResult] = await Promise.all([
        analyticsResponse.json(),
        listingsResponse.json(),
      ]);

      if (!analyticsResponse.ok || !analyticsResult.success) {
        throw new Error(
          analyticsResult.message || "Unable to load user analytics."
        );
      }

      if (!listingsResponse.ok || !listingsResult.success) {
        throw new Error(
          listingsResult.message || "Unable to load marketplace statistics."
        );
      }

      setData({
        analytics: analyticsResult.analytics,
        marketplace: listingsResult.overview,
      });

      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to retrieve platform reports."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  function exportReport() {
    if (!data) return;

    const { analytics, marketplace } = data;

    const rows: (string | number)[][] = [
      ["AGRIVANTA PLATFORM REPORT"],
      ["Report generated", new Date().toLocaleString("en-GB")],
      [],
      ["USER STATISTICS"],
      ["Metric", "Value"],
      ["Total users", analytics.totalUsers],
      ["Active users", analytics.activeUsers],
      ["Disabled users", analytics.disabledUsers],
      ["Registrations today", analytics.registrationsToday],
      ["Registrations this week", analytics.registrationsThisWeek],
      ["Registrations this month", analytics.registrationsThisMonth],
      [],
      ["USER ACCOUNT TYPES"],
      ["Account type", "Users"],
      ...roles.map((role) => [
        role.label,
        analytics.roleCounts[role.key] ?? 0,
      ]),
      [],
      ["MARKETPLACE STATISTICS"],
      ["Metric", "Value"],
      ["Total listings", marketplace.totalListings],
      ["Active listings", marketplace.activeListings],
      ["Disabled listings", marketplace.disabledListings],
      [],
      ["REGISTRATION TREND - LAST 7 DAYS"],
      ["Date", "Registrations"],
      ...analytics.registrationTrend.map((item) => [
        item.date,
        item.registrations,
      ]),
    ];

    const csv = rows
      .map((row) => row.map((value) => escapeCsv(value)).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `agrivanta-platform-report-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const userCards = data
    ? [
        {
          label: "Total users",
          value: data.analytics.totalUsers,
          description: "All registered platform users",
          icon: Users,
        },
        {
          label: "Active users",
          value: data.analytics.activeUsers,
          description: "Accounts currently enabled",
          icon: UserCheck,
        },
        {
          label: "Disabled users",
          value: data.analytics.disabledUsers,
          description: "Accounts currently restricted",
          icon: UserX,
        },
        {
          label: "Registered today",
          value: data.analytics.registrationsToday,
          description: "New registrations today",
          icon: UserPlus,
        },
      ]
    : [];

  const listingCards = data
    ? [
        {
          label: "Total listings",
          value: data.marketplace.totalListings,
          icon: ShoppingBag,
        },
        {
          label: "Active listings",
          value: data.marketplace.activeListings,
          icon: Activity,
        },
        {
          label: "Disabled listings",
          value: data.marketplace.disabledListings,
          icon: UserX,
        },
      ]
    : [];

  const maxRegistrations = data
    ? Math.max(
        1,
        ...data.analytics.registrationTrend.map(
          (item) => item.registrations
        )
      )
    : 1;

  return (
    <main className="min-h-screen bg-[#F7F8F4] text-[#26372b]">
      <header className="border-b border-[#e5e9e1] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#17472D] text-white">
              <BarChart3 size={21} />
            </span>

            <span>
              <span className="block text-lg font-extrabold tracking-tight text-[#17472D]">
                AgriVanta
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-[#899487]">
                Reports & Analytics
              </span>
            </span>
          </Link>

          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-xl border border-[#e5e9e1] px-4 py-2.5 text-sm font-semibold text-[#42634a] transition hover:bg-[#f2f5ef]"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Admin dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#74816f]">
              <BarChart3 size={15} />
              Platform performance
            </p>

            <h1 className="text-2xl font-extrabold tracking-tight text-[#17472D] sm:text-3xl">
              Reports & Analytics
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-[#7c8879]">
              Monitor user registrations, account activity, and marketplace
              performance across AgriVanta.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadReports}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e5e9e1] bg-white px-4 py-2.5 text-sm font-semibold text-[#42634a] transition hover:bg-[#f2f5ef] disabled:opacity-60"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={exportReport}
              disabled={!data || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17472D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#103820] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={15} />
              Export CSV
            </button>
          </div>
        </div>

        {lastUpdated && !loading && (
          <p className="mb-6 flex items-center gap-2 text-xs text-[#899487]">
            <CalendarDays size={14} />
            Last updated: {lastUpdated.toLocaleString("en-GB")}
          </p>
        )}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Unable to load reports</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {loading && !data ? (
          <div className="rounded-2xl border border-[#e5e9e1] bg-white px-6 py-16 text-center">
            <RefreshCw
              size={26}
              className="mx-auto animate-spin text-[#17472D]"
            />
            <p className="mt-3 text-sm text-[#899487]">
              Loading platform reports...
            </p>
          </div>
        ) : data ? (
          <div className="space-y-9">
            <section>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-[#26372b]">
                  User statistics
                </h2>
                <p className="mt-1 text-sm text-[#899487]">
                  Registration and account status across the platform.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {userCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <div
                      key={card.label}
                      className="rounded-2xl border border-[#e5e9e1] bg-white p-5"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#899487]">
                          {card.label}
                        </p>
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#17472D]/10 text-[#17472D]">
                          <Icon size={18} />
                        </span>
                      </div>

                      <p className="mt-4 text-3xl font-extrabold text-[#17472D]">
                        {card.value.toLocaleString()}
                      </p>

                      <p className="mt-1 text-xs text-[#899487]">
                        {card.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-[#26372b]">
                  Marketplace statistics
                </h2>
                <p className="mt-1 text-sm text-[#899487]">
                  Overview of listings published on the AgriVanta marketplace.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {listingCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <div
                      key={card.label}
                      className="rounded-2xl border border-[#e5e9e1] bg-white p-5"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#899487]">
                          {card.label}
                        </p>
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#17472D]/10 text-[#17472D]">
                          <Icon size={18} />
                        </span>
                      </div>

                      <p className="mt-4 text-3xl font-extrabold text-[#17472D]">
                        {card.value.toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-3">
              <div className="rounded-2xl border border-[#e5e9e1] bg-white p-6 lg:col-span-2">
                <h2 className="font-bold text-[#354737]">
                  Registration overview
                </h2>
                <p className="mt-1 text-xs text-[#899487]">
                  New accounts registered during each period.
                </p>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[
                    {
                      label: "Today",
                      value: data.analytics.registrationsToday,
                    },
                    {
                      label: "This week",
                      value: data.analytics.registrationsThisWeek,
                    },
                    {
                      label: "This month",
                      value: data.analytics.registrationsThisMonth,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl bg-[#F7F8F4] p-4"
                    >
                      <p className="text-xs text-[#899487]">{item.label}</p>
                      <p className="mt-2 text-2xl font-bold text-[#17472D]">
                        {item.value.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <h3 className="text-sm font-bold text-[#354737]">
                    Last 7 days
                  </h3>

                  <div className="mt-5 flex h-48 items-end gap-3 border-b border-[#e5e9e1] pb-2">
                    {data.analytics.registrationTrend.map((item) => {
                      const height =
                        item.registrations > 0
                          ? Math.max(
                              8,
                              (item.registrations / maxRegistrations) * 100
                            )
                          : 0;

                      return (
                        <div
                          key={item.date}
                          className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                        >
                          <span className="text-xs font-semibold text-[#42634a]">
                            {item.registrations}
                          </span>

                          <div
                            className="w-full max-w-10 rounded-t-md bg-[#17472D] transition-all"
                            style={{ height: `${height}%` }}
                            title={`${item.registrations} registrations`}
                          />

                          <span className="text-[10px] text-[#899487]">
                            {formatDate(item.date)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#e5e9e1] bg-white p-6">
                <h2 className="font-bold text-[#354737]">
                  Users by account type
                </h2>
                <p className="mt-1 text-xs text-[#899487]">
                  Distribution of registered users.
                </p>

                <div className="mt-6 space-y-5">
                  {roles.map((role) => {
                    const count =
                      data.analytics.roleCounts[role.key] ?? 0;

                    const percentage =
                      data.analytics.totalUsers > 0
                        ? (count / data.analytics.totalUsers) * 100
                        : 0;

                    return (
                      <div key={role.key}>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-[#52624f]">
                            {role.label}
                          </span>
                          <span className="text-sm font-bold text-[#17472D]">
                            {count.toLocaleString()}
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-[#edf0e9]">
                          <div
                            className="h-full rounded-full bg-[#17472D] transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-7 border-t border-[#e5e9e1] pt-5">
                  <p className="text-xs text-[#899487]">
                    Total registered accounts
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-[#17472D]">
                    {data.analytics.totalUsers.toLocaleString()}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#e5e9e1] bg-white p-6">
              <h2 className="font-bold text-[#354737]">
                Report information
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#899487]">
                These reports are generated from AgriVanta's registered user
                and marketplace listing records. Registration trends cover
                the seven-day period returned by the analytics service.
                Export the report as a CSV file to open it in Excel or another
                spreadsheet application.
              </p>
            </section>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#e5e9e1] bg-white p-8 text-center">
            <p className="font-semibold text-[#354737]">
              No report data available.
            </p>
            <p className="mt-2 text-sm text-[#899487]">
              Refresh the page to try again.
            </p>
          </div>
        )}

        <footer className="mt-12 border-t border-[#e5e9e1] pt-5 text-center text-xs text-[#9aa394]">
          AgriVanta Administrator Portal
        </footer>
      </div>
    </main>
  );
}