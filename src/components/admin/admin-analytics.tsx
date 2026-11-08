"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  RefreshCw,
  AlertCircle,
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

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalytics() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/analytics", {
        credentials: "same-origin",
        cache: "no-store",
      });

      if (response.status === 401) {
        window.location.assign("/admin/login");
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load registration analytics."
        );
      }

      setAnalytics(data.analytics);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to retrieve analytics."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAnalytics();
  }, []);

  const statCards = analytics
    ? [
        {
          label: "Total registrations",
          value: analytics.totalUsers,
          description: "All registered platform users",
          icon: Users,
        },
        {
          label: "Active accounts",
          value: analytics.activeUsers,
          description: "Accounts currently enabled",
          icon: UserCheck,
        },
        {
          label: "Disabled accounts",
          value: analytics.disabledUsers,
          description: "Accounts currently restricted",
          icon: UserX,
        },
        {
          label: "Registered today",
          value: analytics.registrationsToday,
          description: "New registrations today",
          icon: UserPlus,
        },
      ]
    : [];

  return (
    <section className="mb-10">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-[#26372b]">
            Registration analytics
          </h2>
          <p className="mt-1 text-sm text-[#899487]">
            Monitor registrations and account activity across AgriVanta.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAnalytics}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#e5e9e1] bg-white px-4 py-2.5 text-sm font-semibold text-[#42634a] transition hover:bg-[#f2f5ef] disabled:opacity-60"
        >
          <RefreshCw
            size={15}
            className={loading ? "animate-spin" : ""}
          />
          Refresh analytics
        </button>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Analytics unavailable</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {loading && !analytics ? (
        <div className="rounded-2xl border border-[#e5e9e1] bg-white px-6 py-12 text-center">
          <RefreshCw
            size={24}
            className="mx-auto animate-spin text-[#17472D]"
          />
          <p className="mt-3 text-sm text-[#899487]">
            Loading registration analytics...
          </p>
        </div>
      ) : analytics ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => {
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

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#e5e9e1] bg-white p-6 lg:col-span-2">
              <h3 className="font-bold text-[#354737]">
                Registration overview
              </h3>
              <p className="mt-1 text-xs text-[#899487]">
                New accounts registered during each period.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-[#F7F8F4] p-4">
                  <p className="text-xs text-[#899487]">Today</p>
                  <p className="mt-2 text-2xl font-bold text-[#17472D]">
                    {analytics.registrationsToday}
                  </p>
                </div>

                <div className="rounded-xl bg-[#F7F8F4] p-4">
                  <p className="text-xs text-[#899487]">This week</p>
                  <p className="mt-2 text-2xl font-bold text-[#17472D]">
                    {analytics.registrationsThisWeek}
                  </p>
                </div>

                <div className="rounded-xl bg-[#F7F8F4] p-4">
                  <p className="text-xs text-[#899487]">This month</p>
                  <p className="mt-2 text-2xl font-bold text-[#17472D]">
                    {analytics.registrationsThisMonth}
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <h4 className="text-sm font-bold text-[#354737]">
                  Last 7 days
                </h4>

                <div className="mt-5 flex h-44 items-end gap-3 border-b border-[#e5e9e1] pb-2">
                  {analytics.registrationTrend.map((item) => {
                    const max = Math.max(
                      1,
                      ...analytics.registrationTrend.map(
                        (entry) => entry.registrations
                      )
                    );

                    const height =
                      item.registrations > 0
                        ? Math.max(8, (item.registrations / max) * 100)
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
              <h3 className="font-bold text-[#354737]">
                Users by account type
              </h3>
              <p className="mt-1 text-xs text-[#899487]">
                Distribution of registered users.
              </p>

              <div className="mt-6 space-y-5">
                {roles.map((role) => {
                  const count = analytics.roleCounts[role.key] ?? 0;

                  const percentage =
                    analytics.totalUsers > 0
                      ? (count / analytics.totalUsers) * 100
                      : 0;

                  return (
                    <div key={role.key}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-[#52624f]">
                          {role.label}
                        </span>
                        <span className="text-sm font-bold text-[#17472D]">
                          {count}
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
                  {analytics.totalUsers}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}