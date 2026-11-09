"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import GlobalAccountNav from "@/components/global-account-nav";
import RecentPageTracker from "@/components/recent-page-tracker";
import AssistPanel from "@/components/assist/AssistPanel";

function AppShellContent() {
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith("/admin");
  const isDashboardRoute =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  if (isAdminRoute) {
    return null;
  }

  return (
    <>
      <RecentPageTracker />
      {!isDashboardRoute && <GlobalAccountNav />}
      <AssistPanel />
    </>
  );
}

export default function AppShell() {
  return (
    <Suspense fallback={null}>
      <AppShellContent />
    </Suspense>
  );
}