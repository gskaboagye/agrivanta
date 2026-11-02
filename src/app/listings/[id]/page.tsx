"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  RefreshCw,
  Send,
  UserRound,
  X,
} from "lucide-react";

type Listing = {
  id: string;
  title: string;
  type: string;
  category: string;
  subcategory: string;
  specifications: Record<string, string | number | boolean>;
  description: string;
  price: number | string | null;
  priceUnit: string;
  location: string;
  seller: string;
  sellerProfileId?: string;
  image: string;
  images: string[];
  videos: string[];
  skills: string[];
  experience: string;
  availability: string;
  createdAt: string | null;
};

type Seller = {
  id: string;
  name: string;
  role: string;
  phone: string;
  phonePublic: boolean;
  whatsappEnabled: boolean;
  joinedAt: string | null;
};

type ListingResponse = {
  success?: boolean;
  listing?: Listing;
  message?: string;
};

type SellerResponse = {
  seller?: Seller;
};

function formatPrice(
  price: number | string | null,
  unit: string
): string {
  if (price === null || price === undefined || price === "") {
    return "Price to be confirmed";
  }

  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice)) {
    return `${price} ${unit || ""}`.trim();
  }

  return `GH\u20B5 ${numericPrice.toLocaleString("en-GH", {
    maximumFractionDigits: 2,
  })}${unit ? ` / ${unit}` : ""}`;
}

