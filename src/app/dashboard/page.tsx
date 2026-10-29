import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ClipboardList,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import DashboardShell from "./dashboard-shell";

export const instant = false;

type RawListing = Record<string, unknown> & {
  _id?: { toString(): string };
};

function asText(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function listingDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString();

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  return "";
}

function listingPrice(listing: RawListing): string {
  const price = listing.price;

  if (typeof price === "number" && Number.isFinite(price)) {
    const currency = asText(listing.currency, "GHS");
    return `${currency} ${price.toLocaleString("en-GH")}`;
  }

  if (typeof price === "string" && price.trim()) return price;
  return "Contact seller";
}

function toListingPreview(listing: RawListing) {
  return {
    id: listing._id?.toString() ?? "",
    title: asText(listing.title, asText(listing.name, "Untitled listing")),
    category: asText(listing.category, asText(listing.type, "Agriculture")),
    location: asText(listing.location, "Location not specified"),
    price: listingPrice(listing),
    image: asText(
      listing.imageUrl,
      asText(listing.image, asText(listing.imageURL, ""))
    ),
    type: asText(listing.type, "product"),
    date: listingDate(listing.createdAt),
  };
}

type BuyerDashboardProps = {
  name: string;
  marketplaceListings: number;
  sentInquiries: number;
  recentListings: ReturnType<typeof toListingPreview>[];
};

