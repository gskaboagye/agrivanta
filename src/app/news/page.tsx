"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  Search,
  Sprout,
  Tag,
} from "lucide-react";

type NewsArticle = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  tags: string[];
  coverImage?: {
    url?: string;
  } | null;
  author?: {
    name?: string;
  };
  publishedAt?: string | null;
  createdAt?: string | null;
};

type NewsResponse = {
  success: boolean;
  articles?: NewsArticle[];
  categories?: string[];
  pagination?: {
    page: number;
    pageSize: number;
    totalArticles: number;
    totalPages: number;
  };
  message?: string;
};

const FALLBACK_CATEGORIES = [
  "Crop Production",
  "Livestock",
  "Agribusiness",
  "Agricultural Technology",
  "Agricultural Policy",
  "Fisheries",
  "Climate and Environment",
  "General Agriculture",
];

function formatDate(value?: string | null) {
  if (!value) return "Recently published";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Recently published";

  return date.toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadNews() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
        });

        if (search) params.set("search", search);
        if (category) params.set("category", category);

        const response = await fetch(`/api/news?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const data: NewsResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load agricultural news.");
        }

        setArticles(Array.isArray(data.articles) ? data.articles : []);

        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        }

        setTotalArticles(data.pagination?.totalArticles ?? 0);
        setTotalPages(Math.max(1, data.pagination?.totalPages ?? 1));
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading news."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadNews();

    return () => controller.abort();
  }, [page, search, category]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleCategoryChange(value: string) {
    setCategory(value);
    setPage(1);
  }

  return (
    <main className="min-h-screen bg-[#F8F6EE] text-[#193D2A]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#17472D]">
        <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full border-[50px] border-white/5" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full border-[60px] border-white/5" />

        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#E8CA78]">
              <Newspaper size={15} />
              AgriVanta Newsroom
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              Agriculture is always moving.{" "}
              <span className="text-[#E6BD57]">Stay informed.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">
              Explore agricultural news, industry developments, farming
              innovations and important updates from Ghana and beyond.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium text-white/80">
              <span className="inline-flex items-center gap-2">
                <Sprout size={17} className="text-[#E6BD57]" />
                Farming and production
              </span>
              <span className="inline-flex items-center gap-2">
                <Tag size={17} className="text-[#E6BD57]" />
                Agribusiness and technology
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* News content */}
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-widest text-[#B48A2A]">
            Explore the latest
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-[#17472D] sm:text-3xl">
            Agricultural news and updates
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#718071] sm:text-base">
            Stay connected to developments affecting farmers, agricultural
            businesses and the wider food system.
          </p>
        </div>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="mb-5 flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#718071]"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search agricultural news..."
              className="w-full rounded-xl border border-[#E2E6DB] bg-white py-3.5 pl-12 pr-4 text-sm outline-none transition placeholder:text-[#9AA296] focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17472D] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#235B3A]"
          >
            <Search size={17} />
            Search
          </button>
        </form>

        {/* Categories */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="shrink-0 text-sm font-bold text-[#526252]">
            Filter by category:
          </span>

          <select
            value={category}
            onChange={(event) => handleCategoryChange(event.target.value)}
            className="w-full rounded-xl border border-[#E2E6DB] bg-white px-4 py-3 text-sm text-[#344536] outline-none focus:border-[#17472D] sm:max-w-xs"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          {(search || category) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSearchInput("");
                setCategory("");
                setPage(1);
              }}
              className="w-fit text-sm font-semibold text-[#17472D] underline underline-offset-4"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Results heading */}
        {!loading && !error && (
          <div className="mb-6 flex items-center justify-between border-b border-[#E2E6DB] pb-4">
            <p className="text-sm text-[#718071]">
              {totalArticles} {totalArticles === 1 ? "article" : "articles"}{" "}
              found
            </p>
            <span className="text-xs font-semibold text-[#17472D]">
              Page {page} of {totalPages}
            </span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="animate-pulse overflow-hidden rounded-2xl bg-white"
              >
                <div className="h-52 bg-[#E5E9E0]" />
                <div className="space-y-3 p-6">
                  <div className="h-4 w-1/3 rounded bg-[#E5E9E0]" />
                  <div className="h-6 rounded bg-[#E5E9E0]" />
                  <div className="h-4 rounded bg-[#E5E9E0]" />
                  <div className="h-4 w-2/3 rounded bg-[#E5E9E0]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-100 bg-white px-6 py-12 text-center">
            <Newspaper size={36} className="mx-auto text-red-400" />
            <h3 className="mt-4 text-lg font-bold text-[#17472D]">
              Unable to load news
            </h3>
            <p className="mt-2 text-sm text-[#718071]">{error}</p>
            <button
              type="button"
              onClick={() => setPage((current) => current)}
              className="mt-5 rounded-lg bg-[#17472D] px-5 py-3 text-sm font-bold text-white"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && articles.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#D8DFD3] bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF0E6] text-[#17472D]">
              <Newspaper size={30} />
            </div>
            <h3 className="mt-5 text-xl font-bold text-[#17472D]">
              No articles found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#718071]">
              There are no published articles matching your search right now.
              Try another keyword or category.
            </p>
            {(search || category) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSearchInput("");
                  setCategory("");
                  setPage(1);
                }}
                className="mt-5 rounded-lg bg-[#17472D] px-5 py-3 text-sm font-bold text-white"
              >
                View all news
              </button>
            )}
          </div>
        )}

        {/* Articles */}
        {!loading && !error && articles.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <article
                key={article.id}
                className="group overflow-hidden rounded-2xl border border-[#E7E4D9] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <Link
                  href={`/news/${encodeURIComponent(article.slug)}`}
                  className="block"
                >
                  <div className="relative h-52 overflow-hidden bg-[#E8EEE8]">
                    {article.coverImage?.url ? (
                      <img
                        src={article.coverImage.url}
                        alt={article.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Newspaper size={44} className="text-[#17472D]/30" />
                      </div>
                    )}
                    <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#17472D] shadow-sm">
                      {article.category}
                    </span>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-2 text-xs text-[#879084]">
                      <CalendarDays size={14} />
                      {formatDate(article.publishedAt || article.createdAt)}
                    </div>

                    <h3 className="mt-3 line-clamp-2 text-lg font-extrabold leading-7 text-[#17472D] transition group-hover:text-[#398153]">
                      {article.title}
                    </h3>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#718071]">
                      {article.summary}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-[#EDF0E9] pt-4">
                      <span className="max-w-[65%] truncate text-xs font-medium text-[#718071]">
                        {article.author?.name || "AgriVanta Editorial Team"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-[#17472D]">
                        Read more
                        <ArrowRight size={15} />
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => {
                setPage((current) => Math.max(1, current - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-[#DDE3D8] bg-white px-4 py-3 text-sm font-semibold text-[#17472D] transition hover:bg-[#EAF0E6] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={17} />
              Previous
            </button>

            <span className="rounded-lg bg-[#EAF0E6] px-4 py-3 text-sm font-bold text-[#17472D]">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => {
                setPage((current) => Math.min(totalPages, current + 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-[#DDE3D8] bg-white px-4 py-3 text-sm font-semibold text-[#17472D] transition hover:bg-[#EAF0E6] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={17} />
            </button>
          </div>
        )}
      </section>

      {/* Footer callout */}
      <section className="bg-[#EAF0E6]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <h2 className="text-xl font-extrabold text-[#17472D]">
              Agriculture grows with knowledge.
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#718071]">
              Explore practical farming guidance with AgriGuide.
            </p>
          </div>
          <Link
            href="/agriguide"
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#17472D] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#235B3A]"
          >
            Explore AgriGuide
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </main>
  );
}
