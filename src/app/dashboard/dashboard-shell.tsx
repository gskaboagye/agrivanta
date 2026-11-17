
"use client";

import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Compass,
  Package,
  ShoppingBag,
  Sprout,
  TrendingUp,
  Users,
  Wheat,
} from "lucide-react";
import Link from "next/link";




type AccountRole = "farmer" | "buyer" | "supplier" | "worker" | "expert";

type DashboardUser = {
  id?: string;
  name: string;
  email: string;
  role: AccountRole;
};

type ListingPreview = {
  id: string;
  title: string;
  category: string;
  location: string;
  price: string;
  image: string;
  type: string;
  date: string;
};


type DashboardShellProps = {
  user: DashboardUser;
  stats: {
    activeListings: number;
    marketplaceListings: number;
  };
  recentListings: ListingPreview[];
};

const roleDetails: Record<
  AccountRole,
  { label: string; greeting: string; description: string }
> = {
  farmer: {
    label: "Farmer",
    greeting: "Grow your business",
    description:
      "Manage your agricultural products and connect with buyers across Ghana.",
  },
  buyer: {
    label: "Buyer",
    greeting: "Find what you need",
    description:
      "Discover agricultural produce, compare offers, and connect with suppliers.",
  },
  supplier: {
    label: "Supplier",
    greeting: "Reach more customers",
    description:
      "Showcase your agricultural supplies and discover new business opportunities.",
  },
  worker: {
    label: "Agricultural Worker",
    greeting: "Find your next opportunity",
    description:
      "Explore the agricultural marketplace and connect with people in the industry.",
  },
  expert: {
    label: "Agricultural Expert",
    greeting: "Share your expertise",
    description:
      "Connect with agricultural communities and explore opportunities to make an impact.",
  },
};


const roleActions: Record<
  AccountRole,
  { title: string; description: string; href: string; icon: typeof Sprout }[]
> = {
  farmer: [
    {
      title: "Explore the marketplace",
      description: "See what buyers and suppliers are offering.",
      href: "/products",
      icon: ShoppingBag,
    },
    {
      title: "Manage my listings",
      description: "Edit or remove products connected to your account.",
      href: "/dashboard/my-listings",
      icon: Package,
    },
  ],
  buyer: [
    {
      title: "Browse agricultural produce",
      description: "Discover products available in the marketplace.",
      href: "/products",
      icon: Wheat,
    },
    {
      title: "Explore suppliers",
      description: "Find products by category and location.",
      href: "/products",
      icon: Compass,
    },
  ],
  supplier: [
    {
      title: "Explore the marketplace",
      description: "See the needs and offers in the market.",
      href: "/products",
      icon: ShoppingBag,
    },
    {
      title: "Manage my listings",
      description:
        "Edit or remove products and services connected to your account.",
      href: "/dashboard/my-listings",
      icon: Package,
    },
  ],
  worker: [
    {
      title: "Explore opportunities",
      description: "Browse the agricultural marketplace.",
      href: "/products",
      icon: Compass,
    },
    {
      title: "Manage my listings",
      description: "Review and update opportunities you've published.",
      href: "/dashboard/my-listings",
      icon: Package,
    },
  ],
  expert: [
    {
      title: "Explore the community",
      description: "Discover agricultural products and market activity.",
      href: "/products",
      icon: Users,
    },
    {
      title: "Manage my listings",
      description: "Review and update services you've published.",
      href: "/dashboard/my-listings",
      icon: Package,
    },
  ],
};

function formatPrice(price: string) {
  return price || "Contact seller";
}

