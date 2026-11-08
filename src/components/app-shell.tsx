"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import GlobalAccountNav from "@/components/global-account-nav";
import RecentPageTracker from "@/components/recent-page-tracker";
import AssistPanel from "@/components/assist/AssistPanel";

function AppShellContent() {
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return null;
  }

  return (
    <>
      <RecentPageTracker />
      <GlobalAccountNav />
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