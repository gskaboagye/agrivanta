
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  LoaderCircle,
  ArrowRight,
  RefreshCw,
  Inbox,
  ArrowLeft,
} from "lucide-react";

type Inquiry = {
  id: string;
  listingTitle: string;
  listingId: string;
  buyerName: string;
  sellerName: string;
  message: string;
  status: "new" | "read" | "responded";
  updatedAt: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function MessagesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadConversations = useCallback(async (manual = false) => {
    if (manual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch("/api/inquiries?view=all", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load conversations."
        );
      }

      setInquiries(
        Array.isArray(data.inquiries) ? data.inquiries : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load conversations."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  return (
    <main className="min-h-screen bg-[#F8F6EE] px-4 py-8 text-[#203B2A] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl">

        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#52705A] transition hover:text-[#17472D]"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>

        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9A762C]">
              AgriVanta marketplace
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Messages
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#68776A]">
              Communicate with buyers and sellers about your agricultural listings.
              Your conversations are private to their participants.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadConversations(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D9E1D5] bg-white px-4 py-3 text-sm font-semibold text-[#17472D] transition hover:bg-[#EDF2E9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </header>

        <div className="mt-6 flex items-center justify-between rounded-xl border border-[#E0E5D9] bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF0E6] text-[#17472D]">
              <Inbox size={20} />
            </div>

            <div>
              <p className="text-xs text-[#68776A]">
                Your conversations
              </p>
              <p className="text-lg font-bold">
                {loading ? "—" : inquiries.length}
              </p>
            </div>
          </div>

          <MessageCircle
            size={24}
            className="text-[#9A762C]"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <p className="text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void loadConversations(true)}
              className="mt-3 text-sm font-semibold text-red-800 underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="mt-8 flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-[#E0E5D9] bg-white p-12 text-sm text-[#68776A]">
            <LoaderCircle
              className="animate-spin"
              size={20}
            />
            Loading conversations...
          </div>
        ) : error ? null : inquiries.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[#CCD8C7] bg-white px-6 py-16 text-center">
            <MessageCircle
              size={32}
              className="mx-auto text-[#17472D]"
            />

            <h2 className="mt-4 text-lg font-bold">
              No conversations yet
            </h2>

            <p className="mt-2 text-sm text-[#68776A]">
              Contact a seller through the marketplace to start a conversation.
            </p>

            <Link
              href="/products"
              className="mt-6 inline-flex rounded-xl bg-[#17472D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#235C3B]"
            >
              Explore marketplace
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {inquiries.map((inquiry) => (
              <Link
                key={inquiry.id}
                href={`/dashboard/messages/${encodeURIComponent(inquiry.id)}`}
                className="group flex items-center gap-4 rounded-2xl border border-[#E0E5D9] bg-white p-5 transition hover:border-[#B9CBB2] hover:shadow-sm"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EAF0E6] text-[#17472D] transition group-hover:bg-[#17472D] group-hover:text-white">
                  <MessageCircle size={22} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-bold">
                      {inquiry.listingTitle || "Marketplace listing"}
                    </h2>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${
                        inquiry.status === "new"
                          ? "bg-[#FBF1D9] text-[#805B17]"
                          : inquiry.status === "responded"
                            ? "bg-[#EAF0E6] text-[#24542E]"
                            : "bg-[#EEF0EC] text-[#5D6B5E]"
                      }`}
                    >
                      {inquiry.status || "new"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-[#68776A]">
                    Buyer: {inquiry.buyerName || "Marketplace user"}
                    {" · "}
                    Seller: {inquiry.sellerName || "Marketplace user"}
                  </p>

                  <p className="mt-2 line-clamp-2 break-words text-sm text-[#68776A]">
                    {inquiry.message || "Open this conversation to view messages."}
                  </p>

                  {inquiry.updatedAt && (
                    <p className="mt-2 text-xs text-[#879084]">
                      Updated {formatDate(inquiry.updatedAt)}
                    </p>
                  )}
                </div>

                <ArrowRight
                  size={18}
                  className="shrink-0 text-[#879084] transition group-hover:translate-x-1 group-hover:text-[#17472D]"
                />
              </Link>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
