
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  ShoppingBag,
  Tractor,
  Wrench,
  Camera,
  ShieldCheck,
  ArrowRight,
  X,
  CalendarClock,
  UserRound,
  Info,
  Store,
  BriefcaseBusiness,
  GraduationCap,
  Clock,
  Users,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type ListingType =
  | "product"
  | "hire"
  | "service"
  | "worker"
  | "expert";

type Listing = {
  id: string;
  title: string;
  type: ListingType;
  category: string;
  description: string;
  price: number;
  priceUnit: string;
  location: string;
  seller: string;
  sellerProfileId: string | null;
  image: string;
  mediaCount: number;
  skills?: string[];
  experience?: string;
  availability?: string;
};

type ApiListing = Record<string, unknown>;

const fallbackImages: Record<ListingType, string> = {
  product:
    "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=800&q=75",
  hire:
    "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=75",
  service:
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=75",
  worker:
    "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=75",
  expert:
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&q=75",
};

const typeOptions = [
  { value: "all", label: "All listings" },
  { value: "product", label: "For sale" },
  { value: "hire", label: "Equipment for hire" },
  { value: "service", label: "Farm services" },
  { value: "worker", label: "Hire labourers" },
  { value: "expert", label: "Hire experts" },
];

const typeLabels: Record<ListingType, string> = {
  product: "For sale",
  hire: "Equipment for hire",
  service: "Farm service",
  worker: "Labourer for hire",
  expert: "Agricultural expert",
};

