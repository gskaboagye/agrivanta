"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Plus,
  Search,
  Newspaper,
  FileText,
  Eye,
  Edit3,
  Trash2,
  Send,
  Archive,
  RefreshCw,
  Loader2,
  X,
  ImagePlus,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Globe,
} from "lucide-react";
import NewsEditor from "@/components/admin/news-editor";

const CATEGORIES = [
  "Crop Production",
  "Livestock",
  "Agribusiness",
  "Agricultural Technology",
  "Agricultural Policy",
  "Fisheries",
  "Climate and Environment",
  "General Agriculture",
];

type CoverImage = {
  url: string;
  publicId: string;
};

type Article = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  coverImage: CoverImage | null;
  status: "draft" | "published";
  author: { id?: string; name?: string; email?: string } | null;
  createdAt: string | null;
  updatedAt: string | null;
  publishedAt: string | null;
};

type ArticleForm = {
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string;
  coverImage: CoverImage | null;
};

const EMPTY_FORM: ArticleForm = {
  title: "",
  summary: "",
  content: "",
  category: CATEGORIES[0],
  tags: "",
  coverImage: null,
};

function formatDate(value: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function StatusBadge({ status }: { status: string }) {
  const published = status === "published";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        published
          ? "bg-green-100 text-green-800"
          : "bg-amber-100 text-amber-800"
      }`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

export default function AgriculturalNewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>(CATEGORIES);
  const [overview, setOverview] = useState({
    totalArticles: 0,
    publishedArticles: 0,
    draftArticles: 0,
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [form, setForm] = useState<ArticleForm>(EMPTY_FORM);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
      });

      if (search.trim()) params.set("search", search.trim());
      if (category) params.set("category", category);
      if (status) params.set("status", status);

      const response = await fetch(
        `/api/admin/news?${params.toString()}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load agricultural news.");
      }

      setArticles(data.articles ?? []);
      setOverview(data.overview ?? {
        totalArticles: 0,
        publishedArticles: 0,
        draftArticles: 0,
      });
      setCategories(data.categories ?? CATEGORIES);
      setTotalPages(Math.max(1, data.pagination?.totalPages ?? 1));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load articles."
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, category, status]);

  useEffect(() => {
    void loadArticles();
  }, [loadArticles]);

  function openCreateEditor() {
    setEditingArticle(null);
    setForm(EMPTY_FORM);
    setNotice("");
    setError("");
    setEditorOpen(true);
  }

  function openEditEditor(article: Article) {
    setEditingArticle(article);
    setForm({
      title: article.title,
      summary: article.summary,
      content: article.content,
      category: article.category,
      tags: article.tags.join(", "),
      coverImage: article.coverImage,
    });
    setNotice("");
    setError("");
    setEditorOpen(true);
  }

  function closeEditor() {
    if (saving || uploading) return;

    setEditorOpen(false);
    setEditingArticle(null);
    setForm(EMPTY_FORM);
  }

  async function uploadCover(file: File) {
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/news/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Image upload failed.");
      }

      setForm((current) => ({
        ...current,
        coverImage: {
          url: data.image.url,
          publicId: data.image.publicId,
        },
      }));

      setNotice("Cover image uploaded successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to upload image."
      );
    } finally {
      setUploading(false);
    }
  }

  async function saveArticle(
    event: FormEvent<HTMLFormElement>,
    publish: boolean
  ) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const tags = form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const payload = {
        title: form.title.trim(),
        summary: form.summary.trim(),
        content: form.content,
        category: form.category,
        tags,
        coverImage: form.coverImage,
        ...(editingArticle
          ? {}
          : { status: publish ? "published" : "draft" }),
      };

      const response = await fetch(
        editingArticle
          ? `/api/admin/news/${editingArticle.id}`
          : "/api/admin/news",
        {
          method: editingArticle ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save article.");
      }

      setNotice(data.message || "Article saved successfully.");
      setEditorOpen(false);
      setEditingArticle(null);
      setForm(EMPTY_FORM);

      await loadArticles();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save article."
      );
    } finally {
      setSaving(false);
    }
  }

  async function changePublication(article: Article) {
    const nextStatus =
      article.status === "published" ? "draft" : "published";

    const confirmed = window.confirm(
      nextStatus === "published"
        ? `Publish "${article.title}"?`
        : `Unpublish "${article.title}"?`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/admin/news/${article.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update publication.");
      }

      setNotice(data.message);
      await loadArticles();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Publication update failed."
      );
    }
  }

  async function deleteArticle(article: Article) {
    const confirmed = window.confirm(
      `Permanently delete "${article.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/admin/news/${article.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete article.");
      }

      setNotice(data.message);
      await loadArticles();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete article."
      );
    }
  }

  function updateForm<K extends keyof ArticleForm>(
    key: K,
    value: ArticleForm[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="min-h-screen bg-[#F7F8F4] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#17472D]"
        >
          <ArrowLeft size={17} />
          Back to Admin Dashboard
        </Link>

        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#17472D]">
              <Newspaper size={18} />
              AGRIVANTA ADMINISTRATION
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Agricultural News
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Create, manage and publish agricultural news and updates.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/news/sources"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Globe size={17} />
              Trusted Sources
            </Link>

            <button
              onClick={openCreateEditor}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17472D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#103920]"
            >
              <Plus size={18} />
              Create Article
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {notice && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            {notice}
          </div>
        )}

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Total Articles",
              value: overview.totalArticles,
              icon: Newspaper,
              color: "text-blue-700",
              background: "bg-blue-50",
            },
            {
              label: "Published Articles",
              value: overview.publishedArticles,
              icon: Eye,
              color: "text-green-700",
              background: "bg-green-50",
            },
            {
              label: "Draft Articles",
              value: overview.draftArticles,
              icon: FileText,
              color: "text-amber-700",
              background: "bg-amber-50",
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`rounded-xl p-3 ${stat.background}`}>
                    <Icon size={23} className={stat.color} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search articles..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
            />
          </div>

          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#17472D]"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#17472D]"
          >
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>

          <button
            onClick={() => void loadArticles()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-bold text-gray-900">Article Library</h2>
              <p className="mt-1 text-xs text-gray-500">
                Manage your agricultural news publications.
              </p>
            </div>
            <span className="text-sm text-gray-500">
              {overview.totalArticles} total articles
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-gray-500">
              <Loader2 className="animate-spin" size={22} />
              Loading articles...
            </div>
          ) : articles.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 rounded-2xl bg-[#F0F4EE] p-4">
                <Newspaper size={32} className="text-[#17472D]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                No articles found
              </h3>
              <p className="mt-2 max-w-md text-sm text-gray-500">
                Create your first agricultural news article or adjust your search filters.
              </p>
              <button
                onClick={openCreateEditor}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#17472D] px-5 py-3 text-sm font-semibold text-white hover:bg-[#103920]"
              >
                <Plus size={17} />
                Create First Article
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {articles.map((article) => (
                <article
                  key={article.id}
                  className="flex flex-col gap-4 p-5 transition hover:bg-gray-50/70 sm:flex-row"
                >
                  {article.coverImage?.url ? (
                    <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-28 sm:w-40">
                      <Image
                        src={article.coverImage.url}
                        alt={article.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 160px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-28 w-full shrink-0 items-center justify-center rounded-xl bg-[#F0F4EE] sm:w-40">
                      <Newspaper size={30} className="text-[#17472D]/50" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={article.status} />
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                        {article.category}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900">
                      {article.title}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                      {article.summary}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>By {article.author?.name || "AgriVanta Admin"}</span>
                      <span>Created {formatDate(article.createdAt)}</span>
                      {article.publishedAt && (
                        <span>Published {formatDate(article.publishedAt)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <button
                      onClick={() => openEditEditor(article)}
                      title="Edit article"
                      className="rounded-lg border border-gray-200 p-2.5 text-gray-600 hover:border-[#17472D] hover:text-[#17472D]"
                    >
                      <Edit3 size={17} />
                    </button>

                    <button
                      onClick={() => void changePublication(article)}
                      title={article.status === "published" ? "Unpublish" : "Publish"}
                      className="rounded-lg border border-gray-200 p-2.5 text-gray-600 hover:border-[#17472D] hover:text-[#17472D]"
                    >
                      {article.status === "published" ? (
                        <Archive size={17} />
                      ) : (
                        <Send size={17} />
                      )}
                    </button>

                    <button
                      onClick={() => void deleteArticle(article)}
                      title="Delete article"
                      className="rounded-lg border border-gray-200 p-2.5 text-red-600 hover:border-red-300 hover:bg-red-50"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4">
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || loading}
                className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={page >= totalPages || loading}
                className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#DCE6D9] bg-[#F0F4EE] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold text-[#17472D]">
              Trusted Agricultural Publishers
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Manage external publishers and their news feeds separately from original AgriVanta articles.
            </p>
          </div>
          <Link
            href="/admin/news/sources"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#17472D]/20 bg-white px-4 py-3 text-sm font-semibold text-[#17472D] hover:bg-gray-50"
          >
            Manage Sources
            <ExternalLink size={16} />
          </Link>
        </div>
      </div>

      {editorOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-3 sm:p-6">
          <div className="mx-auto my-4 max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-7">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingArticle ? "Edit Article" : "Create Article"}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Write and manage original AgriVanta agricultural content.
                </p>
              </div>
              <button
                onClick={closeEditor}
                disabled={saving || uploading}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                aria-label="Close editor"
              >
                <X size={21} />
              </button>
            </div>

            <form
              onSubmit={(event) => void saveArticle(event, false)}
              className="space-y-6 p-5 sm:p-7"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Article title
                </label>
                <input
                  required
                  minLength={5}
                  maxLength={180}
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  placeholder="Enter a clear and informative headline"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
                />
                <p className="mt-1 text-xs text-gray-400">5–180 characters</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Article summary
                </label>
                <textarea
                  required
                  minLength={10}
                  maxLength={400}
                  rows={3}
                  value={form.summary}
                  onChange={(event) => updateForm("summary", event.target.value)}
                  placeholder="Write a short summary for readers..."
                  className="w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
                />
                <p className="mt-1 text-xs text-gray-400">10–400 characters</p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(event) => updateForm("category", event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#17472D]"
                  >
                    {categories.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Tags
                  </label>
                  <input
                    value={form.tags}
                    onChange={(event) => updateForm("tags", event.target.value)}
                    placeholder="farming, Ghana, crops"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#17472D]"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Separate tags with commas. Maximum 10.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Cover image
                </label>

                <div className="flex flex-col gap-4 rounded-xl border border-dashed border-gray-300 p-4 sm:flex-row sm:items-center">
                  {form.coverImage ? (
                    <div className="relative h-28 w-full overflow-hidden rounded-lg bg-gray-100 sm:w-40">
                      <Image
                        src={form.coverImage.url}
                        alt="Article cover preview"
                        fill
                        sizes="160px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-24 w-full items-center justify-center rounded-lg bg-gray-100 sm:w-40">
                      <ImagePlus size={28} className="text-gray-400" />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col gap-2">
                    <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                      {uploading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <ImagePlus size={16} />
                      )}
                      {uploading ? "Uploading..." : "Choose image"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        disabled={uploading}
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadCover(file);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>

                    <p className="text-xs text-gray-500">
                      JPG, PNG, WebP or AVIF. Maximum 10 MB.
                    </p>

                    {form.coverImage && (
                      <button
                        type="button"
                        onClick={() => updateForm("coverImage", null)}
                        className="w-fit text-xs font-semibold text-red-600 hover:underline"
                      >
                        Remove cover image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Article content
                </label>
                <NewsEditor
                  key={editingArticle?.id ?? "new-article"}
                  value={form.content}
                  onChange={(content) => updateForm("content", content)}
                  disabled={saving}
                />
                <p className="mt-2 text-xs text-gray-400">
                  Use the editor toolbar to format your article and insert images.
                </p>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-100 pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={closeEditor}
                  disabled={saving || uploading}
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                {!editingArticle && (
                  <button
                    type="button"
                    disabled={saving || uploading}
                    onClick={(event) => {
                      const formElement = event.currentTarget.form;
                      if (formElement) {
                        void saveArticle(
                          { preventDefault: () => {}, currentTarget: formElement } as FormEvent<HTMLFormElement>,
                          false
                        );
                      }
                    }}
                    className="rounded-xl border border-[#17472D] px-5 py-3 text-sm font-semibold text-[#17472D] hover:bg-[#F0F4EE] disabled:opacity-50"
                  >
                    Save as Draft
                  </button>
                )}

                <button
                  type="submit"
                  disabled={saving || uploading}
                  onClick={(event) => {
                    if (!editingArticle) return;
                    event.preventDefault();
                    const formElement = event.currentTarget.form;
                    if (formElement) {
                      void saveArticle(
                        { preventDefault: () => {}, currentTarget: formElement } as FormEvent<HTMLFormElement>,
                        false
                      );
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17472D] px-6 py-3 text-sm font-semibold text-white hover:bg-[#103920] disabled:opacity-50"
                >
                  {saving && <Loader2 size={17} className="animate-spin" />}
                  {saving
                    ? "Saving..."
                    : editingArticle
                      ? "Save Changes"
                      : "Publish Article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}