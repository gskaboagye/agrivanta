"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Search,
} from "lucide-react";

type Report = {
  id: string;
  title: string;
  description: string;
  category: string;
  type: "pdf" | "external";
  resource: {
    url: string;
    publicId?: string;
  };
  source?: string;
  publicationDate?: string;
  publishedAt?: string;
};

type ReportsResponse = {
  success: boolean;
  reports: Report[];
  categories: string[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
  message?: string;
};

const categories = [
  "All Categories",
  "Crop Production",
  "Livestock",
  "Agribusiness",
  "Agricultural Technology",
  "Agricultural Policy",
  "Fisheries",
  "Climate and Environment",
  "General Agriculture",
];

function formatDate(value?: string) {
  if (!value) return "Date not provided";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not provided";

  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadReports() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
        });

        if (search.trim()) params.set("search", search.trim());
        if (category !== "All Categories") {
          params.set("category", category);
        }

        const response = await fetch(`/api/reports?${params.toString()}`);
        const data: ReportsResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load reports.");
        }

        if (active) {
          setReports(data.reports || []);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotal(data.pagination?.total || 0);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Something went wrong."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReports();

    return () => {
      active = false;
    };
  }, [search, category, page]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
  }

  return (
    <main className="min-h-screen bg-[#F8F6EE] text-[#203629]">
      <section className="relative overflow-hidden bg-[#17472D] px-5 py-20 text-white sm:py-24">
        <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-8 -top-16 h-56 w-56 rounded-full border border-white/10" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/90">
            <BookOpen size={16} />
            Agricultural Knowledge Library
          </div>

          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Research and insights for a stronger agricultural future.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">
            Explore agricultural research, industry studies, policy
            publications and practical reports to support better decisions
            across Ghana&apos;s agricultural sector.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A17B2D]">
            Explore the library
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[#17472D] sm:text-3xl">
            Agricultural Reports
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Browse published research and resources from agricultural
            organisations and institutions.
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-[#E7E3D7] bg-white p-4 shadow-sm sm:p-5">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 md:flex-row"
          >
            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search reports, topics or organisations..."
                className="w-full rounded-xl border border-gray-200 bg-[#FCFCFA] py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
              />
            </div>

            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-gray-200 bg-[#FCFCFA] px-4 py-3.5 text-sm outline-none focus:border-[#17472D]"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="rounded-xl bg-[#17472D] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#103820]"
            >
              Search
            </button>
          </form>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            {loading ? "Loading reports..." : `${total} reports found`}
          </p>
          <p className="text-xs text-gray-500">
            Research, publications and agricultural resources
          </p>
        </div>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-2xl border border-gray-100 bg-white"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
            <p className="font-semibold text-red-700">{error}</p>
            <button
              onClick={() => setPage((current) => current)}
              className="mt-4 text-sm font-semibold text-[#17472D] underline"
            >
              Try again
            </button>
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D8D4C8] bg-white px-6 py-16 text-center">
            <FileText className="mx-auto text-[#A17B2D]" size={38} />
            <h3 className="mt-4 text-xl font-bold text-[#17472D]">
              No reports found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              There are no published reports matching your search. Try another
              keyword or category.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {reports.map((report) => (
              <article
                key={report.id}
                className="flex flex-col rounded-2xl border border-[#E7E3D7] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full bg-[#EEF4EC] px-3 py-1.5 text-xs font-semibold text-[#17472D]">
                    {report.category}
                  </span>

                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
                    {report.type === "pdf" ? (
                      <FileText size={14} />
                    ) : (
                      <ExternalLink size={14} />
                    )}
                    {report.type === "pdf" ? "PDF publication" : "External publication"}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-bold leading-snug text-[#17472D]">
                  {report.title}
                </h3>

                <p className="mt-3 flex-1 text-sm leading-7 text-gray-600">
                  {report.description}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
                  {report.source && (
                    <span className="font-medium text-gray-600">
                      {report.source}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={14} />
                    {formatDate(report.publicationDate || report.publishedAt)}
                  </span>
                </div>

                <div className="mt-5">
                  <a
                    href={report.resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#17472D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#103820]"
                  >
                    {report.type === "pdf" ? (
                      <>
                        <Download size={16} />
                        Open PDF report
                      </>
                    ) : (
                      <>
                        <ExternalLink size={16} />
                        Visit publication
                      </>
                    )}
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </section>

      <section className="bg-[#EDEFE5] px-5 py-14">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#A17B2D]">
              Keep learning
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#17472D]">
              Need practical agricultural guidance?
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
              Visit AgriGuide for helpful agricultural information and
              assistance.
            </p>
          </div>

          <Link
            href="/agriguide"
            className="rounded-xl bg-[#17472D] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#103820]"
          >
            Explore AgriGuide
          </Link>
        </div>
      </section>
    </main>
  );
}