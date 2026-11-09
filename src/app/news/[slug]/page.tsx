"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  UserRound,
  Tag,
  Newspaper,
  RefreshCw,
} from "lucide-react";

type NewsArticle = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  tags: string[];
  coverImage: { url: string } | null;
  author: { name: string };
  createdAt: string | null;
  publishedAt: string | null;
  content: string;
};

export default function NewsArticlePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[65vh] items-center justify-center bg-[#F8F6EE] px-5">
          <p className="text-sm font-medium text-[#718071]">
            Loading agricultural news...
          </p>
        </main>
      }
    >
      <NewsArticleContent />
    </Suspense>
  );
}

function NewsArticleContent() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;

    const controller = new AbortController();

    async function loadArticle() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/news?slug=${encodeURIComponent(slug)}`,
          { signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok || !data.success || !data.article) {
          throw new Error(data.message || "Unable to load this article.");
        }

        setArticle(data.article);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading this article."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadArticle();

    return () => controller.abort();
  }, [slug]);

  const formattedDate = article?.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  if (loading) {
    return (
      <main className="flex min-h-[65vh] items-center justify-center bg-[#F8F6EE] px-5">
        <div className="text-center">
          <RefreshCw className="mx-auto animate-spin text-[#17472D]" size={32} />
          <p className="mt-4 text-sm font-medium text-[#718071]">
            Loading agricultural news...
          </p>
        </div>
      </main>
    );
  }

  if (error || !article) {
    return (
      <main className="flex min-h-[65vh] items-center justify-center bg-[#F8F6EE] px-5">
        <div className="max-w-md text-center">
          <Newspaper className="mx-auto text-[#17472D]" size={42} />
          <h1 className="mt-5 text-2xl font-extrabold text-[#17472D]">
            Article unavailable
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#718071]">
            {error || "We could not find the article you requested."}
          </p>
          <Link
            href="/news"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#17472D] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#235B3A]"
          >
            <ArrowLeft size={17} />
            Back to News
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F6EE]">
      <article className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:py-16">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#17472D] transition hover:text-[#B8872D]"
        >
          <ArrowLeft size={18} />
          Back to Agricultural News
        </Link>

        <header className="mx-auto mt-10 max-w-4xl">
          <span className="inline-flex rounded-full bg-[#E6BD57]/20 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#17472D]">
            {article.category}
          </span>

          <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight text-[#17472D] sm:text-4xl lg:text-5xl">
            {article.title}
          </h1>

          {article.summary && (
            <p className="mt-6 text-lg leading-8 text-[#718071]">
              {article.summary}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-[#DCE3D7] py-5 text-sm text-[#718071]">
            <span className="inline-flex items-center gap-2">
              <UserRound size={17} className="text-[#17472D]" />
              {article.author?.name || "AgriVanta Editorial Team"}
            </span>

            {formattedDate && (
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={17} className="text-[#17472D]" />
                {formattedDate}
              </span>
            )}
          </div>
        </header>

        {article.coverImage?.url && (
          <div className="mt-10 overflow-hidden rounded-2xl bg-[#EAF0E6]">
            <img
              src={article.coverImage.url}
              alt={article.title}
              className="max-h-[520px] w-full object-cover"
            />
          </div>
        )}

        <div className="mx-auto mt-12 max-w-4xl">
          <div
            className="news-article-content text-base leading-8 text-[#344638] sm:text-lg"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {article.tags?.length > 0 && (
            <div className="mt-12 border-t border-[#DCE3D7] pt-7">
              <div className="flex items-center gap-2 text-sm font-bold text-[#17472D]">
                <Tag size={17} />
                Article topics
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[#EAF0E6] px-4 py-2 text-xs font-semibold text-[#48624C]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <section className="mt-16 rounded-2xl bg-[#EAF0E6] px-6 py-9 text-center sm:px-10">
          <h2 className="text-2xl font-extrabold text-[#17472D]">
            Keep growing your agricultural knowledge.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#718071]">
            Explore more agricultural stories, insights, and practical
            information from AgriVanta.
          </p>
          <Link
            href="/news"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#17472D] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#235B3A]"
          >
            Explore More News
          </Link>
        </section>
      </article>
    </main>
  );
}