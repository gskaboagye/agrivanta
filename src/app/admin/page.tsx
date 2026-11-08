import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  Leaf,
  Users,
  ShoppingBag,
  Newspaper,
  BarChart3,
  Settings,
  ShieldCheck,
  ArrowUpRight,
  LayoutDashboard,
  Lock,
} from "lucide-react";

import { getCurrentAdmin } from "@/lib/admin-auth";
import AdminLogoutButton from "@/components/admin/admin-logout-button";
import AdminAnalytics from "@/components/admin/admin-analytics";

const managementSections = [
  {
    title: "User Management",
    description: "Manage farmers, buyers, suppliers, workers and experts.",
    icon: Users,
    href: "/admin/users",
    enabled: true,
  },
  {
    title: "Marketplace Oversight",
    description: "Monitor agricultural products and marketplace listings.",
    icon: ShoppingBag,
    href: "/admin/listings",
    enabled: true,
  },
  {
    title: "Agricultural News",
    description: "Manage agricultural updates and platform announcements.",
    icon: Newspaper,
    href: "/admin/news",
    enabled: true,
  },
  {
    title: "Reports & Analytics",
    description: "Review platform activity and performance.",
    icon: BarChart3,
    href: "/admin/reports",
    enabled: true,
  },
  {
    title: "Platform Settings",
    description: "Manage administrative and platform configurations.",
    icon: Settings,
    href: "/admin/settings",
    enabled: true,
  },
];

async function AdminDashboardContent() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-[#F7F8F4] text-[#26372b]">
      <header className="border-b border-[#e5e9e1] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#17472D] text-white">
              <Leaf size={21} />
            </span>

            <span>
              <span className="block text-lg font-extrabold tracking-tight text-[#17472D]">
                AgriVanta
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-[#899487]">
                Administration
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-[#354737]">
                {admin.name}
              </p>
              <p className="text-xs text-[#899487]">
                {admin.email}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#17472D]/10 text-sm font-bold text-[#17472D]">
              {admin.name.charAt(0).toUpperCase()}
            </div>

            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#74816f]">
              <LayoutDashboard size={15} />
              Administrator dashboard
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-[#17472D] sm:text-3xl">
              Welcome back, {admin.name.split(" ")[0]}
            </h1>

            <p className="mt-2 text-sm text-[#7c8879]">
              Manage and oversee the AgriVanta agricultural platform.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full border border-[#dfe9dc] bg-white px-3 py-2">
            <ShieldCheck size={16} className="text-[#17472D]" />
            <span className="text-xs font-bold text-[#42634a]">
              Administrator account active
            </span>
          </div>
        </div>

        {/* Administrator summary */}
        <section className="mb-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#e5e9e1] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#899487]">
              Signed-in administrator
            </p>
            <p className="mt-3 truncate text-lg font-bold text-[#17472D]">
              {admin.name}
            </p>
            <p className="mt-1 truncate text-xs text-[#899487]">
              {admin.email}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e5e9e1] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#899487]">
              Account status
            </p>
            <p className="mt-3 text-lg font-bold capitalize text-[#17472D]">
              {admin.status}
            </p>
            <p className="mt-1 text-xs text-[#899487]">
              Administrator access is enabled.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e5e9e1] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#899487]">
              Portal security
            </p>
            <p className="mt-3 text-lg font-bold text-[#17472D]">
              Protected
            </p>
            <p className="mt-1 text-xs text-[#899487]">
              Server-side administrator authentication.
            </p>
          </div>
        </section>

        {/* Registration analytics */}
        <AdminAnalytics />

        {/* Platform management */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-bold text-[#26372b]">
              Platform management
            </h2>
            <p className="mt-1 text-sm text-[#899487]">
              Administrative tools and platform operations.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {managementSections.map((section) => {
              const Icon = section.icon;

              const cardContent = (
                <div
                  className={`h-full rounded-2xl border bg-white p-5 transition ${
                    section.enabled
                      ? "border-[#e5e9e1] hover:border-[#c8d8c7] hover:shadow-md"
                      : "border-[#e5e9e1] opacity-75"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#17472D]/10 text-[#17472D]">
                      <Icon size={21} />
                    </span>

                    {section.enabled ? (
                      <ArrowUpRight
                        size={18}
                        className="text-[#a0a99c] transition group-hover:text-[#17472D]"
                      />
                    ) : (
                      <Lock size={16} className="text-[#a0a99c]" />
                    )}
                  </div>

                  <h3 className="mt-5 text-base font-bold text-[#354737]">
                    {section.title}
                  </h3>

                  <p className="mt-2 min-h-10 text-sm leading-5 text-[#899487]">
                    {section.description}
                  </p>

                  <p className="mt-4 text-xs font-bold text-[#17472D]">
                    {section.enabled ? "Open section" : "Coming next"}
                  </p>
                </div>
              );

              return section.enabled ? (
                <Link
                  key={section.title}
                  href={section.href}
                  className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#17472D] focus-visible:ring-offset-4"
                >
                  {cardContent}
                </Link>
              ) : (
                <div key={section.title} className="cursor-not-allowed">
                  {cardContent}
                </div>
              );
            })}
          </div>
        </section>

        <footer className="mt-12 border-t border-[#e5e9e1] pt-5 text-center text-xs text-[#9aa394]">
          AgriVanta Administrator Portal
        </footer>
      </div>
    </main>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F7F8F4]">
          <p className="text-sm font-medium text-[#17472D]">
            Loading administrator dashboard...
          </p>
        </main>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}