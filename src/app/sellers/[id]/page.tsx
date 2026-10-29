
"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Phone,
  MessageCircle,
  Package,
  LoaderCircle,
  AlertCircle,
  UserRound,
  CalendarDays,
  CheckCircle2,
  X,
  RefreshCw,
} from "lucide-react";

type Seller = {
  id: string;
  name: string;
  role: string;
  phone: string;
  phonePublic: boolean;
  whatsappEnabled: boolean;
  joinedAt: string | null;
};

type Listing = {
  id: string;
  title: string;
  category: string;
  description: string;
  price: number | string | null;
  priceUnit: string;
  location: string;
  image: string;
  images: string[];
  type?: string;
  listingType: string;
  createdAt: string | null;
};

type ProfileResponse = {
  success?: boolean;
  seller: Seller;
  listings: Listing[];
  count?: number;
};

function formatRole(role: string) {
  if (!role) return "Seller";

  return role
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatPrice(price: Listing["price"], unit: string) {
  if (
    price === null ||
    price === undefined ||
    price === ""
  ) {
    return "Contact for price";
  }

  const numericPrice = Number(price);

  const formatted = Number.isFinite(numericPrice)
    ? `GH₵ ${numericPrice.toLocaleString("en-GH", {
        maximumFractionDigits: 2,
      })}`
    : String(price);

  return unit ? `${formatted} / ${unit}` : formatted;
}

function getListingImage(listing: Listing) {
  if (listing.image) return listing.image;

  if (listing.images?.length) {
    return listing.images[0];
  }

  return "";
}

function formatMemberDate(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-GH", {
    month: "short",
    year: "numeric",
  });
}

