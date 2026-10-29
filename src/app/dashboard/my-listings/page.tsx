
"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileVideo,
  ImagePlus,
  LoaderCircle,
  Package,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  Video,
  X,
} from "lucide-react";

type MediaAsset = {
  secure_url?: string;
  url?: string;
  public_id?: string;
  resource_type?: string;
  type?: "image" | "video";
  originalName?: string;
  width?: number;
  height?: number;
  duration?: number;
};

type Listing = {
  id: string;
  title: string;
  type: string;
  category: string;
  subcategory?: string;
  specifications?: Record<string, unknown>;
  description: string;
  location: string;
  price: number | string;
  priceUnit: string;
  image: string;
  images?: string[];
  videos?: string[];
  media?: MediaAsset[];
  status: string;
  createdAt?: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  listings?: Listing[];
  media?: MediaAsset;
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_MEDIA_FILES = 8;

function mediaUrl(item: MediaAsset) {
  return item.secure_url || item.url || "";
}

function getListingMedia(listing: Listing): MediaAsset[] {
  if (listing.media?.length) {
    return listing.media.filter((item) => mediaUrl(item));
  }

  const images = [
    ...(listing.image ? [listing.image] : []),
    ...(listing.images ?? []),
  ];

  const uniqueImages = [...new Set(images)];

  return [
    ...uniqueImages.map((url) => ({
      secure_url: url,
      type: "image" as const,
      resource_type: "image",
    })),
    ...(listing.videos ?? []).map((url) => ({
      secure_url: url,
      type: "video" as const,
      resource_type: "video",
    })),
  ];
}

export default function MyListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState("");
  const [editing, setEditing] = useState<Listing | null>(null);
  const [specificationsText, setSpecificationsText] = useState("{}");
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/listings/mine", {
        credentials: "same-origin",
        cache: "no-store",
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load your listings.");
      }

      setListings(data.listings ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load your listings."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  function openEditor(listing: Listing) {
    setError("");
    setNotice("");
    setUploadError("");
    setUploadMessage("");
    setSpecificationsText(JSON.stringify(listing.specifications ?? {}, null, 2));
    setEditing({
      ...listing,
      subcategory: listing.subcategory ?? "",
      specifications: listing.specifications ?? {},
      media: getListingMedia(listing),
    });
  }

  async function uploadFiles(files: FileList | File[]) {
    if (!editing || files.length === 0) return;

    const selectedFiles = Array.from(files);

    if (getListingMedia(editing).length + selectedFiles.length > MAX_MEDIA_FILES) {
      setUploadError(`You can attach up to ${MAX_MEDIA_FILES} media files.`);
      return;
    }

    for (const file of selectedFiles) {
      const image = ["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
        file.type
      );
      const video = ["video/mp4", "video/webm", "video/quicktime"].includes(
        file.type
      );

      if (!image && !video) {
        setUploadError(`${file.name}: Use JPG, PNG, WEBP, AVIF, MP4, WEBM, or MOV.`);
        return;
      }

      if (image && file.size > MAX_IMAGE_SIZE) {
        setUploadError(`${file.name}: Images must be 10 MB or smaller.`);
        return;
      }

      if (video && file.size > MAX_VIDEO_SIZE) {
        setUploadError(`${file.name}: Videos must be 50 MB or smaller.`);
        return;
      }
    }

    setUploading(true);
    setUploadError("");
    setUploadMessage(`Uploading ${selectedFiles.length} file(s)...`);

    try {
      const uploadedAssets: MediaAsset[] = [];

      for (let index = 0; index < selectedFiles.length; index++) {
        const file = selectedFiles[index];
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/uploads", {
          method: "POST",
          credentials: "same-origin",
          body: formData,
        });

        const data = (await response.json()) as ApiResponse;

        if (!response.ok || !data.media) {
          throw new Error(
            data.error || data.message || `Failed to upload ${file.name}.`
          );
        }

        uploadedAssets.push({
          ...data.media,
          type: data.media.type ?? (
            file.type.startsWith("video/") ? "video" : "image"
          ),
        });

        setUploadMessage(
          `Uploaded ${index + 1} of ${selectedFiles.length} file(s)...`
        );
      }

      setEditing((current) => {
        if (!current) return current;

        const currentMedia = getListingMedia(current);
        const media = [...currentMedia, ...uploadedAssets];
        const images = media
          .filter((item) => item.type !== "video" && item.resource_type !== "video")
          .map(mediaUrl)
          .filter(Boolean);
        const videos = media
          .filter((item) => item.type === "video" || item.resource_type === "video")
          .map(mediaUrl)
          .filter(Boolean);

        return {
          ...current,
          media,
          images,
          videos,
          image: images[0] || "",
        };
      });

      setUploadMessage("Upload complete. Save your listing to keep the changes.");
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Unable to upload your files."
      );
      setUploadMessage("");
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function removeMedia(indexToRemove: number) {
    if (!editing) return;

    const media = getListingMedia(editing).filter(
      (_, index) => index !== indexToRemove
    );

    const images = media
      .filter((item) => item.type !== "video" && item.resource_type !== "video")
      .map(mediaUrl)
      .filter(Boolean);

    const videos = media
      .filter((item) => item.type === "video" || item.resource_type === "video")
      .map(mediaUrl)
      .filter(Boolean);

    setEditing({
      ...editing,
      media,
      images,
      videos,
      image: images[0] || "",
    });
  }

  async function deleteListing(listing: Listing) {
    const confirmed = window.confirm(
      `Delete "${listing.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setBusyId(listing.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/listings/${listing.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete this listing.");
      }

      setListings((current) =>
        current.filter((item) => item.id !== listing.id)
      );
      setNotice("Listing deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete listing."
      );
    } finally {
      setBusyId("");
    }
  }

  async function saveListing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;

    setBusyId(editing.id);
    setError("");
    setNotice("");

    let parsedSpecifications: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(specificationsText || "{}") as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Specifications must be a JSON object.");
      }
      parsedSpecifications = parsed as Record<string, unknown>;
    } catch {
      setError("Specifications must be valid JSON in an object format, for example: {\"capacity\": \"100 kg\"}.");
      return;
    }

    const media = getListingMedia(editing);
    const images = media
      .filter((item) => item.type !== "video" && item.resource_type !== "video")
      .map(mediaUrl)
      .filter(Boolean);
    const videos = media
      .filter((item) => item.type === "video" || item.resource_type === "video")
      .map(mediaUrl)
      .filter(Boolean);

    try {
      const response = await fetch(`/api/listings/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          title: editing.title,
          category: editing.category,
          subcategory: (editing.subcategory ?? "").trim(),
          specifications: parsedSpecifications,
          description: editing.description,
          location: editing.location,
          price: Number(editing.price),
          priceUnit: editing.priceUnit,
          image: images[0] || "",
          images,
          videos,
          media,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update this listing.");
      }

      setListings((current) =>
        current.map((item) =>
          item.id === editing.id
            ? { ...editing, subcategory: (editing.subcategory ?? "").trim(), specifications: parsedSpecifications, image: images[0] || "", images, videos, media }
            : item
        )
      );

      setEditing(null);
      setNotice("Listing updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update this listing."
      );
    } finally {
      setBusyId("");
    }
  }

  const filtered = listings.filter((listing) => {
    const value = query.trim().toLowerCase();

    return (
      !value ||
      listing.title.toLowerCase().includes(value) ||
      listing.category.toLowerCase().includes(value) ||
      (listing.subcategory ?? "").toLowerCase().includes(value) ||
      listing.location.toLowerCase().includes(value)
    );
  });

  return (
    <main className="min-h-screen bg-[#F7F8F4] px-4 py-8 text-[#243629] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#17472D] hover:underline"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <header className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a8450]">
              Your workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#17472D]">
              My Listings
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#758071]">
              Manage the agricultural products and services connected to your account.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17472D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#103921]"
          >
            <Package size={17} />
            Marketplace
          </Link>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e5e9e0] bg-white p-5">
            <p className="text-xs text-[#879084]">Total listings</p>
            <p className="mt-2 text-3xl font-bold text-[#17472D]">{listings.length}</p>
          </div>
          <div className="rounded-2xl border border-[#e5e9e0] bg-white p-5">
            <p className="text-xs text-[#879084]">Active</p>
            <p className="mt-2 text-3xl font-bold text-[#17472D]">
              {listings.filter((item) => item.status === "active").length}
            </p>
          </div>
          <div className="rounded-2xl border border-[#e5e9e0] bg-white p-5">
            <p className="text-xs text-[#879084]">Listing types</p>
            <p className="mt-2 text-3xl font-bold text-[#17472D]">
              {new Set(listings.map((item) => item.type)).size}
            </p>
          </div>
        </section>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <label className="flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-[#e1e7dc] bg-white px-3">
            <Search size={17} className="text-[#879084]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your listings"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#9ba396]"
            />
          </label>

          <button
            type="button"
            onClick={() => void loadListings()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e1e7dc] bg-white px-4 py-3 text-sm font-semibold text-[#17472D] hover:bg-[#f1f5ed] disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {notice && (
          <p className="mt-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <CheckCircle2 size={17} />
            {notice}
          </p>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-[#758071]">
            <LoaderCircle className="animate-spin" size={20} />
            Loading your listings...
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[#dce3d6] bg-white px-5 py-16 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF0E6] text-[#17472D]">
              <Package size={26} />
            </span>
            <h2 className="mt-4 text-lg font-bold text-[#17472D]">
              {query ? "No matching listings" : "No listings found"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#879084]">
              {query
                ? "Try a different search term."
                : "When your account has listings associated with it, they will appear here."}
            </p>
            <Link
              href="/products"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#17472D] px-4 py-3 text-sm font-semibold text-white hover:bg-[#103921]"
            >
              Browse marketplace <ExternalLink size={15} />
            </Link>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-[#e5e9e0] bg-white">
            <div className="divide-y divide-[#edf0e9]">
              {filtered.map((listing) => {
                const media = getListingMedia(listing);
                const preview = media[0];

                return (
                  <article
                    key={listing.id}
                    className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5"
                  >
                    <div className="flex h-20 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#EAF0E6] sm:w-24">
                      {preview && (preview.type === "video" || preview.resource_type === "video") ? (
                        <span className="flex flex-col items-center gap-1 text-[#17472D]">
                          <FileVideo size={27} />
                          <span className="text-[10px] font-semibold">Video</span>
                        </span>
                      ) : listing.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={listing.image}
                          alt={listing.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package size={25} className="text-[#17472D]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="break-words text-sm font-bold text-[#26372b]">
                          {listing.title}
                        </h2>
                        <span className="rounded-full bg-[#EAF0E6] px-2 py-1 text-[10px] font-semibold capitalize text-[#17472D]">
                          {listing.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#879084]">
                        {listing.category}{listing.subcategory ? ` / ${listing.subcategory}` : ""} · {listing.location} · {listing.type}
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#697568]">
                        {listing.description}
                      </p>
                      <p className="mt-2 text-xs font-bold text-[#17472D]">
                        {typeof listing.price === "number"
                          ? listing.price.toLocaleString("en-GH")
                          : listing.price}{" "}
                        {listing.priceUnit}
                      </p>
                      {media.length > 0 && (
                        <p className="mt-1 text-xs text-[#879084]">
                          {media.filter((item) => item.type !== "video" && item.resource_type !== "video").length} image(s)
                          {" · "}
                          {media.filter((item) => item.type === "video" || item.resource_type === "video").length} video(s)
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-2 sm:flex-col">
                      <button
                        type="button"
                        onClick={() => openEditor(listing)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e1e7dc] px-3 py-2 text-xs font-semibold text-[#17472D] hover:bg-[#f1f5ed]"
                      >
                        <Pencil size={14} />
                        Edit / Media
                      </button>
                      <button
                        type="button"
                        disabled={busyId === listing.id}
                        onClick={() => void deleteListing(listing)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        {busyId === listing.id ? (
                          <LoaderCircle size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-5">
            <form
              onSubmit={saveListing}
              className="my-5 max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#17472D]">Edit listing</h2>
                  <p className="mt-1 text-xs text-[#879084]">
                    Update details and manage your product photos and videos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  disabled={uploading || busyId === editing.id}
                  aria-label="Close editor"
                  className="rounded-lg p-2 text-[#526252] hover:bg-[#f1f5ed]"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["title", "Title"],
                    ["category", "Category"],
                    ["subcategory", "Subcategory"],
                    ["location", "Location"],
                    ["price", "Price"],
                    ["priceUnit", "Price unit"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-[#526252]">
                      {label}
                    </span>
                    <input
                      required
                      type={key === "price" ? "number" : "text"}
                      min={key === "price" ? 0 : undefined}
                      step={key === "price" ? "any" : undefined}
                      value={String(editing[key] ?? "")}
                      onChange={(event) =>
                        setEditing((current) =>
                          current
                            ? { ...current, [key]: event.target.value }
                            : current
                        )
                      }
                      className="w-full rounded-xl border border-[#e1e7dc] px-3 py-2.5 text-sm outline-none focus:border-[#17472D]"
                    />
                  </label>
                ))}
              </div>

              <section className="mt-4 rounded-xl border border-[#e1e7dc] bg-[#fbfcf9] p-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-[#526252]">
                    Agricultural specifications (JSON)
                  </span>
                  <p className="mb-2 text-xs leading-5 text-[#879084]">
                    Edit the technical details for this listing. Keep the information inside a JSON object. Use double quotes around property names and text values.
                  </p>
                  <textarea
                    rows={6}
                    spellCheck={false}
                    value={specificationsText}
                    onChange={(event) => setSpecificationsText(event.target.value)}
                    placeholder={'{\n  "capacity": "100 kg",\n  "material": "Steel"\n}'}
                    className="w-full rounded-xl border border-[#e1e7dc] bg-white px-3 py-2.5 font-mono text-xs outline-none focus:border-[#17472D]"
                  />
                </label>
              </section>

              <label className="mt-4 block">
                <span className="mb-1.5 block text-xs font-semibold text-[#526252]">
                  Description
                </span>
                <textarea
                  required
                  rows={4}
                  value={editing.description}
                  onChange={(event) =>
                    setEditing((current) =>
                      current
                        ? { ...current, description: event.target.value }
                        : current
                    )
                  }
                  className="w-full rounded-xl border border-[#e1e7dc] px-3 py-2.5 text-sm outline-none focus:border-[#17472D]"
                />
              </label>

              <section className="mt-6 rounded-2xl border border-[#e1e7dc] p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-[#17472D]">
                      <ImagePlus size={18} />
                      Product photos and videos
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-[#879084]">
                      Up to {MAX_MEDIA_FILES} files. Images up to 10 MB; videos up to 50 MB.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={uploading || getListingMedia(editing).length >= MAX_MEDIA_FILES}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#17472D] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#103921] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploading ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      <UploadCloud size={16} />
                    )}
                    {uploading ? "Uploading..." : "Upload media"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      if (event.target.files) {
                        void uploadFiles(event.target.files);
                      }
                    }}
                  />
                </div>

                <p className="mt-3 text-xs text-[#879084]">
                  Supported: JPG, PNG, WEBP, AVIF, MP4, WEBM and MOV.
                </p>

                {uploading && (
                  <p className="mt-3 flex items-center gap-2 text-xs font-medium text-[#17472D]">
                    <LoaderCircle size={15} className="animate-spin" />
                    {uploadMessage}
                  </p>
                )}

                {!uploading && uploadMessage && (
                  <p className="mt-3 text-xs font-medium text-[#17472D]">
                    {uploadMessage}
                  </p>
                )}

                {uploadError && (
                  <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                    {uploadError}
                  </p>
                )}

                {getListingMedia(editing).length > 0 ? (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {getListingMedia(editing).map((item, index) => {
                      const url = mediaUrl(item);
                      const isVideo =
                        item.type === "video" || item.resource_type === "video";

                      return (
                        <div
                          key={`${url}-${index}`}
                          className="overflow-hidden rounded-xl border border-[#e1e7dc] bg-[#F7F8F4]"
                        >
                          <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-[#EAF0E6]">
                            {isVideo ? (
                              <div className="flex flex-col items-center gap-2 px-2 text-center text-[#17472D]">
                                <Video size={28} />
                                <span className="text-xs font-semibold">Video uploaded</span>
                              </div>
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={url}
                                alt={`Listing media ${index + 1}`}
                                className="h-full w-full object-cover"
                              />
                            )}
                            <button
                              type="button"
                              disabled={uploading || busyId === editing.id}
                              onClick={() => removeMedia(index)}
                              aria-label={`Remove media ${index + 1}`}
                              className="absolute right-2 top-2 rounded-full bg-white/95 p-1.5 text-red-700 shadow hover:bg-red-50 disabled:opacity-50"
                            >
                              <X size={15} />
                            </button>
                          </div>
                          <p className="truncate px-2 py-2 text-[10px] text-[#697568]">
                            {item.originalName || (isVideo ? "Video" : `Image ${index + 1}`)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-[#dce3d6] px-4 py-8 text-center">
                    <ImagePlus className="mx-auto text-[#879084]" size={26} />
                    <p className="mt-2 text-sm font-semibold text-[#526252]">
                      No media attached
                    </p>
                    <p className="mt-1 text-xs text-[#879084]">
                      Upload clear photos to help buyers understand your product.
                    </p>
                  </div>
                )}
              </section>

              <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  disabled={uploading || busyId === editing.id}
                  className="rounded-xl border border-[#e1e7dc] px-4 py-2.5 text-sm font-semibold text-[#526252] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || busyId === editing.id}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17472D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#103921] disabled:opacity-50"
                >
                  {busyId === editing.id && (
                    <LoaderCircle size={15} className="animate-spin" />
                  )}
                  Save listing
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