function formatDate(date: string) {
  if (!date) return "Recently added";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Recently added";

  return parsed.toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DashboardShell({
  user,
  stats,
  recentListings,
}: DashboardShellProps) {
  const details = roleDetails[user.role];
  const actions = roleActions[user.role];

  return (
    <main className="mx-auto w-full min-w-0 max-w-[1500px] px-3 py-5 sm:px-7 sm:py-9 xl:px-10">
          <section className="relative isolate overflow-hidden rounded-[24px] bg-[#17472D] px-6 py-7 sm:px-9 sm:py-9">
            <div className="pointer-events-none absolute -right-12 -top-24 -z-10 h-72 w-72 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-1 -top-12 -z-10 h-56 w-56 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute bottom-[-100px] right-[20%] -z-10 h-48 w-48 rounded-full bg-white/[0.04]" />

            <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e8d19a]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D9A441]" />
                  {details.label} workspace
                </div>

                <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.04em] text-white sm:text-[36px]">
                  {details.greeting},{" "}
                  <span className="text-[#e7c77e]">
                    {user.name.split(" ")[0]}.
                  </span>
                </h2>

                <p className="mt-3 max-w-xl text-[13px] leading-6 text-white/70 sm:text-sm">
                  {details.description}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/products"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D9A441] px-4 py-3 text-xs font-bold text-[#203b26] transition hover:bg-[#e8b953]"
                  >
                    Explore marketplace
                    <ArrowRight size={15} />
                  </Link>

                  <Link
                    href="/dashboard/my-listings"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-3 text-xs font-semibold text-white transition hover:bg-white/10"
                  >
                    Manage my listings
                  </Link>
                </div>
              </div>

              <div className="hidden shrink-0 items-center justify-center md:flex">
                <div className="flex h-32 w-32 items-center justify-center rounded-full border border-white/15 bg-white/[0.06]">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[#D9A441]/40 bg-[#D9A441]/10">
                    <Sprout
                      size={48}
                      strokeWidth={1.3}
                      className="text-[#e7c77e]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h3 className="text-[16px] font-bold tracking-tight text-[#26372b]">
                  Marketplace at a glance
                </h3>
                <p className="mt-1 text-xs text-[#879084]">
                  A snapshot of what is available on AgriVanta.
                </p>
              </div>

              <Link
                href="/products"
                className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-[#17472D] hover:underline"
              >
                Open marketplace <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <article className="rounded-2xl border border-[#e8ebe4] bg-white p-5 transition hover:border-[#cdd8c8] hover:shadow-sm sm:p-6">
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF0E6] text-[#17472D]">
                    <Package size={21} strokeWidth={1.8} />
                  </span>
                  <span className="rounded-full bg-[#f3f6ef] px-2.5 py-1 text-[10px] font-semibold text-[#63765e]">
                    Live inventory
                  </span>
                </div>

                <p className="mt-5 text-[12px] font-medium text-[#7c8679]">
                  Active marketplace listings
                </p>
                <p className="mt-1 text-[30px] font-bold tracking-[-0.04em] text-[#243629]">
                  {stats.marketplaceListings.toLocaleString()}
                </p>
                <p className="mt-2 text-[11px] leading-5 text-[#929a8e]">
                  Active products currently listed across the marketplace.
                </p>
              </article>

              <article className="rounded-2xl border border-[#e8ebe4] bg-white p-5 transition hover:border-[#e7d5a7] hover:shadow-sm sm:p-6">
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fbf2dd] text-[#8c681f]">
                    <TrendingUp size={21} strokeWidth={1.8} />
                  </span>
                  <span className="rounded-full bg-[#fbf2dd] px-2.5 py-1 text-[10px] font-semibold text-[#8c681f]">
                    Your account
                  </span>
                </div>

                <p className="mt-5 text-[12px] font-medium text-[#7c8679]">
                  Your active listings
                </p>
                <p className="mt-1 text-[30px] font-bold tracking-[-0.04em] text-[#243629]">
                  {stats.activeListings.toLocaleString()}
                </p>
                <p className="mt-2 text-[11px] leading-5 text-[#929a8e]">
                  Listings linked to your account in the current database.
                </p>
              </article>
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-4">
              <h3 className="text-[16px] font-bold tracking-tight text-[#26372b]">
                Quick actions
              </h3>
              <p className="mt-1 text-xs text-[#879084]">
                Useful next steps for your {details.label.toLowerCase()} account.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {actions.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group flex items-start gap-4 rounded-2xl border border-[#e8ebe4] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#cbd8c7] hover:shadow-sm sm:p-6"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EAF0E6] text-[#17472D] transition group-hover:bg-[#17472D] group-hover:text-white">
                    <action.icon size={22} strokeWidth={1.7} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-[#26372b]">
                      {action.title}
                    </span>
                    <span className="mt-1.5 block text-xs leading-5 text-[#879084]">
                      {action.description}
                    </span>
                  </span>

                  <ArrowUpRight
                    size={18}
                    className="shrink-0 text-[#9aa294] transition group-hover:text-[#17472D]"
                  />
                </Link>
              ))}
            </div>
          </section>

          <section id="account" className="mt-8 scroll-mt-24">
            <div className="mb-4">
              <h3 className="text-[16px] font-bold tracking-tight text-[#26372b]">
                Account information
              </h3>
              <p className="mt-1 text-xs text-[#879084]">
                Your current AgriVanta profile details.
              </p>
            </div>

            <div className="grid gap-4 rounded-2xl border border-[#e8ebe4] bg-white p-5 sm:grid-cols-2 sm:p-6">
              <div>
                <p className="text-[11px] font-medium text-[#879084]">
                  Full name
                </p>
                <p className="mt-1.5 break-words text-sm font-semibold text-[#26372b]">
                  {user.name}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-medium text-[#879084]">
                  Email address
                </p>
                <p className="mt-1.5 break-words text-sm font-semibold text-[#26372b]">
                  {user.email}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-medium text-[#879084]">
                  Account type
                </p>
                <p className="mt-1.5 text-sm font-semibold text-[#26372b]">
                  {details.label}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-medium text-[#879084]">
                  Account ID
                </p>
                <p className="mt-1.5 break-all font-mono text-xs text-[#526252]">
                  {user.id || "Not available"}
                </p>
              </div>
            </div>
          </section>

          <footer
            id="help"
            className="mt-10 flex flex-col gap-2 border-t border-[#e5e9e0] py-6 text-[11px] text-[#929a8e] sm:flex-row sm:items-center sm:justify-between"
          >
            <p>
              Ã‚Â© {new Date().getFullYear()} AgriVanta. Powering Every Link in
              Agriculture.
            </p>
            <p className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#75966b]" />
              Connected agriculture, better opportunities.
            </p>
          </footer>
        </main>
  );
}


