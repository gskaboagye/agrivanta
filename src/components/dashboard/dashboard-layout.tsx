
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  BookOpen,
  CloudSun,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquare,
  Package,
  Plus,
  ShoppingBag,
  Sprout,
  UserRound,
  CircleHelp,
  X,
} from "lucide-react";
import type { AuthUser, AccountRole } from "@/lib/auth";

type Props = {
  user: AuthUser;
  children: React.ReactNode;
};

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Marketplace", href: "/products", icon: ShoppingBag },

  {
    label: "Add Listing",
    href: "/dashboard/create-listing",
    icon: Plus,
    hiddenFor: ["buyer"],
  },
  {
    label: "My Listings",
    href: "/dashboard/my-listings",
    icon: Package,
    hiddenFor: ["buyer"],
  },
  {
    label: "Inquiries",
    href: "/dashboard/inquiries",
    icon: MessageSquare,
    hiddenFor: ["buyer"],
  },
  {
    label: "My Inquiries",
    href: "/dashboard/inquiries?view=sent",
    icon: MessageSquare,
    onlyFor: ["buyer"],
  },
  {
    label: "Messages",
    href: "/dashboard/messages",
    icon: MessageCircle,
  },
  {
    label: "My Reports",
    href: "/dashboard/reports",
    icon: Flag,
  },
  {
    label: "AgriGuide",
    href: "/agriguide",
    icon: BookOpen,
    allowedRoles: ["farmer", "supplier"],
  },
  {
    label: "Weather",
    href: "/weather",
    icon: CloudSun,
    allowedRoles: ["farmer", "supplier"],
  },
  {
    label: "My Activity",
    href: "/dashboard#activity",
    icon: Activity,
    hiddenFor: ["buyer"],
  },
] as const;

const roleLabels: Record<AccountRole, string> = {
  farmer: "Farmer",
  buyer: "Buyer",
  supplier: "Supplier",
  worker: "Agricultural Worker",
  expert: "Agricultural Expert",
};

