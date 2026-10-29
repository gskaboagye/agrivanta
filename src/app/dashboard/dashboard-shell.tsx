
"use client";

import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  MessageSquare,
  MessageCircle,
  CheckCircle2,
  CircleHelp,
  Compass,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Sprout,
  TrendingUp,
  UserRound,
  Users,
  Wheat,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

type DashboardNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  listingId: string;
  inquiryId: string;
  read: boolean;
  createdAt: string | Date | null;
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

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Marketplace", href: "/products", icon: ShoppingBag },
  { label: "Add Listing", href: "/dashboard/create-listing", icon: Plus, listingOnly: true },
  { label: "My Listings", href: "/dashboard/my-listings", icon: Package },
  { label: "Messages", href: "/dashboard/messages", icon: MessageCircle },
  { label: "Inquiries", href: "/dashboard/inquiries", icon: MessageSquare },
  { label: "My activity", href: "/dashboard#activity", icon: Activity },
];

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

function Sidebar({
  user,
  mobileOpen,
  onClose,
}: {
  user: DashboardUser;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-[#e6e9e1] bg-white transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[82px] items-center justify-between border-b border-[#edf0e9] px-6">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#17472D] text-white">
              <Sprout size={23} strokeWidth={1.8} />
            </span>

            <span>
              <span className="block text-[20px] font-bold tracking-tight text-[#17472D]">
                AgriVanta
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-[#879084]">
                Agriculture connected
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <div className="px-4 pt-7">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9aa294]">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation
              .filter((item) => !("listingOnly" in item) || user.role !== "buyer")
              .map((item) => {
              const active =
                (item.href === "/dashboard" && pathname === "/dashboard") ||
                (item.href !== "/dashboard" &&
                  !item.href.includes("#") &&
                  pathname === item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold transition ${
                    active
                      ? "bg-[#EAF0E6] text-[#17472D]"
                      : "text-[#6c766b] hover:bg-[#f5f7f2] hover:text-[#17472D]"
                  }`}
                >
                  <item.icon size={18} strokeWidth={1.9} />
                  <span>{item.label}</span>

                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#D9A441]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-8 px-4">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9aa294]">
            Your account
          </p>

          <div className="space-y-1">
            <Link
              href="/dashboard#account"
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold text-[#6c766b] transition hover:bg-[#f5f7f2] hover:text-[#17472D]"
            >
              <UserRound size={18} strokeWidth={1.9} />
              Account details
            </Link>

            <Link
              href="/dashboard#help"
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold text-[#6c766b] transition hover:bg-[#f5f7f2] hover:text-[#17472D]"
            >
              <CircleHelp size={18} strokeWidth={1.9} />
              Help & support
            </Link>
          </div>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-2xl bg-[#F8F6EE] p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#17472D]">
              <Leaf size={19} />
            </div>

            <p className="text-[13px] font-bold text-[#17472D]">
              Powering every link
            </p>

            <p className="mt-1 text-[11px] leading-5 text-[#778071]">
              Connecting people and opportunities across agriculture.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-[#edf0e9] px-2 pt-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#17472D] text-sm font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-bold text-[#26372b]">
                {user.name}
              </p>
              <p className="truncate text-[11px] text-[#879084]">
                {roleDetails[user.role].label}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function DashboardShell({
  user,
  stats,
  recentListings,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const router = useRouter();

  async function loadNotifications() {
    try {
      const response = await fetch("/api/notifications", {
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = await response.json();
      setNotifications(
        Array.isArray(data.notifications) ? data.notifications : []
      );
      setUnreadCount(
        typeof data.unreadCount === "number" ? data.unreadCount : 0
      );
    } catch (error) {
      console.error("Unable to load notifications:", error);
    }
  }

  useEffect(() => {
    void loadNotifications();

    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  async function markNotificationAsRead(notificationId: string) {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      if (!response.ok) {
        throw new Error("Unable to mark notification as read.");
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount((count) => Math.max(0, count - 1));
      const selectedNotification = notifications.find(
        (notification) => notification.id === notificationId
      );
      router.push(
        selectedNotification?.inquiryId
          ? `/dashboard/messages/${selectedNotification.inquiryId}`
          : "/dashboard/inquiries"
      );
    } catch (error) {
      console.error(error);
      await loadNotifications();
    }
  }

  async function markAllNotificationsAsRead() {
    setNotificationsLoading(true);

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });

      if (!response.ok) {
        throw new Error("Unable to mark notifications as read.");
      }

      setNotifications((current) =>
        current.map((notification) => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error(error);
      await loadNotifications();
    } finally {
      setNotificationsLoading(false);
    }
  }

  const details = roleDetails[user.role];
  const actions = roleActions[user.role];

  const filteredListings = recentListings.filter((listing) => {
    const searchText = search.toLowerCase().trim();

    return (
      !searchText ||
      listing.title.toLowerCase().includes(searchText) ||
      listing.category.toLowerCase().includes(searchText) ||
      listing.location.toLowerCase().includes(searchText)
    );
  });

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Unable to log out.");
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
      window.alert("We could not log you out. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8F4] text-[#243629]">
      <Sidebar
        user={user}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="min-h-screen lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between gap-4 border-b border-[#e8ebe4] bg-white/95 px-4 backdrop-blur sm:px-7 xl:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-[#e7eae2] p-2.5 text-[#17472D] hover:bg-[#f5f7f2] lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium text-[#929a8e]">
                AgriVanta / Workspace
              </p>
              <h1 className="truncate text-[15px] font-bold text-[#23382a] sm:text-[17px]">
                Dashboard overview
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <label className="hidden h-10 w-56 items-center gap-2 rounded-xl border border-[#e7eae2] bg-[#fbfcf9] px-3 focus-within:border-[#17472D] md:flex xl:w-64">
              <Search size={16} className="shrink-0 text-[#8b9487]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search recent listings"
                aria-label="Search recent listings"
                className="w-full bg-transparent text-xs text-[#243629] outline-none placeholder:text-[#9ca397]"
              />
            </label>

            <div className="relative">
              <button
                type="button"
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                aria-expanded={notificationsOpen}
                title="Notifications"
                onClick={() => {
                  setNotificationsOpen((open) => !open);
                  void loadNotifications();
                }}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#e7eae2] text-[#657365] transition hover:bg-[#f5f7f2]"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D9A441] px-1 text-[10px] font-bold text-[#17472D]">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close notifications"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setNotificationsOpen(false)}
                  />

                  <div className="absolute right-0 z-50 mt-3 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#e8ebe4] bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-[#edf0e9] px-4 py-4">
                      <div>
                        <h3 className="text-sm font-bold text-[#17472D]">Notifications</h3>
                        <p className="mt-1 text-[11px] text-[#879084]">
                          {unreadCount} unread
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          disabled={notificationsLoading}
                          onClick={() => void markAllNotificationsAsRead()}
                          className="text-[11px] font-semibold text-[#17472D] hover:underline disabled:opacity-50"
                        >
                          {notificationsLoading ? "Updating..." : "Mark all read"}
                        </button>
                      )}
                    </div>

                    <div className="max-h-[360px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                          <Bell size={25} className="mx-auto text-[#a0aa9b]" />
                          <p className="mt-3 text-sm font-semibold text-[#26372b]">
                            No notifications yet
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[#879084]">
                            New inquiry notifications will appear here.
                          </p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => {
                              setNotificationsOpen(false);
                              if (!notification.read) {
                                void markNotificationAsRead(notification.id);
                              } else {
                                router.push(
                                  notification.inquiryId
                                    ? `/dashboard/messages/${notification.inquiryId}`
                                    : "/dashboard/inquiries"
                                );
                              }
                            }}
                            className={`flex w-full gap-3 border-b border-[#edf0e9] px-4 py-4 text-left transition hover:bg-[#f7f8f4] ${
                              notification.read ? "bg-white" : "bg-[#F8F6EE]"
                            }`}
                          >
                            <span
                              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                                notification.read ? "bg-transparent" : "bg-[#D9A441]"
                              }`}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-xs font-bold text-[#26372b]">
                                {notification.title}
                              </span>
                              <span className="mt-1 block text-xs leading-5 text-[#778071]">
                                {notification.message}
                              </span>
                              <span className="mt-2 block text-[10px] text-[#9aa294]">
                                {notification.createdAt
                                  ? new Date(String(notification.createdAt)).toLocaleString("en-GH", {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    })
                                  : "Recently"}
                              </span>
                            </span>
                          </button>
                        ))
                      )}
                    </div>

                    <Link
                      href="/dashboard/messages"
                      onClick={() => setNotificationsOpen(false)}
                      className="block border-t border-[#edf0e9] px-4 py-3 text-center text-xs font-bold text-[#17472D] hover:bg-[#f5f7f2]"
                    >
                      View all messages
                    </Link>
                  </div>
                </>
              )}
            </div>

            <div className="hidden h-8 w-px bg-[#e7eae2] sm:block" />

            <div className="hidden text-right sm:block">
              <p className="max-w-32 truncate text-xs font-bold text-[#26372b]">
                {user.name}
              </p>
              <p className="text-[10px] text-[#899286]">{details.label}</p>
            </div>

            <button
              type="button"
              title="Log out"
              aria-label="Log out"
              disabled={loggingOut}
              onClick={handleLogout}
              className="flex h-10 items-center gap-2 rounded-xl border border-[#e7eae2] px-3 text-xs font-semibold text-[#526252] transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
            >
              <LogOut size={16} />
              <span className="hidden md:inline">
                {loggingOut ? "Signing out..." : "Log out"}
              </span>
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 sm:py-9 xl:px-10">
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

          <section id="activity" className="mt-8 scroll-mt-24">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-[16px] font-bold tracking-tight text-[#26372b]">
                  Recently added listings
                </h3>
                <p className="mt-1 text-xs text-[#879084]">
                  The latest active products from the AgriVanta marketplace.
                </p>
              </div>

              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#17472D] hover:underline"
              >
                View all products <ArrowRight size={14} />
              </Link>
            </div>

            {filteredListings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#dce3d6] bg-white px-5 py-12 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF0E6] text-[#17472D]">
                  <Search size={22} />
                </span>

                <p className="mt-4 text-sm font-bold text-[#26372b]">
                  {search ? "No matching listings" : "No active listings yet"}
                </p>

                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#879084]">
                  {search
                    ? "Try another search term or browse the full marketplace."
                    : "When active listings are available, they will appear here."}
                </p>

                <Link
                  href="/products"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#17472D] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#103921]"
                >
                  Browse marketplace <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[#e8ebe4] bg-white">
                <div className="divide-y divide-[#edf0e9]">
                  {filteredListings.map((listing) => (
                    <Link
                      key={listing.id}
                      href="/products"
                      className="flex items-center gap-4 px-4 py-4 transition hover:bg-[#fbfcf9] sm:px-6"
                    >
                      <div className="flex h-[58px] w-[66px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#EAF0E6]">
                        {listing.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={listing.image}
                            alt={listing.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Wheat size={25} className="text-[#17472D]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-[#26372b]">
                          {listing.title}
                        </p>
                        <p className="mt-1 truncate text-[11px] text-[#879084]">
                          {listing.category} · {listing.location}
                        </p>
                        <p className="mt-1 text-[10px] text-[#a0a79b]">
                          {formatDate(listing.date)}
                        </p>
                      </div>

                      <div className="hidden shrink-0 text-right sm:block">
                        <p className="text-[13px] font-bold text-[#17472D]">
                          {formatPrice(listing.price)}
                        </p>
                        <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-[#658060]">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      </div>

                      <ArrowRight
                        size={16}
                        className="shrink-0 text-[#a3aa9e]"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}
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
              © {new Date().getFullYear()} AgriVanta. Powering Every Link in
              Agriculture.
            </p>
            <p className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#75966b]" />
              Connected agriculture, better opportunities.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
