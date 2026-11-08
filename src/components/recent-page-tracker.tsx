"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export type RecentPage = {
  path: string;
  title: string;
  visitedAt: number;
};

export const RECENT_PAGES_KEY = "agrivanta_recent_pages";
const MAX_RECENT_PAGES = 6;

const knownPages: Record<string, string> = {
  "/": "Home",
  "/products": "Marketplace",
  "/agriguide": "AgriGuide",
  "/weather": "Weather",
  "/news": "Agricultural News",
  "/reports": "Agricultural Reports",
  "/dashboard": "Dashboard",
  "/dashboard/create-listing": "Create Listing",
  "/dashboard/my-listings": "My Listings",
  "/dashboard/inquiries": "Inquiries",
  "/dashboard/messages": "Messages",
  "/dashboard/profile": "My Profile",
};

function getPageTitle(path: string): string {
  if (knownPages[path]) return knownPages[path];

  if (path.startsWith("/products/")) return "Product Details";
  if (path.startsWith("/news/")) return "Read News";
  if (path.startsWith("/reports/")) return "Read Report";
  if (path.startsWith("/dashboard/messages/")) return "Conversation";

  return path
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Page";
}

export default function RecentPageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (
      !pathname ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/api") ||
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/verify-email"
    ) {
      return;
    }

    try {
      const stored = localStorage.getItem(RECENT_PAGES_KEY);
      const parsed: unknown = stored ? JSON.parse(stored) : [];

      const recentPages: RecentPage[] = Array.isArray(parsed)
        ? parsed.filter(
            (item): item is RecentPage =>
              item &&
              typeof item.path === "string" &&
              typeof item.title === "string" &&
              typeof item.visitedAt === "number"
          )
        : [];

      const updatedPages: RecentPage[] = [
        {
          path: pathname,
          title: getPageTitle(pathname),
          visitedAt: Date.now(),
        },
        ...recentPages.filter((page) => page.path !== pathname),
      ].slice(0, MAX_RECENT_PAGES);

      localStorage.setItem(
        RECENT_PAGES_KEY,
        JSON.stringify(updatedPages)
      );

      window.dispatchEvent(new Event("agrivanta:recent-pages-updated"));
    } catch (error) {
      console.error("Unable to update recent pages:", error);
    }
  }, [pathname]);

  return null;
}