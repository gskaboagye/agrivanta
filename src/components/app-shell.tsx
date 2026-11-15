"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import GlobalAccountNav from "@/components/global-account-nav";
import RecentPageTracker from "@/components/recent-page-tracker";
import AssistPanel from "@/components/assist/AssistPanel";
import SessionTimeout from "@/components/auth/session-timeout";

function AppShellContent() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keep server and initial client rendering identical.
  if (!mounted) {
    return null;
  }

  const isAdminRoute = pathname.startsWith("/admin");

  const isDashboardRoute =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  const authRoutes = [
    "/login",
    "/register",
    "/verify-account",
    "/forgot-password",
    "/reset-password",
  ];

  const isAuthRoute = authRoutes.includes(pathname);

  if (isAdminRoute) {
    return null;
  }

  return (
    <>
      <SessionTimeout />
      <RecentPageTracker />
      {!isDashboardRoute && !isAuthRoute && <GlobalAccountNav />}
      {!isAuthRoute && <AssistPanel />}
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
