
import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GlobalAccountNav from "@/components/global-account-nav";
import AssistPanel from "@/components/assist/AssistPanel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgriVanta | Agriculture Connected",
  description:
    "Connect farmers, buyers, suppliers, workers and agricultural experts across Ghana.",
};

function AccountNavFallback() {
  return (
    <header className="border-b border-[#E4E9E1] bg-white">
      <div className="mx-auto flex min-h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <span className="text-xl font-extrabold text-[#17472D]">
          AgriVanta
        </span>
        <div className="h-10 w-28 animate-pulse rounded-xl bg-[#F0F3ED]" />
      </div>
    </header>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <GlobalAccountNav />
        </Suspense>

        <AssistPanel />

        {children}
      </body>
    </html>
  );
}