function SellerProfileContent() {
  const params = useParams<{ id: string }>();
  const sellerId = params.id;

  const [profile, setProfile] =
    useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedListing, setSelectedListing] =
    useState<Listing | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] =
    useState<"success" | "error">("success");

  const loadProfile = useCallback(async () => {
    if (!sellerId) {
      setError("The seller ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/sellers/${encodeURIComponent(sellerId)}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load this seller."
        );
      }

      if (!data.seller || !Array.isArray(data.listings)) {
        throw new Error(
          "The server returned an unexpected seller profile."
        );
      }

      setProfile(data as ProfileResponse);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong loading this profile."
      );
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function sendInquiry(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedListing) {
      setNoticeType("error");
      setNotice("Please select a listing first.");
      return;
    }

    if (message.trim().length < 10) {
      setNoticeType("error");
      setNotice(
        "Please enter a message of at least 10 characters."
      );
      return;
    }

    setSending(true);
    setNotice("");

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId: selectedListing.id,
          message: message.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Unable to send your inquiry."
        );
      }

      setSelectedListing(null);
      setMessage("");
      setNoticeType("success");
      setNotice(
        "Your inquiry was sent successfully."
      );
    } catch (err) {
      setNoticeType("error");
      setNotice(
        err instanceof Error
          ? err.message
          : "Unable to send your inquiry. Please try again."
      );
    } finally {
      setSending(false);
    }
  }

  function openInquiry(listing: Listing) {
    setSelectedListing(listing);
    setMessage("");
    setNotice("");
  }

  function closeInquiry() {
    if (sending) return;

    setSelectedListing(null);
    setMessage("");
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#F8F6EE] px-4">
        <div className="flex items-center gap-3 text-[#17472D]">
          <LoaderCircle
            className="animate-spin"
            size={24}
          />
          <span className="font-medium">
            Loading seller profile...
          </span>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-[60vh] bg-[#F8F6EE] px-5 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-8 text-center">
          <AlertCircle
            className="mx-auto mb-4 text-red-600"
            size={36}
          />

          <h1 className="text-2xl font-bold text-[#17472D]">
            Seller profile unavailable
          </h1>

          <p className="mt-3 text-gray-600">
            {error || "We could not find this seller."}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => void loadProfile()}
              className="inline-flex items-center gap-2 rounded-lg border border-[#17472D] px-5 py-3 font-semibold text-[#17472D] hover:bg-[#EAF0E6]"
            >
              <RefreshCw size={18} />
              Try again
            </button>

            <a
              href="/products"
              className="inline-flex items-center gap-2 rounded-lg bg-[#17472D] px-5 py-3 font-semibold text-white hover:bg-[#103720]"
            >
              <ArrowLeft size={18} />
              Back to marketplace
            </a>
          </div>
        </div>
      </main>
    );
  }

  const { seller, listings } = profile;

  const locations = Array.from(
    new Set(
      listings
        .map((item) => item.location)
        .filter(Boolean)
    )
  );

  const canCall = seller.phonePublic === true && Boolean(seller.phone?.trim());
  const canUseWhatsApp =
    canCall && seller.whatsappEnabled === true;
  const whatsappNumber = canUseWhatsApp
    ? (seller.phone || "").replace(/\D/g, "")
    : "";

  const memberDate = formatMemberDate(seller.joinedAt);

  return (
    <main className="min-h-screen bg-[#F8F6EE]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <a
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#17472D] hover:text-[#9B741F]"
        >
          <ArrowLeft size={18} />
          Back to marketplace
        </a>

        {/* Inquiry feedback remains visible after the modal closes. */}
        {notice && !selectedListing && (
          <div
            role="status"
            aria-live="polite"
            className={`mt-5 flex items-start gap-3 rounded-xl border bg-white px-4 py-3 ${
              noticeType === "success"
                ? "border-[#C9D4C4]"
                : "border-red-200"
            }`}
          >
            {noticeType === "success" ? (
              <CheckCircle2
                size={20}
                className="mt-0.5 shrink-0 text-[#17472D]"
              />
            ) : (
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-red-600"
              />
            )}

            <p
              className={`flex-1 text-sm font-medium ${
                noticeType === "success"
                  ? "text-[#17472D]"
                  : "text-red-700"
              }`}
            >
              {notice}
            </p>

            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
              className="rounded p-1 text-gray-500 hover:bg-gray-100"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Seller information */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-[#E2E8DC] bg-white shadow-sm">
          <div className="h-3 bg-[#17472D]" />

          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div className="flex items-start gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#EAF0E6] text-[#17472D]">
                <UserRound size={38} />
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9B741F]">
                  Seller profile
                </p>

                <h1 className="mt-2 break-words text-3xl font-bold text-[#17472D] sm:text-4xl">
                  {seller.name || "AgriVanta Seller"}
                </h1>

                <p className="mt-2 text-[#647367]">
                  {formatRole(seller.role)}
                </p>

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#647367]">
                  {locations.length > 0 && (
                    <span className="flex items-center gap-2">
                      <MapPin size={16} />
                      {locations.slice(0, 2).join(" · ")}
                    </span>
                  )}

                  {memberDate && (
                    <span className="flex items-center gap-2">
                      <CalendarDays size={16} />
                      Member since {memberDate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {canCall && (
              <div className="flex flex-wrap gap-3">
                <a
                  href={`tel:${seller.phone}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#17472D] px-5 py-3 font-semibold text-[#17472D] hover:bg-[#EAF0E6]"
                >
                  <Phone size={18} />
                  Call seller
                </a>

                {canUseWhatsApp && whatsappNumber && (
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17472D] px-5 py-3 font-semibold text-white hover:bg-[#103720]"
                  >
                    <MessageCircle size={18} />
                    WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Seller listings */}
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#9B741F]">
                Marketplace
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#17472D] sm:text-3xl">
                Listings by {seller.name || "this seller"}
              </h2>
            </div>

            <p className="text-sm text-[#647367]">
              {listings.length}{" "}
              {listings.length === 1
                ? "listing"
                : "listings"}
            </p>
          </div>

          {listings.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[#C9D4C4] bg-white px-6 py-14 text-center">
              <Package
                className="mx-auto text-[#647367]"
                size={38}
              />

              <h3 className="mt-4 text-xl font-semibold text-[#17472D]">
                No active listings yet
              </h3>

              <p className="mt-2 text-[#647367]">
                This seller has not published any active
                listings.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => {
                const image = getListingImage(listing);

                return (
                  <article
                    key={listing.id}
                    className="overflow-hidden rounded-2xl border border-[#E2E8DC] bg-white transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="aspect-[4/3] bg-[#EAF0E6]">
                      {image ? (
                        <img
                          src={image}
                          alt={listing.title || "Seller listing"}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[#647367]">
                          <Package size={42} />
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      {listing.category && (
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#9B741F]">
                          {listing.category}
                        </p>
                      )}

                      <h3 className="mt-2 break-words text-lg font-bold text-[#17472D]">
                        {listing.title || "Untitled listing"}
                      </h3>

                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#647367]">
                        {listing.description ||
                          "Contact the seller for details."}
                      </p>

                      {listing.location && (
                        <p className="mt-3 flex items-center gap-2 text-sm text-[#647367]">
                          <MapPin size={15} />
                          {listing.location}
                        </p>
                      )}

                      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#E2E8DC] pt-4">
                        <p className="break-words font-bold text-[#17472D]">
                          {formatPrice(
                            listing.price,
                            listing.priceUnit
                          )}
                        </p>

                        <button
                          type="button"
                          onClick={() => openInquiry(listing)}
                          className="shrink-0 rounded-lg bg-[#17472D] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#103720]"
                        >
                          Contact seller
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Inquiry modal */}
      {selectedListing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !sending
            ) {
              closeInquiry();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="inquiry-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id="inquiry-title"
                className="text-2xl font-bold text-[#17472D]"
              >
                Contact seller
              </h2>

              <button
                type="button"
                onClick={closeInquiry}
                disabled={sending}
                aria-label="Close inquiry form"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mt-2 text-sm text-[#647367]">
              About: {selectedListing.title}
            </p>

            <form
              onSubmit={sendInquiry}
              className="mt-5 space-y-4"
            >
              <label
                htmlFor="seller-message"
                className="block text-sm font-semibold text-[#17472D]"
              >
                Your message
              </label>

              <textarea
                id="seller-message"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                minLength={10}
                maxLength={3000}
                required
                rows={5}
                placeholder="Introduce yourself and explain what you would like to know..."
                className="w-full rounded-xl border border-[#C9D4C4] px-4 py-3 outline-none focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/15"
              />

              <p className="text-right text-xs text-[#647367]">
                {message.length}/3000 characters
              </p>

              {notice && (
                <p
                  role="status"
                  aria-live="polite"
                  className={`text-sm ${
                    noticeType === "success"
                      ? "text-[#17472D]"
                      : "text-red-700"
                  }`}
                >
                  {notice}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={sending}
                  onClick={closeInquiry}
                  className="rounded-lg border border-[#C9D4C4] px-4 py-2.5 font-semibold text-[#17472D] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    sending || message.trim().length < 10
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-[#17472D] px-5 py-2.5 font-semibold text-white hover:bg-[#103720] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending && (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  )}
                  {sending
                    ? "Sending..."
                    : "Send inquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default function SellerProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[60vh] items-center justify-center bg-[#F8F6EE]">
          <div className="flex items-center gap-3 font-medium text-[#17472D]">
            <LoaderCircle
              size={22}
              className="animate-spin"
            />
            Loading seller profile...
          </div>
        </main>
      }
    >
      <SellerProfileContent />
    </Suspense>
  );
}
