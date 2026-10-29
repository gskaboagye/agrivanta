
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
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
  const [location, setLocation] = useState("All locations");
  const [maxPrice, setMaxPrice] = useState("5000");
  const [showFilters, setShowFilters] = useState(false);

  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

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

  const availableLocations = useMemo(
    () => [
      "All locations",
      ...Array.from(
        new Set(listings.map((listing) => listing.location))
      ).sort(),
    ],
    [listings]
  );

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

      const matchesLocation =
        location === "All locations" ||
        listing.location === location;

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

  function resetFilters() {
    setSearch("");
    setType("all");
    setCategory("All categories");
    setLocation("All locations");
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

            <label className="text-sm font-semibold">
              Location
              <select
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="mt-2 w-full rounded-lg border border-[#D9DED4] bg-white px-3 py-3 font-normal outline-none focus:border-[#17472D]"
              >
                {availableLocations.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

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
                        {listing.seller}
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
                        disabled
                        title="Booking and contact functionality will be added in a later step"
                        className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-[#E7E9E1] px-4 py-3 text-sm font-bold text-[#718071]"
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
