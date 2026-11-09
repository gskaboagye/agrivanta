"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  CalendarDays,
  UserRound,
  FileText,
} from "lucide-react";

type ReportStatus =
  | "pending"
  | "investigating"
  | "resolved"
  | "dismissed";

type Report = {
  reportId: string;
  referenceNumber: string;
  reporter: {
    userId: string;
    name: string;
    email: string;
    role?: string;
  };
  category: string;
  subject: string;
  description: string;
  reportedEntity: {
    type: "listing" | "user" | "platform";
    id?: string;
    label?: string;
  } | null;
  status: ReportStatus;
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  updatedAt: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type Counts = {
  total: number;
  pending: number;
  investigating: number;
  resolved: number;
  dismissed: number;
};

const categories = [
  "Fraud or Scam",
  "Suspicious Listing",
  "User Misconduct",
  "Misleading Information",
  "Platform Issue",
  "Other",
];

const statusOptions = [
  { label: "All statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Investigating", value: "investigating" },
  { label: "Resolved", value: "resolved" },
  { label: "Dismissed", value: "dismissed" },
];

const emptyCounts: Counts = {
  total: 0,
  pending: 0,
  investigating: 0,
  resolved: 0,
  dismissed: 0,
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusStyle(status: ReportStatus) {
  const styles: Record<ReportStatus, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    investigating: "bg-blue-50 text-blue-700 border-blue-200",
    resolved: "bg-green-50 text-green-700 border-green-200",
    dismissed: "bg-gray-100 text-gray-600 border-gray-200",
  };

  return styles[status] ?? styles.pending;
}

function priorityStyle(priority: string) {
  const styles: Record<string, string> = {
    low: "bg-gray-100 text-gray-600",
    medium: "bg-blue-50 text-blue-700",
    high: "bg-orange-50 text-orange-700",
    urgent: "bg-red-50 text-red-700",
  };

  return styles[priority] ?? styles.medium;
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function AdminUserReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [counts, setCounts] = useState<Counts>(emptyCounts);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 15,
    total: 0,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async (page: number) => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        status,
        category,
        search: search.trim(),
      });

      const response = await fetch(
        `/api/admin/user-reports?${params.toString()}`,
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        window.location.assign("/admin/login");
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load reports.");
      }

      setReports(data.reports ?? []);
      setCounts(data.counts ?? emptyCounts);
      setPagination(data.pagination);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading reports."
      );
    } finally {
      setLoading(false);
    }
  }, [status, category, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReports(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [loadReports]);

  return (
    <main className="min-h-screen bg-[#F7F8F4] text-[#26372b]">
      <header className="border-b border-[#e5e9e1] bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-5 sm:px-8">
          <Link
            href="/admin"
            aria-label="Back to administrator dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e9e1] text-[#52624f] transition hover:bg-[#f2f5ef]"
          >
            <ArrowLeft size={19} />
          </Link>

          <div>
            <p className="text-lg font-extrabold text-[#17472D]">
              AgriVanta
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#899487]">
              Administrator / User Reports
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#74816f]">
              <ShieldAlert size={16} />
              Platform administration
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-[#17472D] sm:text-3xl">
              User Reports
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-[#7c8879]">
              Review user complaints, investigate suspicious activity and
              manage reports submitted by the AgriVanta community.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadReports(pagination.page)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#dfe7dc] bg-white px-4 py-2.5 text-xs font-bold text-[#42634a] transition hover:bg-[#f2f5ef] disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh reports
          </button>
        </div>

        <section className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-[#e5e9e1] bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#899487]">
                Total reports
              </p>
              <FileText size={19} className="text-[#17472D]" />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-[#17472D]">
              {counts.total}
            </p>
            <p className="mt-1 text-xs text-[#899487]">All submissions</p>
          </div>

          <div className="rounded-2xl border border-[#e5e9e1] bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#899487]">
                Pending
              </p>
              <Clock size={19} className="text-amber-600" />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-amber-600">
              {counts.pending}
            </p>
            <p className="mt-1 text-xs text-[#899487]">Awaiting review</p>
          </div>

          <div className="rounded-2xl border border-[#e5e9e1] bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#899487]">
                Investigating
              </p>
              <AlertTriangle size={19} className="text-blue-600" />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-blue-600">
              {counts.investigating}
            </p>
            <p className="mt-1 text-xs text-[#899487]">Under investigation</p>
          </div>

          <div className="rounded-2xl border border-[#e5e9e1] bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#899487]">
                Resolved
              </p>
              <CheckCircle2 size={19} className="text-green-700" />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-green-700">
              {counts.resolved}
            </p>
            <p className="mt-1 text-xs text-[#899487]">Successfully resolved</p>
          </div>

          <div className="rounded-2xl border border-[#e5e9e1] bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#899487]">
                Dismissed
              </p>
              <XCircle size={19} className="text-gray-500" />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-gray-600">
              {counts.dismissed}
            </p>
            <p className="mt-1 text-xs text-[#899487]">Closed reports</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#e5e9e1] bg-white">
          <div className="border-b border-[#e5e9e1] p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-base font-bold text-[#26372b]">
                Submitted reports
              </h2>
              <p className="mt-1 text-xs text-[#899487]">
                Search and review reports submitted by registered users.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="relative md:col-span-1">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#899487]"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search reference, subject or reporter..."
                  className="w-full rounded-xl border border-[#dfe7dc] bg-[#fbfcfa] py-3 pl-10 pr-4 text-xs text-[#26372b] outline-none transition placeholder:text-[#a0aa9b] focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
                />
              </div>

              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="rounded-xl border border-[#dfe7dc] bg-[#fbfcfa] px-3 py-3 text-xs text-[#52624f] outline-none focus:border-[#17472D]"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="rounded-xl border border-[#dfe7dc] bg-[#fbfcfa] px-3 py-3 text-xs text-[#52624f] outline-none focus:border-[#17472D]"
              >
                <option value="all">All categories</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Unable to load reports</p>
                <p className="mt-1 text-xs">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadReports(pagination.page)}
                  className="mt-2 text-xs font-bold underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-[#f8faf6]">
                <tr className="border-b border-[#e5e9e1]">
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                    Report
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                    Reporter
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                    Category
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                    Priority
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                    Status
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                    Submitted
                  </th>
                  <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf0ea]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <RefreshCw
                        size={22}
                        className="mx-auto animate-spin text-[#17472D]"
                      />
                      <p className="mt-3 text-xs text-[#899487]">
                        Loading reports...
                      </p>
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <ShieldAlert
                        size={30}
                        className="mx-auto text-[#b5beb1]"
                      />
                      <p className="mt-3 text-sm font-bold text-[#52624f]">
                        No reports found
                      </p>
                      <p className="mt-1 text-xs text-[#899487]">
                        Reports matching your filters will appear here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr
                      key={report.reportId}
                      className="transition hover:bg-[#fbfcfa]"
                    >
                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-[#17472D]">
                          {report.referenceNumber}
                        </p>
                        <p className="mt-1 max-w-[220px] truncate text-xs font-semibold text-[#26372b]">
                          {report.subject}
                        </p>
                        <p className="mt-1 text-[10px] text-[#899487]">
                          {report.reportedEntity?.type
                            ? `Target: ${report.reportedEntity.type}`
                            : "General report"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <UserRound
                            size={16}
                            className="shrink-0 text-[#899487]"
                          />
                          <div>
                            <p className="text-xs font-semibold text-[#26372b]">
                              {report.reporter?.name || "Unknown user"}
                            </p>
                            <p className="mt-1 text-[10px] text-[#899487]">
                              {report.reporter?.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-xs text-[#52624f]">
                          {report.category}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase ${priorityStyle(report.priority)}`}
                        >
                          {report.priority}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-bold ${statusStyle(report.status)}`}
                        >
                          {formatStatus(report.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-[#52624f]">
                          <CalendarDays size={13} className="text-[#899487]" />
                          {formatDate(report.createdAt)}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/user-reports/${encodeURIComponent(report.reportId)}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#17472D] px-3 py-2 text-[10px] font-bold text-white transition hover:bg-[#103a23]"
                        >
                          Investigate
                          <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col justify-between gap-3 border-t border-[#e5e9e1] px-5 py-4 sm:flex-row sm:items-center">
            <p className="text-xs text-[#899487]">
              Showing{" "}
              <span className="font-bold text-[#52624f]">
                {reports.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-[#52624f]">
                {pagination.total}
              </span>{" "}
              reports
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={loading || pagination.page <= 1}
                onClick={() => void loadReports(pagination.page - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dfe7dc] text-[#52624f] transition hover:bg-[#f2f5ef] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft size={17} />
              </button>

              <span className="px-2 text-xs font-semibold text-[#52624f]">
                Page {pagination.page} of {Math.max(1, pagination.totalPages)}
              </span>

              <button
                type="button"
                disabled={
                  loading ||
                  pagination.page >= pagination.totalPages
                }
                onClick={() => void loadReports(pagination.page + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dfe7dc] text-[#52624f] transition hover:bg-[#f2f5ef] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </section>

        <p className="mt-5 text-center text-[11px] text-[#9aa395]">
          AgriVanta Administration · User Reports Management
        </p>
      </div>
    </main>
  );
}