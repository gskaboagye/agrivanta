"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCheck,
  Inbox,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  Send,
  Phone,
  Smartphone,
} from "lucide-react";

type Inquiry = {
  id: string;
  listingId: string;
  listingTitle: string;
  listingType: string;
  sellerId: string;
  sellerName: string;
  sellerEmail?: string;
  sellerPhone?: string;
  buyerId: string;
  buyerName: string;
  buyerEmail?: string;
  buyerPhone?: string;
  message: string;
  status: "new" | "read" | "responded";
  createdAt: string;
  updatedAt: string;
};

type InquiryView = "received" | "sent";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function normalizePhone(value?: string): string {
  if (!value) return "";

  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";

  // Convert local Ghana numbers such as 0241234567 to international format.
  if (digits.startsWith("0") && digits.length === 10) {
    return `233${digits.slice(1)}`;
  }

  if (digits.startsWith("233")) return digits;
  if (trimmed.startsWith("+")) return digits;
  return digits;
}

function getContactLinks(phone?: string, listingTitle?: string) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  const message = `Hello, I'm contacting you about "${listingTitle || "your AgriVanta listing"}" on AgriVanta.`;
  const encodedMessage = encodeURIComponent(message);

  return {
    tel: `tel:+${normalized}`,
    sms: `sms:+${normalized}?body=${encodedMessage}`,
    whatsapp: `https://wa.me/${normalized}?text=${encodedMessage}`,
  };
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [view, setView] = useState<InquiryView>("received");
  const [viewInitialized, setViewInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Respect links such as /dashboard/inquiries?view=sent.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedView = params.get("view");

    if (requestedView === "sent" || requestedView === "received") {
      setView(requestedView);
    }

    setViewInitialized(true);
  }, []);

  const handleViewChange = useCallback((nextView: InquiryView) => {
    setView(nextView);

    const url = new URL(window.location.href);
    url.searchParams.set("view", nextView);
    window.history.replaceState({}, "", url.toString());
  }, []);

  const loadInquiries = useCallback(
    async (manual = false) => {
      if (manual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setNotice("");

      try {
        const response = await fetch(`/api/inquiries?view=${view}`, {
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
          throw new Error(data.error || "Unable to load inquiries.");
        }

        setInquiries(Array.isArray(data.inquiries) ? data.inquiries : []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading inquiries."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [view]
  );

  useEffect(() => {
    if (!viewInitialized) return;
    void loadInquiries();
  }, [loadInquiries, viewInitialized]);

  async function updateStatus(
    inquiryId: string,
    status: "read" | "responded"
  ) {
    setUpdatingId(inquiryId);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to update this inquiry.");
      }

      setInquiries((current) =>
        current.map((inquiry) =>
          inquiry.id === inquiryId ? { ...inquiry, status } : inquiry
        )
      );

      setNotice(
        status === "read"
          ? "Inquiry marked as read."
          : "Inquiry marked as responded to."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update this inquiry."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const newCount = inquiries.filter((inquiry) => inquiry.status === "new").length;
  const respondedCount = inquiries.filter(
    (inquiry) => inquiry.status === "responded"
  ).length;

  return (
    <main className="min-h-screen bg-[#F8F6EE] px-4 py-8 text-[#203B2A] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#52705A] transition hover:text-[#17472D]"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>

        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#9A762C]">
              AgriVanta marketplace
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Inquiries
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#68776A]">
              Manage conversations about your agricultural products, equipment, and services.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadInquiries(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D9E1D5] bg-white px-4 py-3 text-sm font-semibold text-[#17472D] transition hover:bg-[#EDF2E9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#E0E5D9] bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF0E6] text-[#17472D]">
              <Inbox size={20} />
            </div>
            <p className="text-sm text-[#6B7A6C]">
              {view === "received" ? "Received inquiries" : "Sent inquiries"}
            </p>
            <p className="mt-1 text-3xl font-bold">{loading ? "—" : inquiries.length}</p>
          </div>

          <div className="rounded-2xl border border-[#E0E5D9] bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FBF1D9] text-[#916B1F]">
              <MessageCircle size={20} />
            </div>
            <p className="text-sm text-[#6B7A6C]">New inquiries</p>
            <p className="mt-1 text-3xl font-bold">{loading ? "—" : newCount}</p>
          </div>

          <div className="rounded-2xl border border-[#E0E5D9] bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF0E6] text-[#17472D]">
              <Send size={20} />
            </div>
            <p className="text-sm text-[#6B7A6C]">Responded</p>
            <p className="mt-1 text-3xl font-bold">{loading ? "—" : respondedCount}</p>
          </div>
        </section>

        <div className="mb-6 flex gap-2 rounded-xl border border-[#E0E5D9] bg-white p-1.5">
          <button
            type="button"
            onClick={() => handleViewChange("received")}
            aria-pressed={view === "received"}
            className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold transition ${
              view === "received"
                ? "bg-[#17472D] text-white"
                : "text-[#68776A] hover:bg-[#F2F4EE]"
            }`}
          >
            Received
          </button>
          <button
            type="button"
            onClick={() => handleViewChange("sent")}
            aria-pressed={view === "sent"}
            className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold transition ${
              view === "sent"
                ? "bg-[#17472D] text-white"
                : "text-[#68776A] hover:bg-[#F2F4EE]"
            }`}
          >
            Sent
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {notice && (
          <div role="status" className="mb-5 rounded-xl border border-[#D7E5D1] bg-[#EDF5E9] p-4 text-sm text-[#24542E]">
            {notice}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-56 items-center justify-center rounded-2xl border border-[#E0E5D9] bg-white">
            <div className="flex items-center gap-3 text-sm text-[#68776A]">
              <LoaderCircle size={20} className="animate-spin" />
              Loading inquiries...
            </div>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#CCD8C7] bg-white px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF0E6] text-[#17472D]">
              <Inbox size={26} />
            </div>
            <h2 className="text-lg font-bold">No {view} inquiries yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#68776A]">
              {view === "received"
                ? "When someone contacts you about a listing, their inquiry will appear here."
                : "When you contact a seller from the marketplace, your inquiry will appear here."}
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#17472D] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#235C3B]"
            >
              Explore marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => {
              const personName = view === "received" ? inquiry.buyerName : inquiry.sellerName;
              const personEmail = view === "received" ? inquiry.buyerEmail : inquiry.sellerEmail;
              const isUpdating = updatingId === inquiry.id;

              return (
                <article key={inquiry.id} className="rounded-2xl border border-[#E0E5D9] bg-white p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          inquiry.status === "new"
                            ? "bg-[#FBF1D9] text-[#805B17]"
                            : inquiry.status === "responded"
                              ? "bg-[#EAF0E6] text-[#24542E]"
                              : "bg-[#EEF0EC] text-[#5D6B5E]"
                        }`}>
                          {inquiry.status}
                        </span>
                        <span className="text-xs text-[#7A887B]">{formatDate(inquiry.createdAt)}</span>
                      </div>
                      <h2 className="text-lg font-bold leading-snug">{inquiry.listingTitle}</h2>
                      <p className="mt-1 text-sm text-[#68776A]">
                        {view === "received" ? "From" : "To"}{" "}
                        <span className="font-semibold text-[#344C38]">{personName || "Marketplace user"}</span>
                        {personEmail ? ` · ${personEmail}` : ""}
                      </p>
                    </div>
                    <Link
                      href={`/products?listing=${encodeURIComponent(inquiry.listingId)}`}
                      className="shrink-0 text-sm font-semibold text-[#17472D] underline decoration-[#B8C7B2] underline-offset-4 hover:text-[#9A762C]"
                    >
                      View listing
                    </Link>
                  </div>

                  <div className="mt-5 rounded-xl bg-[#F7F8F3] p-4">
                    <p className="whitespace-pre-wrap text-sm leading-7 text-[#435746]">{inquiry.message}</p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {(() => {
                      const contactPhone = view === "received" ? inquiry.buyerPhone : inquiry.sellerPhone;
                      const contactLinks = getContactLinks(contactPhone, inquiry.listingTitle);

                      if (!contactLinks) {
                        return (
                          <p className="w-full text-xs text-[#879084]">
                            {view === "received"
                              ? "The buyer has not provided a phone number, so call, WhatsApp, and SMS are unavailable."
                              : "The seller's phone number is not available yet. The seller profile or inquiry API must provide it to enable call, WhatsApp, and SMS."}
                          </p>
                        );
                      }

                      return (
                        <>
                          <a href={contactLinks.tel} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#D9E1D5] px-4 py-2.5 text-sm font-semibold text-[#17472D] transition hover:bg-[#EDF2E9]">
                            <Phone size={16} />
                            Call {view === "received" ? "buyer" : "seller"}
                          </a>
                          <a href={contactLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#17472D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#235C3B]">
                            <MessageCircle size={16} />
                            WhatsApp
                          </a>
                          <a href={contactLinks.sms} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#D9E1D5] px-4 py-2.5 text-sm font-semibold text-[#17472D] transition hover:bg-[#EDF2E9]">
                            <Smartphone size={16} />
                            SMS
                          </a>
                        </>
                      );
                    })()}

                    {view === "received" && (
                      <>
                        {inquiry.status === "new" && (
                          <button
                            type="button"
                            onClick={() => void updateStatus(inquiry.id, "read")}
                            disabled={isUpdating}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#D9E1D5] px-4 py-2.5 text-sm font-semibold text-[#17472D] transition hover:bg-[#EDF2E9] disabled:opacity-60"
                          >
                            {isUpdating ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCheck size={16} />}
                            Mark as read
                          </button>
                        )}
                        {inquiry.status !== "responded" && (
                          <button
                            type="button"
                            onClick={() => void updateStatus(inquiry.id, "responded")}
                            disabled={isUpdating}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#17472D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#235C3B] disabled:opacity-60"
                          >
                            {isUpdating ? <LoaderCircle size={16} className="animate-spin" /> : <MessageCircle size={16} />}
                            Mark as responded
                          </button>
                        )}
                        {inquiry.buyerEmail && (
                          <a
                            href={`mailto:${inquiry.buyerEmail}?subject=${encodeURIComponent(`Regarding ${inquiry.listingTitle}`)}`}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#D9E1D5] px-4 py-2.5 text-sm font-semibold text-[#17472D] transition hover:bg-[#EDF2E9]"
                          >
                            <Send size={16} />
                            Email buyer
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
