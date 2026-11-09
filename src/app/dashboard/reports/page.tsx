"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Flag,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

type ReportStatus = "pending" | "investigating" | "resolved" | "dismissed";

type Report = {
  reportId: string;
  referenceNumber: string;
  category: string;
  subject: string;
  description: string;
  reportedEntity?: {
    type: "listing" | "user" | "platform";
    id?: string;
    label?: string;
  } | null;
  status: ReportStatus;
  priority?: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string | null;
};

type UserSearchResult = {
  id: string;
  name: string;
  role: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  reports?: Report[];
  report?: {
    referenceNumber: string;
    status: string;
    createdAt: string;
  };
  pagination?: {
    page: number;
    total: number;
    totalPages: number;
  };
};

const categories = [
  "Fraud or Scam",
  "Suspicious Listing",
  "User Misconduct",
  "Misleading Information",
  "Platform Issue",
  "Other",
];

function formatDate(value?: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusLabel(status: ReportStatus) {
  const labels: Record<ReportStatus, string> = {
    pending: "Pending",
    investigating: "Under investigation",
    resolved: "Resolved",
    dismissed: "Dismissed",
  };

  return labels[status] ?? status;
}

function statusStyle(status: ReportStatus) {
  const styles: Record<ReportStatus, string> = {
    pending: "bg-amber-50 text-amber-800 border-amber-200",
    investigating: "bg-blue-50 text-blue-800 border-blue-200",
    resolved: "bg-green-50 text-green-800 border-green-200",
    dismissed: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return styles[status] ?? styles.pending;
}

export default function MyReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);

  const [category, setCategory] = useState(categories[0]);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [entityType, setEntityType] = useState<"platform" | "listing" | "user">("platform");
  const [entityId, setEntityId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/user-reports?page=${page}`, {
        credentials: "same-origin",
        cache: "no-store",
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load your reports.");
      }

      setReports(data.reports ?? []);
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotalReports(data.pagination?.total ?? 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load your reports."
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  useEffect(() => {
    if (entityType !== "user" || selectedUser || userSearch.trim().length < 2) {
      setUserResults([]);
      setSearchingUsers(false);
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      setSearchingUsers(true);

      try {
        const response = await fetch(
          `/api/user-reports/search-users?q=${encodeURIComponent(userSearch.trim())}`,
          {
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to search users.");
        }

        setUserResults(data.users ?? []);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setUserResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchingUsers(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [entityType, userSearch, selectedUser]);

  const filteredReports = reports.filter((report) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return (
      report.subject.toLowerCase().includes(query) ||
      report.referenceNumber.toLowerCase().includes(query) ||
      report.category.toLowerCase().includes(query)
    );
  });

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setReferenceNumber("");

    if (description.trim().length < 10) {
      setError("Please provide at least 10 characters in the description.");
      return;
    }

    if (entityType === "listing" && !/^[a-fA-F0-9]{24}$/.test(entityId.trim())) {
      setError("Enter a valid listing ID.");
      return;
    }

    if (entityType === "user" && !selectedUser) {
      setError("Search for and select the user you want to report.");
      return;
    }

    const payload = {
      category,
      subject: subject.trim(),
      description: description.trim(),
      reportedEntity:
        entityType === "platform"
          ? { type: "platform" as const }
          : entityType === "listing"
            ? { type: "listing" as const, id: entityId.trim() }
            : { type: "user" as const, id: selectedUser!.id },
    };

    setSubmitting(true);

    try {
      const response = await fetch("/api/user-reports", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to submit your report.");
      }

      setReferenceNumber(data.report?.referenceNumber ?? "");
      setSuccess(data.message || "Your report has been submitted successfully.");
      setSubject("");
      setDescription("");
      setEntityType("platform");
      setEntityId("");
      setUserSearch("");
      setUserResults([]);
      setSelectedUser(null);
      setCategory(categories[0]);
      setShowForm(false);
      setPage(1);
      await loadReports();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to submit your report."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F6EE] px-4 py-8 text-[#193D2A] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#58705E] transition hover:text-[#17472D]"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <section className="overflow-hidden rounded-3xl bg-[#17472D] p-6 text-white shadow-sm sm:p-9">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#E6BD57]">
                <Flag size={24} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E6BD57]">
                Account support and safety
              </p>
              <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
                My Reports
              </h1>
              <p className="mt-3 text-sm leading-7 text-white/80 sm:text-base">
                Report suspicious activity, scams, misleading listings or
                other concerns. Track the progress of every report you submit.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowForm((value) => !value);
                setError("");
                setSuccess("");
              }}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#D9A441] px-5 py-3 text-sm font-bold text-[#173B27] transition hover:bg-[#E7B958]"
            >
              {showForm ? <X size={18} /> : <Plus size={18} />}
              {showForm ? "Close form" : "Submit a report"}
            </button>
          </div>
        </section>

        {success && (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5 text-green-900">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 shrink-0" size={21} />
              <div>
                <p className="font-bold">{success}</p>
                {referenceNumber && (
                  <p className="mt-2 text-sm">
                    Your reference number:{" "}
                    <strong className="font-mono">{referenceNumber}</strong>
                  </p>
                )}
                <p className="mt-1 text-xs text-green-800">
                  Keep this reference number for future follow-up.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {showForm && (
          <section className="mt-6 rounded-2xl border border-[#E0E5D9] bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold">Submit a new report</h2>
              <p className="mt-1 text-sm leading-6 text-[#718071]">
                Give us accurate details so our team can investigate your concern.
              </p>
            </div>

            <form onSubmit={submitReport} className="space-y-5">
              <div>
                <label htmlFor="report-category" className="mb-2 block text-sm font-bold">
                  Report category
                </label>
                <select
                  id="report-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  required
                  className="w-full rounded-xl border border-[#D9DED4] bg-white px-4 py-3 text-sm outline-none focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="report-subject" className="mb-2 block text-sm font-bold">
                  Subject
                </label>
                <input
                  id="report-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  minLength={3}
                  maxLength={120}
                  required
                  placeholder="Briefly describe the issue"
                  className="w-full rounded-xl border border-[#D9DED4] px-4 py-3 text-sm outline-none focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
                />
                <p className="mt-1 text-xs text-[#879084]">3–120 characters.</p>
              </div>

              <div>
                <label htmlFor="report-description" className="mb-2 block text-sm font-bold">
                  Description
                </label>
                <textarea
                  id="report-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  minLength={10}
                  maxLength={3000}
                  required
                  rows={6}
                  placeholder="Explain what happened, when it happened, and any details that may help our team."
                  className="w-full resize-y rounded-xl border border-[#D9DED4] px-4 py-3 text-sm leading-6 outline-none focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
                />
                <p className="mt-1 text-xs text-[#879084]">
                  {description.length}/3000 characters. Minimum 10.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="entity-type" className="mb-2 block text-sm font-bold">
                    What does this report concern?
                  </label>
                  <select
                    id="entity-type"
                    value={entityType}
                    onChange={(event) => {
                      setEntityType(event.target.value as typeof entityType);
                      setEntityId("");
                    }}
                    className="w-full rounded-xl border border-[#D9DED4] bg-white px-4 py-3 text-sm outline-none focus:border-[#17472D]"
                  >
                    <option value="platform">AgriVanta platform</option>
                    <option value="listing">A marketplace listing</option>
                    <option value="user">A user account</option>
                  </select>
                </div>

                {entityType === "listing" && (
                  <div>
                    <label htmlFor="entity-id" className="mb-2 block text-sm font-bold">
                      Listing ID
                    </label>
                    <input
                      id="entity-id"
                      value={entityId}
                      onChange={(event) => setEntityId(event.target.value)}
                      required
                      placeholder="Enter the listing ID"
                      className="w-full rounded-xl border border-[#D9DED4] px-4 py-3 text-sm outline-none focus:border-[#17472D]"
                    />
                    <p className="mt-1 text-xs text-[#879084]">
                      Enter the ID of the marketplace listing you are reporting.
                    </p>
                  </div>
                )}

                {entityType === "user" && (
                  <div className="relative">
                    <label htmlFor="user-search" className="mb-2 block text-sm font-bold">
                      Search for the user
                    </label>

                    {selectedUser ? (
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-[#B8D2BE] bg-[#F3F8F2] p-3">
                        <div className="min-w-0">
                          <p className="font-bold text-[#17472D]">{selectedUser.name}</p>
                          <p className="mt-1 text-xs capitalize text-[#718071]">
                            {selectedUser.role.replace(/[-_]/g, " ")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(null);
                            setUserSearch("");
                            setUserResults([]);
                          }}
                          className="shrink-0 rounded-lg border border-[#D9DED4] bg-white px-3 py-2 text-xs font-semibold text-[#536453] hover:bg-[#F1F2E8]"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <Search
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#879084]"
                          />
                          <input
                            id="user-search"
                            value={userSearch}
                            onChange={(event) => {
                              setUserSearch(event.target.value);
                              setSelectedUser(null);
                            }}
                            autoComplete="off"
                            placeholder="Type the user's name..."
                            className="w-full rounded-xl border border-[#D9DED4] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#17472D]"
                          />
                        </div>

                        <p className="mt-1 text-xs text-[#879084]">
                          Enter at least two characters to find a registered user.
                        </p>

                        {searchingUsers && (
                          <p className="mt-2 text-xs text-[#718071]">
                            Searching users...
                          </p>
                        )}

                        {!searchingUsers && userSearch.trim().length >= 2 && userResults.length === 0 && (
                          <p className="mt-2 rounded-lg border border-[#E7E9E1] bg-[#FCFCF9] p-3 text-xs text-[#718071]">
                            No matching users found. Check the spelling and try again.
                          </p>
                        )}

                        {userResults.length > 0 && (
                          <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-[#D9DED4] bg-white shadow-lg">
                            {userResults.map((user) => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setUserSearch(user.name);
                                  setUserResults([]);
                                }}
                                className="flex w-full items-center justify-between gap-3 border-b border-[#EDF0E9] px-4 py-3 text-left last:border-b-0 hover:bg-[#F3F8F2]"
                              >
                                <span className="font-semibold text-[#193D2A]">
                                  {user.name}
                                </span>
                                <span className="shrink-0 rounded-full bg-[#F1F2E8] px-2.5 py-1 text-xs capitalize text-[#536453]">
                                  {user.role.replace(/[-_]/g, " ")}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-[#E7E9E1] bg-[#F8F6EE] p-4 text-sm leading-6 text-[#68776A]">
                Your account details will be attached automatically. Reports
                are reviewed by the AgriVanta team. Submitting a report does
                not automatically suspend another account.
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-[#EDF0E9] pt-5">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-[#D9DED4] px-5 py-3 text-sm font-semibold text-[#536453] hover:bg-[#F7F8F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17472D] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#235B3A] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <Flag size={17} />
                  )}
                  {submitting ? "Submitting..." : "Submit report"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="mt-8">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#9B741F]">
                Your submissions
              </p>
              <h2 className="mt-2 text-2xl font-extrabold">Report history</h2>
              <p className="mt-1 text-sm text-[#718071]">
                {totalReports} report{totalReports === 1 ? "" : "s"} submitted
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#879084]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search your reports"
                  className="w-full rounded-xl border border-[#D9DED4] bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#17472D]"
                />
              </div>
              <button
                type="button"
                onClick={() => void loadReports()}
                disabled={loading}
                aria-label="Refresh reports"
                className="inline-flex items-center justify-center rounded-xl border border-[#D9DED4] bg-white px-3 py-2.5 text-[#17472D] hover:bg-[#F1F2E8] disabled:opacity-50"
              >
                <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#E0E5D9] bg-white shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center gap-3 p-12 text-sm text-[#718071]">
                <LoaderCircle size={20} className="animate-spin" />
                Loading your reports...
              </div>
            ) : error && reports.length === 0 ? (
              <div className="p-10 text-center">
                <AlertCircle size={30} className="mx-auto text-red-500" />
                <p className="mt-3 text-sm text-[#718071]">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadReports()}
                  className="mt-4 rounded-lg bg-[#17472D] px-4 py-2 text-sm font-bold text-white"
                >
                  Try again
                </button>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F2E8] text-[#17472D]">
                  <ClipboardList size={25} />
                </div>
                <h3 className="mt-4 font-bold">
                  {search ? "No matching reports" : "You haven't submitted any reports"}
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#718071]">
                  {search
                    ? "Try a different search term."
                    : "If you encounter a scam, suspicious listing or other concern, submit a report and our team will review it."}
                </p>
                {!search && (
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#17472D] px-5 py-3 text-sm font-bold text-white"
                  >
                    <Plus size={17} /> Submit your first report
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="divide-y divide-[#EDF0E9]">
                  {filteredReports.map((report) => (
                    <article key={report.reportId} className="p-5 transition hover:bg-[#FCFCF9] sm:p-6">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-[#F1F2E8] px-2.5 py-1 text-xs font-bold text-[#536453]">
                              {report.category}
                            </span>
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyle(report.status)}`}>
                              {statusLabel(report.status)}
                            </span>
                          </div>
                          <h3 className="mt-3 text-base font-extrabold text-[#193D2A]">
                            {report.subject}
                          </h3>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#718071]">
                            {report.description}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#879084]">
                            <span className="font-mono font-semibold text-[#536453]">
                              {report.referenceNumber}
                            </span>
                            <span>Submitted {formatDate(report.createdAt)}</span>
                            {report.reportedEntity?.type && (
                              <span>
                                Concern: {report.reportedEntity.type}
                                {report.reportedEntity.label ? ` — ${report.reportedEntity.label}` : ""}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 text-left sm:text-right">
                          <p className="text-xs text-[#879084]">Last updated</p>
                          <p className="mt-1 text-sm font-semibold text-[#536453]">
                            {formatDate(report.updatedAt || report.createdAt)}
                          </p>
                          {report.resolvedAt && (
                            <p className="mt-1 text-xs text-green-700">
                              Resolved {formatDate(report.resolvedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EDF0E9] bg-[#FCFCF9] px-5 py-4">
                  <p className="text-xs text-[#718071]">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((value) => Math.max(1, value - 1))}
                      disabled={page <= 1 || loading}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#D9DED4] bg-white px-3 py-2 text-xs font-bold text-[#536453] disabled:opacity-40"
                    >
                      <ChevronLeft size={15} /> Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                      disabled={page >= totalPages || loading}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#D9DED4] bg-white px-3 py-2 text-xs font-bold text-[#536453] disabled:opacity-40"
                    >
                      Next <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#E0E5D9] bg-white p-4 text-sm leading-6 text-[#718071]">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-[#17472D]" />
          <p>
            Your reports are private. Only you and authorized AgriVanta
            administrators can access the details of your submissions.
          </p>
        </div>
      </div>
    </main>
  );
}