function ProductsBrowser() {
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [category, setCategory] = useState("All categories");
  const [location, setLocation] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<
    { display_name: string; name?: string; address?: Record<string, string> }[]
  >([]);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [maxPrice, setMaxPrice] = useState("5000");
  const [showFilters, setShowFilters] = useState(false);

  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [sendingInquiry, setSendingInquiry] = useState(false);
  const [inquiryNotice, setInquiryNotice] = useState("");
  const [inquiryNoticeType, setInquiryNoticeType] = useState<"success" | "error">("success");

  useEffect(() => {
    let cancelled = false;

    async function loadListings() {
      setIsLoading(true);
      setLoadError("");

      try {
        const response = await fetch("/api/listings", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load marketplace listings.");
        }

        const data: {
          success?: boolean;
          listings?: ApiListing[];
          message?: string;
        } = await response.json();

        if (!data.success || !Array.isArray(data.listings)) {
          throw new Error(
            data.message || "The listings response was invalid."
          );
        }

        const allowedTypes: ListingType[] = [
          "product",
          "hire",
          "service",
          "worker",
          "expert",
        ];

        const mappedListings: Listing[] = data.listings
          .filter((item) =>
            allowedTypes.includes(item.type as ListingType)
          )
          .map((item, index) => {
            const listingType = item.type as ListingType;

            const skills = Array.isArray(item.skills)
              ? item.skills.filter(
                  (skill): skill is string =>
                    typeof skill === "string"
                )
              : undefined;

            const rawPrice = Number(item.price);
            const rawMediaCount = Number(item.mediaCount);

            return {
              id: String(
                item.id ??
                  item._id ??
                  `${item.title ?? "listing"}-${index}`
              ),
              title: String(item.title ?? "Untitled listing"),
              type: listingType,
              category: String(item.category ?? "Other"),
              description: String(
                item.description ?? "No description provided."
              ),
              price:
                Number.isFinite(rawPrice) && rawPrice >= 0
                  ? rawPrice
                  : 0,
              priceUnit: String(
                item.priceUnit ?? item.unit ?? "Price to be confirmed"
              ),
              location: String(
                item.location ?? "Location not specified"
              ),
              seller: String(
                item.seller ?? "Seller not specified"
              ),
              sellerProfileId:
                typeof item.sellerProfileId === "string" &&
                item.sellerProfileId.trim().length > 0
                  ? item.sellerProfileId.trim()
                  : null,
              image:
                typeof item.image === "string" &&
                item.image.trim().length > 0
                  ? item.image
                  : fallbackImages[listingType],
              mediaCount:
                Number.isFinite(rawMediaCount) && rawMediaCount > 0
                  ? rawMediaCount
                  : 1,
              skills,
              experience:
                typeof item.experience === "string"
                  ? item.experience
                  : undefined,
              availability:
                typeof item.availability === "string"
                  ? item.availability
                  : undefined,
            };
          });

        if (!cancelled) {
          setListings(mappedListings);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Something went wrong while loading listings."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadListings();

    return () => {
      cancelled = true;
    };
  }, []);

  const availableCategories = useMemo(
    () => [
      "All categories",
      ...Array.from(
        new Set(listings.map((listing) => listing.category))
      ).sort(),
    ],
    [listings]
  );


  useEffect(() => {
    const query = location.trim();
    if (query.length < 3 || query === "All locations") {
      setLocationSuggestions([]);
      setIsSearchingLocations(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsSearchingLocations(true);
      try {
        const params = new URLSearchParams({
          q: query,
          format: "jsonv2",
          addressdetails: "1",
          limit: "5",
          countrycodes: "gh",
        });
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          { signal: controller.signal, headers: { Accept: "application/json" } }
        );
        if (!response.ok) throw new Error("Location search unavailable");
        const results = await response.json();
        setLocationSuggestions(Array.isArray(results) ? results : []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setLocationSuggestions([]);
        }
      } finally {
        setIsSearchingLocations(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [location]);

  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");

    const requestedType = searchParams.get("type");
    const validTypes = typeOptions.map((option) => option.value);

    setType(
      requestedType && validTypes.includes(requestedType)
        ? requestedType
        : "all"
    );

    const requestedCategory = searchParams.get("category");

    if (requestedCategory) {
      const matchingCategory = availableCategories.find(
        (item) =>
          item.toLowerCase() === requestedCategory.toLowerCase()
      );

      if (matchingCategory) {
        setCategory(matchingCategory);
      }
    } else {
      setCategory("All categories");
    }
  }, [searchParams, availableCategories]);

  const filteredListings = useMemo(() => {
    const term = search.trim().toLowerCase();

    const priceLimit =
      maxPrice.trim() === "" ? Infinity : Number(maxPrice);

    return listings.filter((listing) => {
      const searchableText = [
        listing.title,
        listing.category,
        listing.description,
        listing.seller,
        listing.location,
        ...(listing.skills ?? []),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !term || searchableText.includes(term);

      const matchesType =
        type === "all" || listing.type === type;

      const matchesCategory =
        category === "All categories" ||
        listing.category === category;

      const locationTerm = location.trim().toLocaleLowerCase();
      const matchesLocation =
        !locationTerm ||
        locationTerm === "all locations" ||
        listing.location.toLocaleLowerCase().includes(locationTerm) ||
        locationTerm.includes(listing.location.toLocaleLowerCase());

      const matchesPrice =
        Number.isFinite(priceLimit) &&
        priceLimit >= 0 &&
        listing.price <= priceLimit;

      return (
        matchesSearch &&
        matchesType &&
        matchesCategory &&
        matchesLocation &&
        matchesPrice
      );
    });
  }, [listings, search, type, category, location, maxPrice]);

  function openInquiry(listing: Listing) {
    setSelectedListing(listing);
    setInquiryMessage("");
    setInquiryNotice("");
    setInquiryNoticeType("success");
  }

  function closeInquiry() {
    if (sendingInquiry) return;
    setSelectedListing(null);
    setInquiryMessage("");
    setInquiryNotice("");
  }

  async function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedListing) return;

    const trimmedMessage = inquiryMessage.trim();
    if (trimmedMessage.length < 10 || trimmedMessage.length > 3000) {
      setInquiryNoticeType("error");
      setInquiryNotice("Please enter a message between 10 and 3000 characters.");
      return;
    }

    setSendingInquiry(true);
    setInquiryNotice("");

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ listingId: selectedListing.id, message: trimmedMessage }),
      });
      const data: { error?: string; message?: string } = await response.json().catch(() => ({}));

      if (response.status === 401) {
        setInquiryNoticeType("error");
        setInquiryNotice("Please log in before contacting a seller.");
        return;
      }
      if (!response.ok) {
        throw new Error(data.error || data.message || "Unable to send your inquiry. Please try again.");
      }

      setSelectedListing(null);
      setInquiryMessage("");
      setInquiryNoticeType("success");
      setInquiryNotice("Your inquiry was sent successfully.");
    } catch (error) {
      setInquiryNoticeType("error");
      setInquiryNotice(error instanceof Error ? error.message : "Unable to send your inquiry. Please try again.");
    } finally {
      setSendingInquiry(false);
    }
  }

  function resetFilters() {
    setSearch("");
    setType("all");
    setCategory("All categories");
    setLocation("");
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);
    setMaxPrice("5000");
  }

  function getListingIcon(listingType: ListingType) {
    switch (listingType) {
      case "product":
        return <ShoppingBag size={16} />;
      case "hire":
        return <Tractor size={16} />;
      case "service":
        return <Wrench size={16} />;
      case "worker":
        return <Users size={16} />;
      case "expert":
        return <GraduationCap size={16} />;
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F6EE] text-[#193D2A]">
      <div className="bg-[#17472D] px-4 py-2 text-center text-xs font-medium text-white sm:text-sm">
        AgriVanta Marketplace — Products, Workers and Agricultural Experts
      </div>

      <header className="border-b border-[#E7E4D9] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#17472D] text-[#D9A441]">
              <ShoppingBag size={24} />
            </span>

            <span>
              <span className="block text-xl font-extrabold">
                AgriVanta
              </span>
              <span className="text-xs text-[#718071]">
                Marketplace
              </span>
            </span>
          </a>

          <div className="flex items-center gap-3">
            <a
              href="/"
              className="hidden text-sm font-semibold hover:text-[#9B741F] sm:inline"
            >
              Homepage
            </a>

            <a
              href="/register?role=seller"
              className="inline-flex items-center gap-2 rounded-lg bg-[#17472D] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#235B3A]"
            >
              <Store size={16} />
              Join AgriVanta
            </a>
          </div>
        </div>
      </header>

      <section className="bg-[#17472D] px-4 py-12 text-white sm:py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E6BD57]">
            Discover agricultural opportunities
          </p>

          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold sm:text-5xl">
            Find what your farm needs.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
            Buy agricultural products, hire equipment, find farm
            labourers, or connect with agricultural professionals.
            Explore opportunities across the agricultural value chain.
          </p>

          <form
            onSubmit={(event) => event.preventDefault()}
            className="mt-7 flex max-w-2xl flex-col gap-2 rounded-xl bg-white p-2 sm:flex-row"
          >
            <label className="flex min-w-0 flex-1 items-center gap-3 px-3">
              <Search
                size={20}
                className="shrink-0 text-[#64806C]"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search workers, skills, crops or equipment..."
                aria-label="Search marketplace listings"
                className="min-w-0 flex-1 py-3 text-sm text-[#193D2A] outline-none placeholder:text-gray-500"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="text-gray-500 hover:text-gray-900"
                >
                  <X size={17} />
                </button>
              )}
            </label>

            <button
              type="submit"
              className="rounded-lg bg-[#D9A441] px-6 py-3 font-bold text-[#173B27] hover:bg-[#E7B958]"
            >
              Search
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setType("worker")}
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-4 py-3 text-sm font-semibold hover:bg-white/10"
            >
              <Users size={17} />
              Find farm labourers
            </button>

            <button
              type="button"
              onClick={() => setType("expert")}
              className="inline-flex items-center gap-2 rounded-lg bg-[#D9A441] px-4 py-3 text-sm font-semibold text-[#173B27] hover:bg-[#E7B958]"
            >
              <GraduationCap size={17} />
              Find agricultural experts
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold">
              Explore the marketplace
            </h2>
            <p className="mt-1 text-sm text-[#718071]">
              Find products, people and services for your farm.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            className="inline-flex items-center gap-2 rounded-lg border border-[#D9DED4] bg-white px-4 py-2.5 text-sm font-semibold hover:bg-[#F1F2E8]"
          >
            <SlidersHorizontal size={17} />
            {showFilters ? "Hide filters" : "Show filters"}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {typeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setType(option.value)}
              aria-pressed={type === option.value}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                type === option.value
                  ? "border-[#17472D] bg-[#17472D] text-white"
                  : "border-[#D9DED4] bg-white text-[#526755] hover:border-[#17472D]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="mt-5 grid gap-4 rounded-xl border border-[#E7E4D9] bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm font-semibold">
              Category
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="mt-2 w-full rounded-lg border border-[#D9DED4] bg-white px-3 py-3 font-normal outline-none focus:border-[#17472D]"
              >
                {availableCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <div className="relative text-sm font-semibold">
              <label htmlFor="marketplace-location-search">Location</label>
              <div className="relative mt-2">
                <MapPin size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#718071]" />
                <input
                  id="marketplace-location-search"
                  type="search"
                  value={location}
                  onChange={(event) => {
                    setLocation(event.target.value);
                    setShowLocationSuggestions(true);
                  }}
                  onFocus={() => setShowLocationSuggestions(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setShowLocationSuggestions(false);
                    if (event.key === "Enter") setShowLocationSuggestions(false);
                  }}
                  placeholder="Search town, community or region"
                  autoComplete="off"
                  className="w-full rounded-lg border border-[#D9DED4] bg-white py-3 pl-9 pr-10 font-normal outline-none focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
                />
                {location && (
                  <button
                    type="button"
                    aria-label="Clear location search"
                    onClick={() => {
                      setLocation("");
                      setLocationSuggestions([]);
                      setShowLocationSuggestions(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718071] hover:text-[#17472D]"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              {showLocationSuggestions && location.trim().length >= 3 && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-[#D9DED4] bg-white text-sm font-normal shadow-xl">
                  {isSearchingLocations && (
                    <p className="px-3 py-3 text-[#718071]">Searching locations...</p>
                  )}
                  {!isSearchingLocations && locationSuggestions.length === 0 && (
                    <p className="px-3 py-3 text-[#718071]">No geographic suggestions found. You can still use the text you typed to filter listings.</p>
                  )}
                  {locationSuggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.display_name}-${index}`}
                      type="button"
                      onClick={() => {
                        const selectedLocation = suggestion.display_name;
                        setLocation(selectedLocation);
                        setShowLocationSuggestions(false);
                      }}
                      className="flex w-full items-start gap-2 border-b border-[#F0F0E8] px-3 py-3 text-left last:border-b-0 hover:bg-[#F3F5EF]"
                    >
                      <MapPin size={15} className="mt-0.5 shrink-0 text-[#17472D]" />
                      <span>{suggestion.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-1 text-xs font-normal text-[#718071]">Leave blank to show all locations. Suggestions require an internet connection.</p>
            </div>

            <label className="text-sm font-semibold">
              Maximum rate or price (GH₵)
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                className="mt-2 w-full rounded-lg border border-[#D9DED4] px-3 py-3 font-normal outline-none focus:border-[#17472D]"
              />
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full rounded-lg border border-[#D9DED4] px-4 py-3 text-sm font-bold hover:bg-[#F1F2E8]"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {loadError && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {loadError} Please refresh the page to try again.
          </div>
        )}

        {isLoading ? (
          <div className="mt-8 rounded-xl border border-[#E7E4D9] bg-white px-5 py-14 text-center text-sm text-[#718071]">
            Loading listings from AgriVanta...
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="text-[#526755]">
                <span className="font-extrabold">
                  {filteredListings.length}
                </span>{" "}
                {filteredListings.length === 1
                  ? "listing"
                  : "listings"}{" "}
                found
              </p>

              <span className="text-xs text-[#718071]">
                Listings from the AgriVanta marketplace database
              </span>
            </div>

            {filteredListings.length > 0 ? (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredListings.map((listing) => (
                  <article
                    key={listing.id}
                    className="overflow-hidden rounded-xl border border-[#E7E4D9] bg-white transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative h-52 overflow-hidden bg-[#EAF0E6]">
                      <img
                        src={listing.image}
                        alt={listing.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />

                      <span className="absolute left-3 top-3 rounded-md bg-white px-3 py-1.5 text-xs font-bold text-[#17472D]">
                        {typeLabels[listing.type]}
                      </span>

                      <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-black/65 px-2.5 py-1.5 text-xs font-medium text-white">
                        <Camera size={14} />
                        {listing.mediaCount} sample photos
                      </span>
                    </div>

                    <div className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#9B741F]">
                        {listing.category}
                      </p>

                      <h3 className="mt-2 text-lg font-extrabold">
                        {listing.title}
                      </h3>

                      <p className="mt-2 min-h-[60px] text-sm leading-6 text-[#647367]">
                        {listing.description}
                      </p>

                      {(listing.type === "worker" ||
                        listing.type === "expert") && (
                        <div className="mt-4 space-y-3 rounded-lg bg-[#F3F5EF] p-3">
                          {listing.skills &&
                            listing.skills.length > 0 && (
                              <div>
                                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#17472D]">
                                  <BriefcaseBusiness size={14} />
                                  Skills and services
                                </p>

                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {listing.skills.map((skill) => (
                                    <span
                                      key={skill}
                                      className="rounded-full border border-[#D9DED4] bg-white px-2.5 py-1 text-xs text-[#526755]"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                          {listing.experience && (
                            <p className="flex items-start gap-2 text-xs leading-5 text-[#526755]">
                              <GraduationCap
                                size={15}
                                className="mt-0.5 shrink-0"
                              />
                              <span>
                                <strong>
                                  Experience / credentials:
                                </strong>{" "}
                                {listing.experience}
                              </span>
                            </p>
                          )}

                          {listing.availability && (
                            <p className="flex items-start gap-2 text-xs leading-5 text-[#526755]">
                              <Clock
                                size={15}
                                className="mt-0.5 shrink-0"
                              />
                              <span>{listing.availability}</span>
                            </p>
                          )}
                        </div>
                      )}

                      <div className="mt-4 border-t border-[#E7E4D9] pt-4">
                        <p className="text-xl font-extrabold text-[#17472D]">
                          GH₵ {listing.price.toLocaleString("en-GH")}
                        </p>
                        <p className="mt-1 text-xs text-[#718071]">
                          {listing.priceUnit}
                        </p>
                      </div>

                      <p className="mt-4 flex items-center gap-2 text-sm text-[#647367]">
                        <MapPin size={16} className="shrink-0" />
                        {listing.location}
                      </p>

                      <p className="mt-3 flex items-center gap-2 text-sm text-[#647367]">
                        <UserRound size={16} className="shrink-0" />
                        {listing.sellerProfileId ? (
                          <a
                            href={`/sellers/${encodeURIComponent(listing.sellerProfileId)}`}
                            className="font-semibold text-[#17472D] underline-offset-4 hover:text-[#9B741F] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17472D] focus-visible:ring-offset-2 rounded-sm"
                            aria-label={`View ${listing.seller} seller profile`}
                          >
                            {listing.seller}
                          </a>
                        ) : (
                          <span>{listing.seller}</span>
                        )}
                      </p>

                      <div className="mt-4 flex items-start gap-2 rounded-lg bg-[#FCF6E6] p-3">
                        <Info
                          size={16}
                          className="mt-0.5 shrink-0 text-[#8B681C]"
                        />
                        <p className="text-xs leading-5 text-[#6C5729]">
                          Demonstration listing. Seller identity,
                          qualifications, rates and availability have
                          not been independently verified.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => openInquiry(listing)}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#17472D] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#235B3A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17472D] focus-visible:ring-offset-2"
                        aria-label={`${listing.type === "worker" || listing.type === "expert" ? "Request to hire" : listing.type === "hire" ? "Request equipment" : listing.type === "service" ? "Request service" : "Contact seller"}: ${listing.title}`}
                      >
                        {listing.type === "worker" ||
                        listing.type === "expert"
                          ? "Request to hire"
                          : listing.type === "hire"
                            ? "Request equipment"
                            : listing.type === "service"
                              ? "Request service"
                              : "Contact seller"}
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-xl border border-dashed border-[#C9D3C4] bg-white px-5 py-14 text-center">
                <Search
                  size={32}
                  className="mx-auto text-[#718071]"
                />
                <h3 className="mt-4 text-lg font-bold">
                  No matching listings
                </h3>
                <p className="mt-2 text-sm text-[#718071]">
                  Try another search term or clear some filters.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 rounded-lg bg-[#17472D] px-5 py-3 text-sm font-bold text-white hover:bg-[#235B3A]"
                >
                  Reset filters
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {inquiryNotice && !selectedListing && (
        <div role="status" aria-live="polite" className={`fixed bottom-5 right-5 z-[60] flex max-w-md items-start gap-3 rounded-xl border bg-white p-4 shadow-xl ${inquiryNoticeType === "success" ? "border-[#C9D4C4] text-[#17472D]" : "border-red-200 text-red-700"}`}>
          {inquiryNoticeType === "success" ? <CheckCircle2 size={20} className="mt-0.5 shrink-0" /> : <AlertCircle size={20} className="mt-0.5 shrink-0" />}
          <p className="flex-1 text-sm font-medium">{inquiryNotice}</p>
          {inquiryNoticeType === "error" && inquiryNotice.includes("log in") && <a href={`/login?redirect=${encodeURIComponent("/products")}`} className="shrink-0 font-bold underline underline-offset-2">Log in</a>}
          <button type="button" onClick={() => setInquiryNotice("")} aria-label="Dismiss notification" className="text-current opacity-70 hover:opacity-100"><X size={17} /></button>
        </div>
      )}

      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !sendingInquiry) closeInquiry(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="marketplace-inquiry-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9B741F]">AgriVanta Marketplace</p>
                <h2 id="marketplace-inquiry-title" className="mt-2 text-2xl font-extrabold text-[#17472D]">
                  {selectedListing.type === "worker" || selectedListing.type === "expert" ? "Request to hire" : selectedListing.type === "hire" ? "Request equipment" : selectedListing.type === "service" ? "Request service" : "Contact seller"}
                </h2>
                <p className="mt-2 text-sm text-[#647367]">About: {selectedListing.title}</p>
              </div>
              <button type="button" onClick={closeInquiry} disabled={sendingInquiry} aria-label="Close inquiry form" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"><X size={20} /></button>
            </div>

            <form onSubmit={submitInquiry} className="mt-5 space-y-4">
              <label htmlFor="marketplace-inquiry-message" className="block text-sm font-semibold text-[#17472D]">Your message</label>
              <textarea id="marketplace-inquiry-message" value={inquiryMessage} onChange={(event) => setInquiryMessage(event.target.value)} minLength={10} maxLength={3000} rows={5} required placeholder="Introduce yourself and explain what you would like to know..." className="w-full rounded-xl border border-[#C9D4C4] px-4 py-3 text-sm outline-none focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/15" />
              <p className="text-right text-xs text-[#718071]">{inquiryMessage.length}/3000 characters</p>
              {inquiryNotice && <p role="alert" className={`text-sm ${inquiryNoticeType === "success" ? "text-[#17472D]" : "text-red-700"}`}>
                {inquiryNotice}{inquiryNoticeType === "error" && inquiryNotice.includes("log in") && <> <a href={`/login?redirect=${encodeURIComponent("/products")}`} className="font-bold underline underline-offset-2">Log in</a></>}
              </p>}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeInquiry} disabled={sendingInquiry} className="rounded-lg border border-[#D9DED4] px-4 py-2.5 text-sm font-semibold text-[#17472D] hover:bg-[#F1F2E8] disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={sendingInquiry || inquiryMessage.trim().length < 10} className="inline-flex items-center gap-2 rounded-lg bg-[#17472D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#235B3A] disabled:cursor-not-allowed disabled:opacity-60">
                  {sendingInquiry ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <MessageCircle size={17} />}
                  {sendingInquiry ? "Sending..." : "Send inquiry"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <section className="border-t border-[#E7E4D9] bg-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
          <div className="flex gap-3">
            <ShieldCheck
              className="shrink-0 text-[#17472D]"
              size={23}
            />
            <div>
              <h3 className="font-bold">Build trust</h3>
              <p className="mt-1 text-sm leading-6 text-[#718071]">
                Review profiles, discuss terms and verify qualifications
                before making hiring decisions.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <CalendarClock
              className="shrink-0 text-[#17472D]"
              size={23}
            />
            <div>
              <h3 className="font-bold">Agree on availability</h3>
              <p className="mt-1 text-sm leading-6 text-[#718071]">
                Confirm work dates, job requirements, rates and
                availability before arranging a booking.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Wrench
              className="shrink-0 text-[#17472D]"
              size={23}
            />
            <div>
              <h3 className="font-bold">Support the whole farm</h3>
              <p className="mt-1 text-sm leading-6 text-[#718071]">
                Connect with suppliers, labourers, equipment providers
                and agricultural professionals.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#103720] px-4 py-8 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <a href="/" className="text-lg font-extrabold">
              AgriVanta
            </a>
            <p className="mt-1 text-sm text-white/70">
              Powering Every Link in Agriculture.
            </p>
          </div>

          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white"
          >
            Back to homepage
            <ArrowRight size={16} />
          </a>
        </div>
      </footer>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F6EE] p-10 text-center text-[#17472D]">
          Loading marketplace...
        </div>
      }
    >
      <ProductsBrowser />
    </Suspense>
  );
}
