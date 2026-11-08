
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Package,
  CheckCircle2,
  XCircle,
  MapPin,
  User,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  ExternalLink,
  Loader2,
  ShieldCheck,
  ShieldOff,
  X,
  History,
  Clock,
  FileText,
  ChevronDown,
} from "lucide-react";

type ModerationRecord = {
  action: string;
  reason: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  timestamp: string | null;
};

type Listing = {
  id: string;
  title: string;
  type: string;
  category: string;
  subcategory: string;
  description: string;
  price: number | null;
  priceUnit: string;
  location: string;
  seller: string;
  sellerId: string;
  sellerEmail: string;
  image: string;
  images: string[];
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
  moderationHistory: ModerationRecord[];
};

type Analytics = {
  totalListings: number;
  activeListings: number;
  disabledListings: number;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  overview?: Analytics;
  listings?: Listing[];
  pagination?: {
    page: number;
    pageSize: number;
    totalListings: number;
    totalPages: number;
  };
};

type ModerationStatus = "active" | "disabled";

const roleOptions = [
  { label: "All types", value: "" },
  { label: "Products", value: "product" },
  { label: "Hire", value: "hire" },
  { label: "Services", value: "service" },
  { label: "Workers", value: "worker" },
  { label: "Experts", value: "expert" },
];

const statusOptions = [
  { label: "All statuses", value: "" },
  { label: "Active", value: "active" },
  { label: "Disabled", value: "disabled" },
];