function BuyerDashboard({
  name,
  marketplaceListings,
  sentInquiries,
  recentListings,
}: BuyerDashboardProps) {
  const firstName = name.trim().split(/\s+/)[0] || "there";

  return (
    <main className="min-h-screen bg-[#F8F6EE] text-[#193D2A]">
      <header className="border-b border-[#E2E5DA] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#17472D] text-[#D9A441]">
              <ShoppingBag size={23} />
            </span>
            <span>
              <span className="block text-xl font-extrabold">AgriVanta</span>
              <span className="block text-xs text-[#718071]">Buyer dashboard</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-lg bg-[#17472D] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[#235B3A] sm:px-4"
            >
              <Search size={16} />
              <span>Marketplace</span>
            </Link>
            <Link
              href="/dashboard/profile"
              aria-label="Profile and contact settings"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#D9DED4] bg-white text-[#17472D] transition hover:bg-[#F1F2E8]"
            >
              <UserRound size={18} />
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-[#17472D] px-4 py-10 text-white sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E6BD57]">
            Your buying workspace
          </p>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
            Discover agricultural products, compare listings, and keep track of your conversations with sellers—all from one place.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-lg bg-[#D9A441] px-5 py-3 text-sm font-bold text-[#173B27] transition hover:bg-[#E7B958]"
            >
              Explore marketplace <ArrowRight size={16} />
            </Link>
            <Link
              href="/dashboard/inquiries"
              className="inline-flex items-center gap-2 rounded-lg border border-white/35 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <ClipboardList size={16} /> My inquiries
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-[#E0E5D9] bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#68776A]">Active marketplace listings</p>
                <p className="mt-2 text-3xl font-extrabold">{marketplaceListings.toLocaleString("en-GH")}</p>
                <p className="mt-1 text-xs text-[#718071]">Products, equipment, and services to explore</p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF0E6] text-[#17472D]">
                <ShoppingBag size={22} />
              </span>
            </div>
          </article>
          <article className="rounded-2xl border border-[#E0E5D9] bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#68776A]">Inquiries you've sent</p>
                <p className="mt-2 text-3xl font-extrabold">{sentInquiries.toLocaleString("en-GH")}</p>
                <p className="mt-1 text-xs text-[#718071]">Messages you've sent to listing owners</p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FBF1D9] text-[#916B1F]">
                <ClipboardList size={22} />
              </span>
            </div>
            <Link href="/dashboard/inquiries" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#17472D] hover:text-[#9B741F]">
              View inquiries <ArrowRight size={15} />
            </Link>
          </article>
        </div>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9B741F]">A good place to start</p>
            <h2 className="mt-2 text-2xl font-extrabold">Recently added listings</h2>
            <p className="mt-1 text-sm text-[#718071]">Explore current opportunities from the marketplace.</p>
          </div>
          <Link href="/products" className="inline-flex items-center gap-2 text-sm font-bold text-[#17472D] hover:text-[#9B741F]">
            View all listings <ArrowRight size={16} />
          </Link>
        </div>

        {recentListings.length > 0 ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recentListings.map((listing) => (
              <article key={listing.id || `${listing.title}-${listing.date}`} className="overflow-hidden rounded-2xl border border-[#E0E5D9] bg-white">
                {listing.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listing.image} alt={listing.title} loading="lazy" className="h-44 w-full bg-[#EAF0E6] object-cover" />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-[#EAF0E6] text-[#17472D]"><ShoppingBag size={32} /></div>
                )}
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#9B741F]">{listing.category}</p>
                  <h3 className="mt-2 text-lg font-extrabold">{listing.title}</h3>
                  <p className="mt-2 text-sm text-[#718071]">{listing.location}</p>
                  <p className="mt-4 text-lg font-extrabold text-[#17472D]">{listing.price}</p>
                  <Link href="/products" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#17472D] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#235B3A]">
                    Explore listing <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-[#CCD8C7] bg-white px-6 py-12 text-center">
            <ShoppingBag size={28} className="mx-auto text-[#718071]" />
            <h3 className="mt-3 font-bold">No listings to show yet</h3>
            <p className="mt-1 text-sm text-[#718071]">Visit the marketplace to see available products and services.</p>
            <Link href="/products" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#17472D] px-5 py-3 text-sm font-bold text-white hover:bg-[#235B3A]">
              Browse marketplace <ArrowRight size={16} />
            </Link>
          </div>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Link href="/dashboard/inquiries" className="group rounded-2xl border border-[#E0E5D9] bg-white p-5 transition hover:border-[#B7C9B1] hover:shadow-sm">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF0E6] text-[#17472D]"><ClipboardList size={20} /></span>
              <span className="flex-1">
                <span className="block font-bold">Manage your inquiries</span>
                <span className="mt-1 block text-sm leading-6 text-[#718071]">Review the messages you've sent and continue conversations with sellers.</span>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#17472D]">Open inquiries <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
              </span>
            </div>
          </Link>
          <Link href="/dashboard/profile" className="group rounded-2xl border border-[#E0E5D9] bg-white p-5 transition hover:border-[#B7C9B1] hover:shadow-sm">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FBF1D9] text-[#916B1F]"><UserRound size={20} /></span>
              <span className="flex-1">
                <span className="block font-bold">Profile & contact preferences</span>
                <span className="mt-1 block text-sm leading-6 text-[#718071]">Update your contact details and choose how sellers can contact you.</span>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#17472D]">Edit profile <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
              </span>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const user = {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    role: currentUser.role,
  };

  let marketplaceListings = 0;
  let activeListings = 0;
  let sentInquiries = 0;
  let recentListings: ReturnType<typeof toListingPreview>[] = [];

  try {
    const db = await getDatabase();
    const listings = db.collection<RawListing>("listings");

    marketplaceListings = await listings.countDocuments({ status: "active" });

    if (user.role === "buyer") {
      sentInquiries = await db.collection("inquiries").countDocuments({
        buyerId: String(user.id),
      });
    } else {
      const ownerConditions: Record<string, unknown>[] = [];

      if (user.id) {
        ownerConditions.push(
          { userId: user.id },
          { sellerId: user.id },
          { ownerId: user.id },
          { createdBy: user.id }
        );
      }

      if (user.email) {
        ownerConditions.push(
          { userEmail: user.email },
          { sellerEmail: user.email },
          { ownerEmail: user.email }
        );
      }

      if (ownerConditions.length > 0) {
        activeListings = await listings.countDocuments({
          status: "active",
          $or: ownerConditions,
        });
      }
    }

    const documents = await listings
      .find({ status: "active" })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();

    recentListings = documents.map(toListingPreview);
  } catch (error) {
    console.error("Dashboard marketplace lookup failed:", error);
  }

  if (user.role === "buyer") {
    return (
      <BuyerDashboard
        name={user.name}
        marketplaceListings={marketplaceListings}
        sentInquiries={sentInquiries}
        recentListings={recentListings}
      />
    );
  }

  return (
    <DashboardShell
      user={user}
      stats={{ activeListings, marketplaceListings }}
      recentListings={recentListings}
    />
  );
}
