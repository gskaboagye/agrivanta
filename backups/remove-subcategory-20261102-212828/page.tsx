
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  UploadCloud,
  X,
} from "lucide-react";

type ListingType = "product" | "hire" | "service" | "worker" | "expert";

const roleListingTypes: Record<string, ListingType[]> = {
  farmer: ["product", "hire"],
  buyer: [],
  supplier: ["product", "service"],
  worker: ["worker"],
  expert: ["expert", "service"],
};

const listingOptions: {
  type: ListingType;
  title: string;
  description: string;
}[] = [
  {
    type: "product",
    title: "Products for sale",
    description: "Crops, vegetables, fruits, livestock and other farm produce.",
  },
  {
    type: "hire",
    title: "Equipment for hire",
    description: "Tractors, harvesters, irrigation equipment and machinery.",
  },
  {
    type: "service",
    title: "Services",
    description: "Agricultural services, supplies and professional support.",
  },
  {
    type: "worker",
    title: "Worker listing",
    description: "Make your agricultural skills and availability known.",
  },
  {
    type: "expert",
    title: "Expert listing",
    description: "Offer agricultural expertise and consultancy.",
  },
];



const listingPlaceholders: Record<
  ListingType,
  { title: string; category: string; description: string }
> = {
  product: {
    title: "e.g. Fresh maize for sale",
    category: "e.g. Grains, Vegetables, Livestock",
    description: "Describe the product, its quality, available quantity, harvest date and other important details.",
  },
  hire: {
    title: "e.g. Tractor available for hire",
    category: "e.g. Tractors, Harvesters, Irrigation",
    description: "Describe the equipment, its condition, availability and hire terms.",
  },
  service: {
    title: "e.g. Land preparation service",
    category: "e.g. Land preparation, Irrigation, Transport",
    description: "Describe the service, coverage area, experience and what is included.",
  },
  worker: {
    title: "e.g. Experienced farm worker available",
    category: "e.g. Crop farming, Animal care, Machinery operation",
    description: "Describe your skills, experience, availability and preferred work arrangements.",
  },
  expert: {
    title: "e.g. Crop production consultant",
    category: "e.g. Agronomy, Soil science, Veterinary",
    description: "Describe your area of expertise, qualifications, experience and the support you offer.",
  },
};
const priceUnitsByType: Record<ListingType, string[]> = {
  product: ["per unit", "per kg", "per bag", "per crate", "per basket", "per tonne", "per animal", "negotiable"],
  hire: ["per hour", "per day", "per week", "per month", "negotiable"],
  service: ["per hour", "per day", "per project", "negotiable"],
  worker: ["per hour", "per day", "per week", "per month", "negotiable"],
  expert: ["per hour", "per day", "per consultation", "per project", "negotiable"],
};
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
  const [accountRole, setAccountRole] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);

  const permittedTypes = roleListingTypes[accountRole] ?? [];
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState("per unit");
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [town, setTown] = useState("");


  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile", {
          credentials: "same-origin",
        });
        const data = await response.json();

        if (!response.ok || !data.profile?.role) {
          throw new Error(data.message || "Unable to verify your account type.");
        }

        if (active) {
          const role = String(data.profile.role).toLowerCase();
          setAccountRole(role);

          const allowed = roleListingTypes[role] ?? [];
          if (allowed.length > 0) {
            setType(allowed[0]);
            setPriceUnit(priceUnitsByType[allowed[0]][0]);
          }
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load your account."
          );
        }
      } finally {
        if (active) setProfileLoading(false);
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

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

    if (!permittedTypes.includes(type)) {
      setError("Your account is not permitted to publish this listing type.");
      return;
    }

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

    if (!region.trim() || !town.trim()) {
      setError("Please select a region and enter your town or community.");
      return;
    }

    const ghanaRegions = [
      "Ahafo", "Ashanti", "Bono", "Bono East",
      "Central", "Eastern", "Greater Accra", "North East",
      "Northern", "Oti", "Savannah", "Upper East",
      "Upper West", "Volta", "Western", "Western North",
    ];

    if (!ghanaRegions.includes(region)) {
      setError("Please select a valid Ghana region.");
      return;
    }

    const combinedLocation = [
      town.trim(),
      district.trim(),
      region.trim(),
      "Ghana",
    ].filter(Boolean).join(", ");
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
          location: combinedLocation,
          region: region.trim(),
          district: district.trim(),
          town: town.trim(),
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

  if (profileLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F8F4] px-4 text-[#243629]">
        <div className="flex items-center gap-3 rounded-xl bg-white p-6 shadow-sm">
          <LoaderCircle className="animate-spin text-[#17472D]" size={22} />
          <p className="text-sm font-medium">Verifying your account...</p>
        </div>
      </main>
    );
  }

  if (!accountRole || permittedTypes.length === 0) {
    const isBuyer = accountRole === "buyer";

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F8F4] px-4 py-8 text-[#243629]">
        <section className="w-full max-w-lg rounded-2xl border border-[#E5E9E0] bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-extrabold text-[#17472D]">
            {isBuyer ? "Listing creation unavailable" : "Unable to create a listing"}
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#758071]">
            {isBuyer
              ? "Buyer accounts can browse the AgriVanta marketplace and contact listing owners, but cannot publish listings."
              : error || "Your account type does not currently have permission to create listings. Please contact support if you believe this is incorrect."}
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#17472D] px-5 py-3 text-sm font-semibold text-white hover:bg-[#103921]"
          >
            Back to dashboard
          </Link>
        </section>
      </main>
    );
  }
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
            Create a marketplace listing for your agricultural products, equipment, services, skills or expertise.
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
              {listingOptions
                .filter((option) => permittedTypes.includes(option.type))
                .map((option) => (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => { setType(option.type); setPriceUnit(priceUnitsByType[option.type][0]); }}
                    className={`rounded-xl border-2 p-5 text-left transition ${
                      type === option.type
                        ? "border-[#17472D] bg-[#F0F5ED]"
                        : "border-[#E5E9E0] hover:border-[#9BAC96]"
                    }`}
                  >
                    <span className="block font-bold">{option.title}</span>
                    <span className="mt-2 block text-xs leading-5 text-[#758071]">
                      {option.description}
                    </span>
                  </button>
                ))}
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
                placeholder={listingPlaceholders[type].title}
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
                placeholder={listingPlaceholders[type].category}
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
              Region *
              <select
                required
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                className={inputClass}
              >
                <option value="">Select your region</option>
                {[
                  "Ahafo", "Ashanti", "Bono", "Bono East",
                  "Central", "Eastern", "Greater Accra", "North East",
                  "Northern", "Oti", "Savannah", "Upper East",
                  "Upper West", "Volta", "Western", "Western North",
                ].map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold">
              District / Municipality
              <input
                maxLength={100}
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
                placeholder="Enter your district (optional)"
                className={inputClass}
              />
            </label>

            <label className="text-sm font-semibold">
              Town / Community *
              <input
                required
                maxLength={100}
                value={town}
                onChange={(event) => setTown(event.target.value)}
                placeholder="e.g. Kwabenya"
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
                {priceUnitsByType[type].map((unit) => (
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
                placeholder={listingPlaceholders[type].description}
                className={inputClass}
              />
            </label>
          </section>

          <section className="rounded-xl border border-[#E5E9E0] p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="flex items-center gap-2 font-bold text-[#17472D]">
                  <ImagePlus size={20} />
                  Listing photos and videos *
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