function formatDate(date: string | null) {
  if (!date) return "Not available";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Not available";

  return parsed.toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: string | null) {
  if (!date) return "Not available";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Not available";

  return parsed.toLocaleString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(price: number | null, unit: string) {
  if (price === null || price === undefined) {
    return "Price not specified";
  }

  return `GH₵ ${price.toLocaleString("en-GH")} ${
    unit ? `/ ${unit}` : ""
  }`;
}

export default function AdminListingsPage() {
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);

  const [overview, setOverview] = useState<Analytics>({
    totalListings: 0,
    activeListings: 0,
    disabledListings: 0,
  });

  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiltered, setTotalFiltered] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Moderation state
  const [selectedListing, setSelectedListing] =
    useState<Listing | null>(null);

  const [nextStatus, setNextStatus] =
    useState<ModerationStatus>("disabled");

  const [moderationReason, setModerationReason] = useState("");
  const [moderationLoading, setModerationLoading] = useState(false);
  const [moderationError, setModerationError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const loadListings = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
        });

        if (search.trim()) params.set("search", search.trim());
        if (type) params.set("type", type);
        if (status) params.set("status", status);

        const response = await fetch(
          `/api/admin/listings?${params.toString()}`,
          {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
          }
        );

        const data: ApiResponse = await response.json();

        if (response.status === 401) {
          router.replace("/admin/login");
          return;
        }

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load marketplace listings."
          );
        }

        setListings(
          (data.listings ?? []).map((listing) => ({
            ...listing,
            moderationHistory: listing.moderationHistory ?? [],
          }))
        );

        setOverview(
          data.overview ?? {
            totalListings: 0,
            activeListings: 0,
            disabledListings: 0,
          }
        );

        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotalFiltered(data.pagination?.totalListings ?? 0);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading listings."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search, type, status, router]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadListings();
    }, 300);

    return () => clearTimeout(timeout);
  }, [loadListings]);

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function changeType(value: string) {
    setType(value);
    setPage(1);
  }

  function changeStatus(value: string) {
    setStatus(value);
    setPage(1);
  }

  function openModerationDialog(
    listing: Listing,
    newStatus: ModerationStatus
  ) {
    setSelectedListing(listing);
    setNextStatus(newStatus);
    setModerationReason("");
    setModerationError("");
    setActionMessage("");
  }

  function closeModerationDialog() {
    if (moderationLoading) return;

    setSelectedListing(null);
    setModerationReason("");
    setModerationError("");
  }

  async function handleModeration() {
    if (!selectedListing) return;

    const reason = moderationReason.trim();

    if (nextStatus === "disabled" && reason.length < 10) {
      setModerationError(
        "Please provide a reason of at least 10 characters."
      );
      return;
    }

    if (reason.length > 500) {
      setModerationError(
        "The reason cannot exceed 500 characters."
      );
      return;
    }

    setModerationLoading(true);
    setModerationError("");

    try {
      const response = await fetch("/api/admin/listings", {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId: selectedListing.id,
          status: nextStatus,
          reason,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to update listing status."
        );
      }

      setActionMessage(
        data.message ||
          (nextStatus === "disabled"
            ? "Listing disabled successfully."
            : "Listing reactivated successfully.")
      );

      setSelectedListing(null);
      setModerationReason("");

      await loadListings(true);
    } catch (err) {
      setModerationError(
        err instanceof Error
          ? err.message
          : "Something went wrong while updating the listing."
      );
    } finally {
      setModerationLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F8F4] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <button
              onClick={() => router.push("/admin")}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#17472D]"
            >
              <ArrowLeft size={17} />
              Back to dashboard
            </button>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Marketplace Oversight
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Monitor and manage listings published on AgriVanta.
            </p>
          </div>

          <button
            onClick={() => loadListings(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Action success message */}
        {actionMessage && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} />
              <span>{actionMessage}</span>
            </div>

            <button
              onClick={() => setActionMessage("")}
              aria-label="Dismiss message"
              className="text-green-700 hover:text-green-900"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Overview cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total listings
                </p>
                <h2 className="mt-2 text-3xl font-bold text-gray-900">
                  {overview.totalListings}
                </h2>
              </div>
              <div className="rounded-xl bg-[#17472D]/10 p-3 text-[#17472D]">
                <Package size={23} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Active listings
                </p>
                <h2 className="mt-2 text-3xl font-bold text-gray-900">
                  {overview.activeListings}
                </h2>
              </div>
              <div className="rounded-xl bg-green-50 p-3 text-green-700">
                <CheckCircle2 size={23} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Disabled listings
                </p>
                <h2 className="mt-2 text-3xl font-bold text-gray-900">
                  {overview.disabledListings}
                </h2>
              </div>
              <div className="rounded-xl bg-red-50 p-3 text-red-600">
                <XCircle size={23} />
              </div>
            </div>
          </div>
        </section>

        {/* Search and filters */}
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Filter size={18} className="text-[#17472D]" />
            <h2 className="font-semibold text-gray-900">
              Search and filters
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => changeSearch(event.target.value)}
                placeholder="Search title, seller or location..."
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
              />
            </div>

            <select
              value={type}
              onChange={(event) => changeType(event.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#17472D]"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(event) => changeStatus(event.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#17472D]"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Listings */}
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold text-gray-900">
                Marketplace listings
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {totalFiltered} matching listing
                {totalFiltered === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-gray-500">
              <Loader2
                size={20}
                className="animate-spin text-[#17472D]"
              />
              Loading marketplace listings...
            </div>
          ) : error ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
              <XCircle size={32} className="text-red-500" />

              <p className="mt-3 font-semibold text-gray-800">
                Unable to load listings
              </p>

              <p className="mt-1 text-sm text-gray-500">{error}</p>

              <button
                onClick={() => loadListings(true)}
                className="mt-4 rounded-lg bg-[#17472D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#103921]"
              >
                Try again
              </button>
            </div>
          ) : listings.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
              <Package size={34} className="text-gray-300" />

              <p className="mt-3 font-semibold text-gray-800">
                No listings found
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {listings.map((listing) => {
                const history = [...(listing.moderationHistory ?? [])].reverse();

                return (
                  <article
                    key={listing.id}
                    className="flex flex-col gap-4 p-5 transition hover:bg-gray-50/70"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row">
                      {/* Image */}
                      <div className="h-28 w-full shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-28 sm:w-36">
                        {listing.image ? (
                          <img
                            src={listing.image}
                            alt={listing.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-400">
                            <Package size={30} />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {listing.title}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              listing.status === "active"
                                ? "bg-green-50 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {listing.status === "active"
                              ? "Active"
                              : "Disabled"}
                          </span>
                        </div>

                        <p className="mt-1 text-sm font-semibold text-[#17472D]">
                          {formatPrice(listing.price, listing.priceUnit)}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <Package size={14} />
                            {listing.type}
                          </span>

                          <span className="inline-flex items-center gap-1">
                            <Filter size={14} />
                            {listing.category}
                          </span>

                          <span className="inline-flex items-center gap-1">
                            <MapPin size={14} />
                            {listing.location || "Location not specified"}
                          </span>

                          <span className="inline-flex items-center gap-1">
                            <CalendarDays size={14} />
                            {formatDate(listing.createdAt)}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1 font-medium text-gray-700">
                            <User size={14} />
                            {listing.seller}
                          </span>

                          <span>{listing.sellerEmail}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-center">
                        <button
                          onClick={() =>
                            router.push(`/listings/${listing.id}`)
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-[#17472D] hover:text-[#17472D]"
                        >
                          View listing
                          <ExternalLink size={14} />
                        </button>

                        {listing.status === "active" ? (
                          <button
                            onClick={() =>
                              openModerationDialog(listing, "disabled")
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                          >
                            <ShieldOff size={14} />
                            Disable listing
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              openModerationDialog(listing, "active")
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-100"
                          >
                            <ShieldCheck size={14} />
                            Reactivate listing
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Moderation history */}
                    <details className="group rounded-xl border border-gray-200 bg-gray-50/70">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                        <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <History size={17} className="text-[#17472D]" />
                          Moderation history
                          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                            {history.length}
                          </span>
                        </span>

                        <ChevronDown
                          size={18}
                          className="text-gray-500 transition-transform group-open:rotate-180"
                        />
                      </summary>

                      <div className="border-t border-gray-200 px-4 py-4">
                        {history.length === 0 ? (
                          <div className="flex items-center gap-3 py-2 text-sm text-gray-500">
                            <FileText
                              size={19}
                              className="text-gray-400"
                            />
                            No moderation actions have been recorded for this listing.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {history.map((record, index) => {
                              const disabled =
                                record.action === "disabled";

                              return (
                                <div
                                  key={`${record.timestamp ?? "record"}-${index}`}
                                  className="relative rounded-lg border border-gray-200 bg-white p-4"
                                >
                                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                                    <div className="flex items-start gap-3">
                                      <div
                                        className={`rounded-lg p-2 ${
                                          disabled
                                            ? "bg-red-50 text-red-600"
                                            : "bg-green-50 text-green-700"
                                        }`}
                                      >
                                        {disabled ? (
                                          <ShieldOff size={18} />
                                        ) : (
                                          <ShieldCheck size={18} />
                                        )}
                                      </div>

                                      <div>
                                        <p
                                          className={`text-sm font-semibold ${
                                            disabled
                                              ? "text-red-700"
                                              : "text-green-700"
                                          }`}
                                        >
                                          {disabled
                                            ? "Listing disabled"
                                            : "Listing reactivated"}
                                        </p>

                                        <p className="mt-1 text-xs text-gray-500">
                                          Administrator:{" "}
                                          <span className="font-medium text-gray-700">
                                            {record.adminName ||
                                              "Administrator not available"}
                                          </span>
                                        </p>

                                        {record.adminEmail && (
                                          <p className="mt-1 text-xs text-gray-500">
                                            {record.adminEmail}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                      <Clock size={14} />
                                      {formatDateTime(record.timestamp)}
                                    </div>
                                  </div>

                                  <div className="mt-4 rounded-lg bg-gray-50 p-3">
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                      Moderation reason
                                    </p>

                                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                                      {record.reason ||
                                        "No reason provided."}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </details>
                  </article>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalFiltered > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row">
              <p className="text-xs text-gray-500">
                Page {page} of {Math.max(totalPages, 1)}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setPage((current) => Math.max(1, current - 1))
                  }
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  onClick={() =>
                    setPage((current) =>
                      Math.min(totalPages, current + 1)
                    )
                  }
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Moderation dialog */}
      {selectedListing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModerationDialog();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="moderation-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div
                  className={`mb-3 inline-flex rounded-xl p-3 ${
                    nextStatus === "disabled"
                      ? "bg-red-50 text-red-600"
                      : "bg-green-50 text-green-700"
                  }`}
                >
                  {nextStatus === "disabled" ? (
                    <ShieldOff size={22} />
                  ) : (
                    <ShieldCheck size={22} />
                  )}
                </div>

                <h2
                  id="moderation-title"
                  className="text-xl font-bold text-gray-900"
                >
                  {nextStatus === "disabled"
                    ? "Disable listing"
                    : "Reactivate listing"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {nextStatus === "disabled"
                    ? "This listing will be removed from the public marketplace."
                    : "This listing will become visible in the public marketplace again."}
                </p>
              </div>

              <button
                onClick={closeModerationDialog}
                disabled={moderationLoading}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Selected listing
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {selectedListing.title}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {selectedListing.seller}
              </p>
            </div>

            <div className="mt-5">
              <label
                htmlFor="moderation-reason"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Reason{" "}
                {nextStatus === "disabled"
                  ? "(Required)"
                  : "(Optional)"}
              </label>

              <textarea
                id="moderation-reason"
                value={moderationReason}
                onChange={(event) => {
                  setModerationReason(event.target.value);
                  setModerationError("");
                }}
                rows={4}
                maxLength={500}
                placeholder={
                  nextStatus === "disabled"
                    ? "Explain why this listing is being disabled..."
                    : "Add an optional note about reactivating this listing..."
                }
                disabled={moderationLoading}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10 disabled:bg-gray-50"
              />

              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>
                  {nextStatus === "disabled"
                    ? "At least 10 characters required."
                    : "You may leave this blank."}
                </span>

                <span>{moderationReason.length}/500</span>
              </div>
            </div>

            {moderationError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {moderationError}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={closeModerationDialog}
                disabled={moderationLoading}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleModeration}
                disabled={moderationLoading}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  nextStatus === "disabled"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#17472D] hover:bg-[#103921]"
                }`}
              >
                {moderationLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : nextStatus === "disabled" ? (
                  "Confirm disable"
                ) : (
                  "Confirm reactivation"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
