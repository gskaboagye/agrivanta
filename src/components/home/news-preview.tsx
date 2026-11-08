"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays, Newspaper } from "lucide-react";

type NewsArticle = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  coverImage?: {
    url?: string;
  };
  author?: {
    name?: string;
  };
  publishedAt?: string | null;
  createdAt?: string;
};

type NewsResponse = {
  articles?: NewsArticle[];
};

export default function NewsPreview() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadNews() {
      try {
        const response = await fetch("/api/news?page=1", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load agricultural news.");
        }

        const data: NewsResponse = await response.json();

        if (active) {
          setArticles(
            Array.isArray(data.articles) ? data.articles.slice(0, 3) : []
          );
        }
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadNews();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="bg-[#F8F6EE] py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#17472D]">
              <Newspaper size={17} />
              Agricultural News
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-[#173B27] sm:text-4xl">
              Stay informed. Grow smarter.
            </h2>

            <p className="mt-3 leading-7 text-gray-600">
              Discover agricultural news, industry developments, and useful
              updates that matter to Ghanaian farmers and agribusinesses.
            </p>
          </div>

          <Link
            href="/news"
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#17472D] px-5 py-3 text-sm font-semibold text-[#17472D] transition hover:bg-[#17472D] hover:text-white"
          >
            Explore all news
            <ArrowRight size={17} />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse overflow-hidden rounded-2xl bg-white"
              >
                <div className="h-52 bg-gray-200" />
                <div className="space-y-3 p-6">
                  <div className="h-4 w-1/3 rounded bg-gray-200" />
                  <div className="h-6 w-full rounded bg-gray-200" />
                  <div className="h-4 w-full rounded bg-gray-200" />
                  <div className="h-4 w-2/3 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-600">
              Agricultural news is temporarily unavailable. Please try again
              later.
            </p>
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <Newspaper className="mx-auto mb-4 text-[#17472D]" size={32} />
            <h3 className="text-lg font-semibold text-[#173B27]">
              News and updates coming soon
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Our agricultural news stories will appear here once published.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => {
              const date = article.publishedAt || article.createdAt;

              return (
                <article
                  key={article.id}
                  className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <Link
                    href={`/news/${encodeURIComponent(article.slug)}`}
                    className="block"
                  >
                    <div className="relative h-52 overflow-hidden bg-[#E8EEE8]">
                      {article.coverImage?.url ? (
                        <Image
                          src={article.coverImage.url}
                          alt={article.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Newspaper
                            size={42}
                            className="text-[#17472D]/40"
                          />
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-medium">
                        <span className="rounded-full bg-[#E8F0E8] px-3 py-1 text-[#17472D]">
                          {article.category}
                        </span>

                        {date && (
                          <span className="inline-flex items-center gap-1 text-gray-500">
                            <CalendarDays size={13} />
                            {new Date(date).toLocaleDateString("en-GH", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>

                      <h3 className="line-clamp-2 text-lg font-bold leading-7 text-[#173B27] transition group-hover:text-[#36734A]">
                        {article.title}
                      </h3>

                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
                        {article.summary}
                      </p>

                      <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                        <span className="text-xs text-gray-500">
                          {article.author?.name || "AgriVanta Editorial"}
                        </span>

                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#17472D]">
                          Read article
                          <ArrowRight size={15} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