export default function DashboardLayout({ user, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    {
      id: string;
      title: string;
      message: string;
      read: boolean;
      inquiryId?: string;
      createdAt?: string | Date | null;
    }[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);

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
      console.error("Unable to load dashboard notifications:", error);
    }
  }

  useEffect(() => {
    void loadNotifications();

    const interval = window.setInterval(
      () => void loadNotifications(),
      30000
    );

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

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

      const selected = notifications.find(
        (item) => item.id === notificationId
      );

      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId ? { ...item, read: true } : item
        )
      );

      setUnreadCount((count) => Math.max(0, count - 1));
      setNotificationsOpen(false);

      router.push(
        selected?.inquiryId
          ? `/dashboard/messages/${selected.inquiryId}`
          : user.role === "buyer"
            ? "/dashboard/inquiries?view=sent"
            : "/dashboard/inquiries"
      );
    } catch (error) {
      console.error(error);
      await loadNotifications();
    }
  }

  async function markAllAsRead() {
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
        current.map((item) => ({ ...item, read: true }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(error);
      await loadNotifications();
    }
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to sign out.");
      }

      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("agrivanta_session_activity");
        channel.postMessage({ type: "logout" });
        channel.close();
      }

      try {
        localStorage.removeItem("agrivanta_last_activity");
      } catch {
        console.warn("Unable to clear session activity timestamp.");
      }

      window.location.replace("/login");
    } catch (error) {
      console.error("Dashboard logout failed:", error);
      window.alert("Unable to sign out. Please try again.");
      setLoggingOut(false);
    }
  }

  const visibleNavigation = navigation.filter((item) => {
    if (
      "hiddenFor" in item &&
      item.hiddenFor.some((role) => role === user.role)
    ) {
      return false;
    }

    if (
      "onlyFor" in item &&
      !item.onlyFor.some((role) => role === user.role)
    ) {
      return false;
    }

    if (
      "allowedRoles" in item &&
      !item.allowedRoles.some((role) => role === user.role)
    ) {
      return false;
    }

    return true;
  });

  const pageTitle =
    visibleNavigation.find((item) => {
      const itemPath = item.href.split("?")[0].split("#")[0];

      return itemPath === "/dashboard"
        ? pathname === itemPath
        : pathname === itemPath ||
            pathname.startsWith(`${itemPath}/`);
    })?.label || "Dashboard";

  return (
    <div className="min-h-screen min-w-0 bg-[#F7F8F4] text-[#243629]">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(280px,85vw)] flex-col border-r border-[#e6e9e1] bg-white transition-transform duration-200 lg:w-[260px] lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#edf0e9] px-5">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#17472D] text-white">
              <Sprout size={22} />
            </span>

            <span className="min-w-0">
              <span className="block text-lg font-bold text-[#17472D]">
                AgriVanta
              </span>
              <span className="block truncate text-[10px] uppercase tracking-wider text-[#879084]">
                Agriculture connected
              </span>
            </span>
          </Link>

          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9aa294]">
            Workspace
          </p>

          <nav className="space-y-1">
            {visibleNavigation.map((item) => {
              const itemPath = item.href.split("?")[0].split("#")[0];

              const active =
                itemPath === "/dashboard"
                  ? pathname === itemPath
                  : !item.href.includes("#") &&
                    (pathname === itemPath ||
                      pathname.startsWith(`${itemPath}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold transition ${
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

          <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9aa294]">
            Your account
          </p>

          <div className="space-y-1">
            <Link
              href="/dashboard/profile"
              onClick={() => setMobileOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold text-[#6c766b] hover:bg-[#f5f7f2]"
            >
              <UserRound size={18} />
              Account details
            </Link>

            <Link
              href="/support-us"
              onClick={() => setMobileOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold text-[#6c766b] hover:bg-[#f5f7f2]"
            >
              <CircleHelp size={18} />
              Help &amp; support
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              <LogOut size={18} />
              {loggingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#edf0e9] p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#17472D] text-sm font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-[#26372b]">
                {user.name}
              </p>
              <p className="truncate text-[11px] text-[#879084]">
                {roleLabels[user.role]}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex min-h-[64px] items-center justify-between gap-3 border-b border-[#e8ebe4] bg-white/95 px-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e7eae2] text-[#17472D] hover:bg-[#f5f7f2] lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0">
              <p className="hidden truncate text-[11px] text-[#929a8e] sm:block">
                AgriVanta / Workspace
              </p>
              <h1 className="truncate text-sm font-bold text-[#23382a] sm:text-base">
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
              aria-expanded={notificationsOpen}
              onClick={() => {
                setNotificationsOpen((open) => !open);
                void loadNotifications();
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#e7eae2] text-[#657365] hover:bg-[#f5f7f2]"
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
                  onClick={() => setNotificationsOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />

                <div className="absolute right-0 z-50 mt-3 w-[min(360px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-[#e8ebe4] bg-white shadow-xl">
                  <div className="flex items-center justify-between gap-2 border-b border-[#edf0e9] px-4 py-3">
                    <div>
                      <h2 className="text-sm font-bold text-[#17472D]">
                        Notifications
                      </h2>
                      <p className="mt-1 text-[11px] text-[#879084]">
                        {unreadCount} unread
                      </p>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => void markAllAsRead()}
                        className="text-[11px] font-semibold text-[#17472D] hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[min(60dvh,360px)] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-5 py-10 text-center text-sm text-[#879084]">
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (!item.read) {
                              void markNotificationAsRead(item.id);
                            } else {
                              setNotificationsOpen(false);

                              router.push(
                                item.inquiryId
                                  ? `/dashboard/messages/${item.inquiryId}`
                                  : user.role === "buyer"
                                    ? "/dashboard/inquiries?view=sent"
                                    : "/dashboard/inquiries"
                              );
                            }
                          }}
                          className={`flex w-full gap-3 border-b border-[#edf0e9] px-4 py-4 text-left hover:bg-[#f7f8f4] ${
                            item.read ? "bg-white" : "bg-[#F8F6EE]"
                          }`}
                        >
                          <span
                            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                              item.read
                                ? "bg-transparent"
                                : "bg-[#D9A441]"
                            }`}
                          />

                          <span className="min-w-0 flex-1">
                            <span className="block break-words text-xs font-bold text-[#26372b]">
                              {item.title}
                            </span>
                            <span className="mt-1 block break-words text-xs leading-5 text-[#778071]">
                              {item.message}
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
        </header>

        <div className="w-full min-w-0">{children}</div>
      </div>
    </div>
  );
}
