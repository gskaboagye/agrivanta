"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  LogIn,
  LogOut,
  Sprout,
  UserRound,
  UserCircle,
  Menu,
  X,
  CloudSun,
  Store,
  MessageCircle,
  FolderOpen,
  BookOpen,
} from "lucide-react";

type AccountRole = "farmer" | "buyer" | "supplier" | "worker" | "expert";

type AccountUser = {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
};

const roleLabels: Record<AccountRole, string> = {
  farmer: "Farmer",
  buyer: "Buyer",
  supplier: "Supplier",
  worker: "Agricultural Worker",
  expert: "Agricultural Expert",
};

const navigationLinks = [
  { label: "Marketplace", href: "/products", icon: Store },
  { label: "Categories", href: "/#categories", icon: FolderOpen },
  { label: "AgriGuide", href: "/agriguide", icon: MessageCircle },
  { label: "Weather", href: "/weather", icon: CloudSun },
  { label: "How it works", href: "/#how-it-works", icon: BookOpen },
];

export default function GlobalAccountNav() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadAccount() {
      setLoading(true);

      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();

        if (
          data.user &&
          typeof data.user.id === "string" &&
          typeof data.user.name === "string" &&
          typeof data.user.email === "string" &&
          typeof data.user.role === "string" &&
          data.user.role in roleLabels
        ) {
          setUser(data.user as AccountUser);
        } else {
          setUser(null);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        console.error("Unable to load account information:", err);
        setUser(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    setMenuOpen(false);
    setMobileMenuOpen(false);
    void loadAccount();

    return () => controller.abort();
  }, [pathname]);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setError("");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Unable to sign out.");
      }

      setUser(null);
      setMenuOpen(false);
      setMobileMenuOpen(false);

      router.replace("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
      setError("Unable to sign out. Please try again.");
      setLoggingOut(false);
    }
  }

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  const linkClass =
    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#526252] transition hover:bg-[#EAF0E6] hover:text-[#17472D] lg:rounded-lg lg:px-2 lg:py-2";

  return (
    <header className="relative z-50 border-b border-[#E4E9E1] bg-white">
      <div className="mx-auto flex min-h-[68px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">

        {/* Brand */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="AgriVanta home"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#17472D] text-white">
            <Sprout size={23} />
          </span>

          <span className="text-xl font-extrabold tracking-tight text-[#17472D]">
            AgriVanta
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-2 xl:flex"
        >
          {navigationLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  pathname === item.href
                    ? "bg-[#EAF0E6] text-[#17472D]"
                    : "text-[#526252] hover:bg-[#F1F4ED] hover:text-[#17472D]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Account controls */}
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">

          {loading ? (
            <div
              className="h-10 w-20 animate-pulse rounded-xl bg-[#F0F3ED] sm:w-28"
              aria-label="Loading account"
            />
          ) : user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-xl border border-[#E3E9E0] bg-white px-2 py-2 transition hover:bg-[#F7F9F5] sm:gap-3 sm:px-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF0E6] text-[#17472D]">
                  <UserRound size={19} />
                </span>

                <span className="hidden min-w-0 text-left sm:block">
                  <span className="block max-w-36 truncate text-sm font-bold text-[#243629]">
                    {user.name}
                  </span>
                  <span className="block text-[11px] text-[#778071]">
                    {roleLabels[user.role]}
                  </span>
                </span>

                <ChevronDown
                  size={16}
                  className={`text-[#718071] transition ${
                    menuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {menuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close account menu"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setMenuOpen(false)}
                  />

                  <div
                    role="menu"
                    className="absolute right-0 z-50 mt-3 w-[min(290px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#E4E9E1] bg-white shadow-xl"
                  >
                    <div className="border-b border-[#EDF0E9] bg-[#F8F9F5] p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#17472D] text-white">
                          <UserCircle size={25} />
                        </span>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#243629]">
                            {user.name}
                          </p>
                          <p className="truncate text-xs text-[#778071]">
                            {user.email}
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-[#17472D]">
                            {roleLabels[user.role]}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 p-2">
                      <Link
                        href="/dashboard"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-[#344536] transition hover:bg-[#EAF0E6] hover:text-[#17472D]"
                      >
                        <LayoutDashboard size={18} />
                        My Dashboard
                      </Link>

                      <Link
                        href="/dashboard/profile"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-[#344536] transition hover:bg-[#EAF0E6] hover:text-[#17472D]"
                      >
                        <UserRound size={18} />
                        My Profile
                      </Link>

                      <div className="my-1 border-t border-[#EDF0E9]" />

                      <button
                        type="button"
                        role="menuitem"
                        disabled={loggingOut}
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <LogOut size={18} />
                        {loggingOut ? "Signing out..." : "Sign out"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#17472D] transition hover:bg-[#F1F4ED]"
              >
                <LogIn size={16} />
                Log in
              </Link>

              <Link
                href="/register"
                className="rounded-lg bg-[#17472D] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#235B3A]"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E3E9E0] text-[#17472D] transition hover:bg-[#F1F4ED] xl:hidden"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile and tablet navigation */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-[#E4E9E1] bg-white px-4 pb-5 pt-3 shadow-lg xl:hidden sm:px-6"
        >
          <nav
            aria-label="Mobile navigation"
            className="mx-auto flex max-w-7xl flex-col gap-1"
          >
            {navigationLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={linkClass}
                >
                  <Icon size={19} className="shrink-0 text-[#17472D]" />
                  {item.label}
                </Link>
              );
            })}

            {!user && !loading && (
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#EDF0E9] pt-4 sm:hidden">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#17472D] px-3 py-3 text-sm font-bold text-[#17472D]"
                >
                  <LogIn size={17} />
                  Log in
                </Link>

                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-xl bg-[#17472D] px-3 py-3 text-sm font-bold text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="border-t border-red-100 bg-red-50 px-4 py-2 text-center text-xs text-red-700"
        >
          {error}
        </p>
      )}
    </header>
  );
}