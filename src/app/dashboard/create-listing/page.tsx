
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  Package,
  Tractor,
  UploadCloud,
  X,
} from "lucide-react";

type ListingType = "product" | "hire";

type MediaAsset = {
  secure_url?: string;
  url?: string;
  public_id?: string;
  resource_type?: "image" | "video";
  type?: "image" | "video";
  originalName?: string;
  width?: number;
  height?: number;
  duration?: number;
};

const MAX_FILES = 8;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

export default function CreateListingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<ListingType>("product");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState("per unit");
  const [location, setLocation] = useState("");
  const [specificationsText, setSpecificationsText] = useState("{}");

  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const imageCount = media.filter(
    (item) => item.type !== "video" && item.resource_type !== "video"
  ).length;

  const videoCount = media.filter(
    (item) => item.type === "video" || item.resource_type === "video"
  ).length;

  function mediaUrl(item: MediaAsset) {
    return item.secure_url || item.url || "";
  }

  async function uploadFiles(files: FileList | File[]) {
    const selected = Array.from(files);

    if (!selected.length) return;

    if (media.length + selected.length > MAX_FILES) {
      setUploadError(`You can attach a maximum of ${MAX_FILES} files.`);
      return;
    }

    const newImages = selected.filter((file) =>
      ["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)
    );

    const newVideos = selected.filter((file) =>
      ["video/mp4", "video/webm", "video/quicktime"].includes(file.type)
    );

    if (newImages.length + newVideos.length !== selected.length) {
      setUploadError("Use JPG, PNG, WEBP, AVIF, MP4, WEBM or MOV files.");
      return;
    }

    if (imageCount + newImages.length > 8) {
      setUploadError("You can upload up to 8 images.");
      return;
    }

    if (videoCount + newVideos.length > 2) {
      setUploadError("You can upload up to 2 videos.");
      return;
    }

    for (const file of selected) {
      if (file.type.startsWith("image/") && file.size > MAX_IMAGE_SIZE) {
        setUploadError(`${file.name} exceeds the 10 MB image limit.`);
        return;
      }

      if (file.type.startsWith("video/") && file.size > MAX_VIDEO_SIZE) {
        setUploadError(`${file.name} exceeds the 50 MB video limit.`);
        return;
      }
    }

    setUploading(true);
    setUploadError("");
    setUploadMessage(`Uploading ${selected.length} file(s)...`);

    try {
      const uploaded: MediaAsset[] = [];

      for (let index = 0; index < selected.length; index++) {
        const file = selected[index];
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/uploads", {
          method: "POST",
          credentials: "same-origin",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok || !data.media) {
          throw new Error(
            data.error || data.message || `Unable to upload ${file.name}.`
          );
        }

        const asset: MediaAsset = {
          ...data.media,
          type: data.media.type || (
            file.type.startsWith("video/") ? "video" : "image"
          ),
          resource_type: data.media.resource_type || (
            file.type.startsWith("video/") ? "video" : "image"
          ),
          originalName: data.media.originalName || file.name,
        };

        if (!asset.secure_url || !asset.resource_type) {
          throw new Error(`The upload response for ${file.name} is incomplete.`);
        }

        uploaded.push(asset);
        setUploadMessage(
          `Uploaded ${index + 1} of ${selected.length} file(s)...`
        );
      }

      setMedia((current) => [...current, ...uploaded]);
      setUploadMessage("All files uploaded successfully.");
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Unable to upload files."
      );
      setUploadMessage("");
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function removeMedia(index: number) {
    setMedia((current) => current.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (uploading) {
      setError("Please wait for your uploads to finish.");
      return;
    }

    const images = media
      .filter((item) => item.type !== "video" && item.resource_type !== "video")
      .map(mediaUrl)
      .filter(Boolean);

    const videos = media
      .filter((item) => item.type === "video" || item.resource_type === "video")
      .map(mediaUrl)
      .filter(Boolean);

    if (images.length === 0) {
      setError("Please upload at least one image for your listing.");
      return;
    }

    let specifications: Record<string, unknown>;

    try {
      const parsed: unknown = JSON.parse(specificationsText || "{}");

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Specifications must be a JSON object.");
      }

      specifications = parsed as Record<string, unknown>;
    } catch {
      setError(
        'Specifications must be valid JSON. For example: {"quantity": "100 kg"}.'
      );
      return;
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setError("Please enter a valid price.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          title: title.trim(),
          type,
          category: category.trim(),
          subcategory: subcategory.trim(),
          description: description.trim(),
          price: numericPrice,
          priceUnit: priceUnit.trim(),
          location: location.trim(),
          specifications,
          image: images[0],
          images,
          videos,
          media,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to create your listing.");
      }

      setSuccess("Your listing has been published successfully.");

      window.setTimeout(() => {
        router.push("/dashboard/my-listings");
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-[#DCE3D6] bg-white px-4 py-3 text-sm text-[#243629] outline-none focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10";

  return (
    <main className="min-h-screen bg-[#F7F8F4] px-4 py-8 text-[#243629] sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#17472D] hover:underline"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>

        <header className="mb-8 mt-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#9A8450]">
            AgriVanta Marketplace
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-[#17472D]">
            Create a listing
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#758071]">
            Showcase your agricultural products or make your farm equipment
            available for hire.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-7 rounded-2xl border border-[#E5E9E0] bg-white p-5 shadow-sm sm:p-8"
        >
          <section>
            <h2 className="text-lg font-bold text-[#17472D]">
              What would you like to list?
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setType("product")}
                className={`rounded-xl border-2 p-5 text-left transition ${
                  type === "product"
                    ? "border-[#17472D] bg-[#F0F5ED]"
                    : "border-[#E5E9E0] hover:border-[#9BAC96]"
                }`}
              >
                <Package size={25} className="text-[#17472D]" />
                <span className="mt-3 block font-bold">Products for sale</span>
                <span className="mt-1 block text-xs leading-5 text-[#758071]">
                  Crops, vegetables, fruits, livestock and other farm produce.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setType("hire")}
                className={`rounded-xl border-2 p-5 text-left transition ${
                  type === "hire"
                    ? "border-[#17472D] bg-[#F0F5ED]"
                    : "border-[#E5E9E0] hover:border-[#9BAC96]"
                }`}
              >
                <Tractor size={25} className="text-[#17472D]" />
                <span className="mt-3 block font-bold">Equipment for hire</span>
                <span className="mt-1 block text-xs leading-5 text-[#758071]">
                  Tractors, harvesters, irrigation equipment and machinery.
                </span>
              </button>
            </div>
          </section>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Listing title *
              <input
                required
                maxLength={120}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={
                  type === "product"
                    ? "e.g. Fresh maize for sale"
                    : "e.g. Tractor available for hire"
                }
                className={inputClass}
              />
            </label>

            <label className="text-sm font-semibold">
              Category *
              <input
                required
                maxLength={80}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder={
                  type === "product"
                    ? "e.g. Grains, Vegetables, Livestock"
                    : "e.g. Tractors, Harvesters, Irrigation"
                }
                className={inputClass}
              />
            </label>

            <label className="text-sm font-semibold">
              Subcategory
              <input
                maxLength={100}
                value={subcategory}
                onChange={(event) => setSubcategory(event.target.value)}
                placeholder="Optional"
                className={inputClass}
              />
            </label>

            <label className="text-sm font-semibold">
              Location *
              <input
                required
                maxLength={120}
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="e.g. Kwabenya, Accra"
                className={inputClass}
              />
            </label>

            <label className="text-sm font-semibold">
              Price (GH₵) *
              <input
                required
                type="number"
                min="0"
                max="1000000000"
                step="any"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="Enter your price"
                className={inputClass}
              />
            </label>

            <label className="text-sm font-semibold">
              Price unit *
              <select
                required
                value={priceUnit}
                onChange={(event) => setPriceUnit(event.target.value)}
                className={inputClass}
              >
                {(
                  type === "product"
                    ? [
                        "per unit",
                        "per kg",
                        "per bag",
                        "per crate",
                        "per basket",
                        "per tonne",
                        "per animal",
                        "negotiable",
                      ]
                    : [
                        "per hour",
                        "per day",
                        "per week",
                        "per month",
                        "per acre",
                        "per project",
                        "negotiable",
                      ]
                ).map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <section>
            <label className="text-sm font-semibold">
              Description *
              <textarea
                required
                maxLength={5000}
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe your product or equipment. Include quality, quantity, condition and other important details."
                className={inputClass}
              />
            </label>
          </section>

          <section>
            <label className="text-sm font-semibold">
              Agricultural specifications
              <span className="mt-1 block text-xs font-normal text-[#879084]">
                Optional technical details in JSON format.
              </span>
              <textarea
                rows={5}
                spellCheck={false}
                value={specificationsText}
                onChange={(event) =>
                  setSpecificationsText(event.target.value)
                }
                placeholder={'{\n  "quantity": "100 kg",\n  "quality": "Grade A"\n}'}
                className={`${inputClass} font-mono`}
              />
            </label>
          </section>

          <section className="rounded-xl border border-[#E5E9E0] p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="flex items-center gap-2 font-bold text-[#17472D]">
                  <ImagePlus size={20} />
                  Product photos and videos *
                </h2>
                <p className="mt-1 text-xs leading-5 text-[#758071]">
                  Upload up to 8 files, including a maximum of 2 videos.
                  Images: 10 MB maximum. Videos: 50 MB maximum.
                </p>
              </div>

              <button
                type="button"
                disabled={uploading || media.length >= MAX_FILES}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17472D] px-4 py-3 text-sm font-semibold text-white hover:bg-[#103921] disabled:opacity-50"
              >
                {uploading ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <UploadCloud size={17} />
                )}
                {uploading ? "Uploading..." : "Upload files"}
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

            <p className="mt-3 text-xs text-[#758071]">
              {imageCount} image(s) · {videoCount} video(s) uploaded
            </p>

            {uploadMessage && (
              <p className="mt-3 text-xs font-medium text-[#17472D]">
                {uploadMessage}
              </p>
            )}

            {uploadError && (
              <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                {uploadError}
              </p>
            )}

            {media.length > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {media.map((item, index) => {
                  const video =
                    item.type === "video" || item.resource_type === "video";

                  return (
                    <div
                      key={`${mediaUrl(item)}-${index}`}
                      className="relative overflow-hidden rounded-xl border border-[#E5E9E0]"
                    >
                      {video ? (
                        <div className="flex aspect-square items-center justify-center bg-[#EAF0E6] text-sm font-semibold text-[#17472D]">
                          Video uploaded
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mediaUrl(item)}
                          alt={`Listing image ${index + 1}`}
                          className="aspect-square w-full object-cover"
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => removeMedia(index)}
                        aria-label={`Remove file ${index + 1}`}
                        className="absolute right-2 top-2 rounded-full bg-white p-2 text-red-700 shadow"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <CheckCircle2 size={18} />
              {success}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-[#E5E9E0] pt-6 sm:flex-row sm:justify-end">
            <Link
              href="/dashboard/my-listings"
              className="rounded-xl border border-[#DCE3D6] px-5 py-3 text-center text-sm font-semibold text-[#526252] hover:bg-[#F7F8F4]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting || uploading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17472D] px-6 py-3 text-sm font-bold text-white hover:bg-[#103921] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && (
                <LoaderCircle size={17} className="animate-spin" />
              )}
              {submitting ? "Publishing..." : "Publish listing"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