function formatDate(value: string | null): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-GH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatLabel(value: string): string {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function ListingDetailsContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const listingId = params.id;

  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState<"success" | "error">(
    "success"
  );

  const loadListing = useCallback(async () => {
    if (!listingId) {
      setError("The listing ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/listings/${encodeURIComponent(listingId)}`,
        { cache: "no-store" }
      );

      const data = (await response.json()) as ListingResponse;

      if (!response.ok || !data.listing) {
        throw new Error(
          data.message || "Unable to load this listing."
        );
      }

      setListing(data.listing);

      const images = [
        data.listing.image,
        ...(data.listing.images || []),
      ].filter(
        (image, index, array): image is string =>
          typeof image === "string" &&
          image.startsWith("https://") &&
          array.indexOf(image) === index
      );

      setSelectedImage(images[0] || "");

      if (data.listing.sellerProfileId) {
        try {
          const sellerResponse = await fetch(
            `/api/sellers/${encodeURIComponent(
              data.listing.sellerProfileId
            )}`,
            { cache: "no-store" }
          );

          const sellerData =
            (await sellerResponse.json()) as SellerResponse;

          if (sellerResponse.ok && sellerData.seller) {
            setSeller(sellerData.seller);
          }
        } catch (sellerError) {
          console.error(
            "Unable to load public seller details:",
            sellerError
          );
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong loading this listing."
      );
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void loadListing();
  }, [loadListing]);

  async function sendInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!listing) return;

    if (message.trim().length < 10) {
      setNoticeType("error");
      setNotice("Please enter a message of at least 10 characters.");
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
          listingId: listing.id,
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

      setMessage("");
      setNoticeType("success");
      setNotice("Your inquiry was sent successfully.");
    } catch (err) {
      setNoticeType("error");
      setNotice(
        err instanceof Error
          ? err.message
          : "Unable to send your inquiry."
      );
    } finally {
      setSending(false);
    }
  }

  const canCall =
    seller?.phonePublic === true &&
    Boolean(seller.phone?.trim());

  const canUseWhatsApp =
    canCall && seller?.whatsappEnabled === true;

  const whatsappNumber = canUseWhatsApp
    ? seller?.phone.replace(/\D/g, "") || ""
    : "";

  const images = listing
    ? [
        listing.image,
        ...(listing.images || []),
      ].filter(
        (image, index, array): image is string =>
          typeof image === "string" &&
          image.startsWith("https://") &&
          array.indexOf(image) === index
      )
    : [];

  if (loading) {
    return (
      <main className="flex min-h-[65vh] items-center justify-center bg-[#F8F6EE] px-4">
        <div className="flex items-center gap-3 text-[#17472D]">
          <LoaderCircle className="animate-spin" size={25} />
          <span className="font-medium">Loading listing details...</span>
        </div>
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className="min-h-[65vh] bg-[#F8F6EE] px-5 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#E2E8DC] bg-white p-8 text-center">
          <AlertCircle
            className="mx-auto mb-4 text-red-600"
            size={38}
          />

          <h1 className="text-2xl font-bold text-[#17472D]">
            Listing unavailable
          </h1>

          <p className="mt-3 text-gray-600">
            {error || "We could not find this listing."}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => void loadListing()}
              className="inline-flex items-center gap-2 rounded-lg border border-[#17472D] px-5 py-3 font-semibold text-[#17472D] hover:bg-[#EAF0E6]"
            >
              <RefreshCw size={17} />
              Try again
            </button>

            <button
              type="button"
              onClick={() => router.push("/marketplace")}
              className="rounded-lg bg-[#17472D] px-5 py-3 font-semibold text-white hover:bg-[#103720]"
            >
              Back to marketplace
            </button>
          </div>
        </div>
      </main>
    );
  }

  const createdDate = formatDate(listing.createdAt);

  return (
    <main className="min-h-screen bg-[#F8F6EE]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#17472D] hover:text-[#9B741F]"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {notice && (
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
                size={19}
                className="mt-0.5 shrink-0 text-[#17472D]"
              />
            ) : (
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0 text-red-600"
              />
            )}

            <p
              className={`flex-1 text-sm ${
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

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.35fr_0.85fr]">
          <section className="min-w-0">
            <div className="overflow-hidden rounded-3xl border border-[#E2E8DC] bg-white">
              <div className="flex aspect-[16/10] items-center justify-center bg-[#EAF0E6]">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center text-[#17472D]">
                    <Package
                      size={58}
                      className="mx-auto mb-3 opacity-60"
                    />
                    <p className="text-sm font-medium">
                      No listing image available
                    </p>
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto border-t border-[#E2E8DC] p-4">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      aria-label={`View image ${index + 1}`}
                      className={`h-20 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${
                        selectedImage === image
                          ? "border-[#17472D]"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${listing.title} ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 rounded-3xl border border-[#E2E8DC] bg-white p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                {listing.type && (
                  <span className="rounded-full bg-[#EAF0E6] px-3 py-1 text-xs font-semibold text-[#17472D]">
                    {formatLabel(listing.type)}
                  </span>
                )}

                {listing.category && (
                  <span className="rounded-full bg-[#FBF7E8] px-3 py-1 text-xs font-semibold text-[#89691E]">
                    {formatLabel(listing.category)}
                  </span>
                )}
              </div>

              <h1 className="mt-4 break-words text-3xl font-bold text-[#17472D] sm:text-4xl">
                {listing.title || "Untitled listing"}
              </h1>

              {listing.subcategory && (
                <p className="mt-2 text-sm text-[#647367]">
                  {formatLabel(listing.subcategory)}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-4 text-sm text-[#647367]">
                {listing.location && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin size={17} />
                    {listing.location}
                  </span>
                )}

                {createdDate && (
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays size={17} />
                    Listed {createdDate}
                  </span>
                )}
              </div>

              <div className="my-7 border-t border-[#E2E8DC]" />

              <h2 className="text-xl font-bold text-[#17472D]">
                Description
              </h2>

              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#647367]">
                {listing.description ||
                  "No additional description was provided."}
              </p>

              {listing.specifications &&
                Object.keys(listing.specifications).length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-xl font-bold text-[#17472D]">
                      Specifications
                    </h2>

                    <dl className="mt-4 divide-y divide-[#E2E8DC] rounded-xl border border-[#E2E8DC] px-4">
                      {Object.entries(listing.specifications).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="flex flex-wrap justify-between gap-3 py-3 text-sm"
                          >
                            <dt className="font-medium text-[#647367]">
                              {formatLabel(key)}
                            </dt>
                            <dd className="text-right font-semibold text-[#17472D]">
                              {String(value)}
                            </dd>
                          </div>
                        )
                      )}
                    </dl>
                  </div>
                )}

              {listing.skills?.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-[#17472D]">
                    Skills and services
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {listing.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-[#EAF0E6] px-3 py-2 text-sm text-[#17472D]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(listing.experience || listing.availability) && (
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {listing.experience && (
                    <div className="rounded-xl bg-[#F8F6EE] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#9B741F]">
                        Experience
                      </p>
                      <p className="mt-2 text-sm font-medium text-[#17472D]">
                        {listing.experience}
                      </p>
                    </div>
                  )}

                  {listing.availability && (
                    <div className="rounded-xl bg-[#F8F6EE] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#9B741F]">
                        Availability
                      </p>
                      <p className="mt-2 text-sm font-medium text-[#17472D]">
                        {listing.availability}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-[#E2E8DC] bg-white p-6">
              <p className="text-sm font-semibold text-[#9B741F]">
                Listing price
              </p>

              <p className="mt-2 break-words text-3xl font-bold text-[#17472D]">
                {formatPrice(listing.price, listing.priceUnit)}
              </p>

              <div className="mt-6 grid gap-3">
                {canCall && seller && (
                  <a
                    href={`tel:${seller.phone}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#17472D] px-5 py-3 font-semibold text-[#17472D] transition hover:bg-[#EAF0E6]"
                  >
                    <Phone size={18} />
                    Call seller
                  </a>
                )}

                {canUseWhatsApp && whatsappNumber && (
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17472D] px-5 py-3 font-semibold text-white transition hover:bg-[#103720]"
                  >
                    <MessageCircle size={18} />
                    Ask on WhatsApp
                  </a>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-[#E2E8DC] bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF0E6] text-[#17472D]">
                  <UserRound size={25} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9B741F]">
                    Listed by
                  </p>
                  <h2 className="break-words font-bold text-[#17472D]">
                    {seller?.name || listing.seller || "AgriVanta Seller"}
                  </h2>
                  {seller?.role && (
                    <p className="mt-1 text-xs text-[#647367]">
                      {formatLabel(seller.role)}
                    </p>
                  )}
                </div>
              </div>

              {seller?.id && (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/sellers/${encodeURIComponent(seller.id)}`
                    )
                  }
                  className="mt-5 w-full rounded-xl border border-[#17472D] px-4 py-3 text-sm font-semibold text-[#17472D] transition hover:bg-[#EAF0E6]"
                >
                  View seller profile
                </button>
              )}

              {!canCall && (
                <p className="mt-4 text-xs leading-5 text-[#647367]">
                  The seller has not made a public phone number available.
                  You can still send an inquiry below.
                </p>
              )}
            </section>

            <section className="rounded-3xl border border-[#E2E8DC] bg-white p-6">
              <h2 className="text-xl font-bold text-[#17472D]">
                Send an inquiry
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#647367]">
                Interested in this listing? Send the seller a message
                through AgriVanta.
              </p>

              {notice && (
                <div
                  role="status"
                  className={`mt-4 rounded-lg px-3 py-2 text-sm ${
                    noticeType === "success"
                      ? "bg-[#EAF0E6] text-[#17472D]"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {notice}
                </div>
              )}

              <form onSubmit={sendInquiry} className="mt-5">
                <label
                  htmlFor="listing-inquiry-message"
                  className="mb-2 block text-sm font-semibold text-[#17472D]"
                >
                  Your message
                </label>

                <textarea
                  id="listing-inquiry-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  minLength={10}
                  required
                  placeholder="Hello, I am interested in this listing. Please share more details..."
                  className="w-full resize-y rounded-xl border border-[#DCE4D8] bg-white px-4 py-3 text-sm text-[#26372C] outline-none transition placeholder:text-gray-400 focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
                />

                <p className="mt-2 text-xs text-[#647367]">
                  Minimum 10 characters.
                </p>

                <button
                  type="submit"
                  disabled={sending}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#17472D] px-5 py-3 font-semibold text-white transition hover:bg-[#103720] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : (
                    <Send size={17} />
                  )}
                  {sending ? "Sending..." : "Send inquiry"}
                </button>
              </form>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function ListingDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[65vh] items-center justify-center bg-[#F8F6EE] px-4">
          <div className="flex items-center gap-3 text-[#17472D]">
            <LoaderCircle className="animate-spin" size={25} />
            <span className="font-medium">
              Preparing listing details...
            </span>
          </div>
        </main>
      }
    >
      <ListingDetailsContent />
    </Suspense>
  );
}
