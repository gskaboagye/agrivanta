
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, LoaderCircle, ArrowRight } from "lucide-react";

type Inquiry = {
  id: string;
  listingTitle: string;
  listingId: string;
  buyerName: string;
  sellerName: string;
  message: string;
  updatedAt: string | null;
};

export default function MessagesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/inquiries?view=all", {
          credentials: "include",
          cache: "no-store",
        });

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load conversations.");
        }

        setInquiries(Array.isArray(data.inquiries) ? data.inquiries : []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load conversations."
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <main className="min-h-screen bg-[#F8F6EE] px-4 py-8 text-[#203B2A] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9A762C]">
          AgriVanta marketplace
        </p>

        <h1 className="mt-2 text-3xl font-bold">Messages</h1>

        <p className="mt-2 text-sm leading-6 text-[#68776A]">
          Communicate with buyers and sellers about your agricultural listings.
        </p>

        {error && (
          <div role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl bg-white p-12 text-sm">
            <LoaderCircle className="animate-spin" size={20} />
            Loading conversations...
          </div>
        ) : inquiries.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[#CCD8C7] bg-white px-6 py-16 text-center">
            <MessageCircle size={32} className="mx-auto text-[#17472D]" />
            <h2 className="mt-4 text-lg font-bold">No conversations yet</h2>
            <p className="mt-2 text-sm text-[#68776A]">
              Contact a seller through the marketplace to start a conversation.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex rounded-xl bg-[#17472D] px-5 py-3 text-sm font-semibold text-white hover:bg-[#235C3B]"
            >
              Explore marketplace
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {inquiries.map((inquiry) => (
              <Link
                key={inquiry.id}
                href={`/dashboard/messages/${inquiry.id}`}
                className="flex items-center gap-4 rounded-2xl border border-[#E0E5D9] bg-white p-5 transition hover:border-[#B9CBB2] hover:shadow-sm"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EAF0E6] text-[#17472D]">
                  <MessageCircle size={22} />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-bold">{inquiry.listingTitle}</h2>
                  <p className="mt-1 text-sm text-[#68776A]">
                    {inquiry.message}
                  </p>
                  {inquiry.updatedAt && (
                    <p className="mt-2 text-xs text-[#879084]">
                      Updated{" "}
                      {new Date(inquiry.updatedAt).toLocaleString("en-GH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  )}
                </div>

                <ArrowRight size={18} className="shrink-0 text-[#879084]" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
