"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Globe,
  Rss,
  Newspaper,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Loader2,
  Power,
  X,
} from "lucide-react";

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

type NewsSource = {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  feedUrl: string;
  type: "rss" | "api" | "website";
  category: string;
  country: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

type SourceForm = {
  name: string;
  description: string;
  websiteUrl: string;
  feedUrl: string;
  type: "rss" | "api" | "website";
  category: string;
  country: string;
};

const EMPTY_FORM: SourceForm = {
  name: "",
  description: "",
  websiteUrl: "",
  feedUrl: "",
  type: "rss",
  category: "General Agriculture",
  country: "Ghana",
};

function formatDate(value: string) {
  if (!value) return "Not available";

  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TrustedNewsSourcesPage() {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [overview, setOverview] = useState({
    totalSources: 0,
    activeSources: 0,
    inactiveSources: 0,
  });

  const [form, setForm] = useState<SourceForm>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadSources = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/news/sources", {
        credentials: "same-origin",
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load news sources.");
      }

      setSources(data.sources || []);
      setOverview(data.overview || {
        totalSources: 0,
        activeSources: 0,
        inactiveSources: 0,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load news sources."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSources();
  }, [loadSources]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/news/sources", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to register source.");
      }

      setSuccess("Trusted news source registered successfully.");
      setForm(EMPTY_FORM);
      setShowForm(false);
      await loadSources();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to register source."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleSource(source: NewsSource) {
    const nextStatus =
      source.status === "active" ? "inactive" : "active";

    if (
      !window.confirm(
        `${nextStatus === "active" ? "Activate" : "Deactivate"} ${source.name}?`
      )
    ) {
      return;
    }

    setBusyId(source.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/news/sources/${encodeURIComponent(source.id)}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update source.");
      }

      setSuccess(`${source.name} ${nextStatus === "active" ? "activated" : "deactivated"}.`);
      await loadSources();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update source."
      );
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F8F4] text-[#26372b]">
      <header className="border-b border-[#e5e9e1] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div>
            <Link
              href="/admin"
              className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-[#71806f] hover:text-[#17472D]"
            >
              <ArrowLeft size={15} />
              Back to dashboard
            </Link>

            <h1 className="text-xl font-extrabold text-[#17472D]">
              Trusted News Sources
            </h1>

            <p className="mt-1 text-xs text-[#899487]">
              Manage approved agricultural news publishers and feeds.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setError("");
              setSuccess("");
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#17472D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#103821]"
          >
            <Plus size={17} />
            <span className="hidden sm:inline">Add source</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Total sources",
              value: overview.totalSources,
              icon: Globe,
            },
            {
              label: "Active sources",
              value: overview.activeSources,
              icon: CheckCircle2,
            },
            {
              label: "Inactive sources",
              value: overview.inactiveSources,
              icon: XCircle,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-[#e5e9e1] bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#899487]">
                    {item.label}
                  </p>
                  <Icon size={19} className="text-[#17472D]" />
                </div>

                <p className="mt-3 text-3xl font-extrabold text-[#17472D]">
                  {item.value}
                </p>
              </div>
            );
          })}
        </section>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {success}
          </div>
        )}

        <section>
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-[#26372b]">
                Registered publishers
              </h2>
              <p className="mt-1 text-sm text-[#899487]">
                Only active sources will be eligible for future news collection.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadSources()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#dfe6dc] bg-white px-3 py-2 text-sm font-semibold text-[#526253] hover:bg-[#f5f8f3] disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-[#e5e9e1] bg-white p-12 text-center">
              <Loader2 className="mx-auto animate-spin text-[#17472D]" size={25} />
              <p className="mt-3 text-sm text-[#899487]">
                Loading trusted sources...
              </p>
            </div>
          ) : sources.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#cbd7c8] bg-white px-5 py-14 text-center">
              <Globe size={35} className="mx-auto text-[#9eaa99]" />
              <h3 className="mt-4 font-bold text-[#354737]">
                No trusted sources registered
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-[#899487]">
                Add your first agricultural publisher to prepare AgriVanta for automatic news collection.
              </p>

              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-5 rounded-xl bg-[#17472D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#103821]"
              >
                Register first source
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sources.map((source) => (
                <article
                  key={source.id}
                  className="rounded-2xl border border-[#e5e9e1] bg-white p-5 transition hover:border-[#cbd9c7] hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#17472D]/10 text-[#17472D]">
                      {source.type === "rss" ? (
                        <Rss size={21} />
                      ) : source.type === "api" ? (
                        <Globe size={21} />
                      ) : (
                        <Newspaper size={21} />
                      )}
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        source.status === "active"
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {source.status}
                    </span>
                  </div>

                  <h3 className="mt-5 text-base font-bold text-[#354737]">
                    {source.name}
                  </h3>

                  <p className="mt-2 min-h-10 text-sm leading-5 text-[#899487]">
                    {source.description || "No description provided."}
                  </p>

                  <div className="mt-4 space-y-3 border-t border-[#edf0eb] pt-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#9aa394]">
                        Category
                      </p>
                      <p className="mt-1 text-xs font-medium text-[#526253]">
                        {source.category}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#9aa394]">
                        Feed type
                      </p>
                      <p className="mt-1 text-xs font-medium uppercase text-[#526253]">
                        {source.type}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#9aa394]">
                        Country
                      </p>
                      <p className="mt-1 text-xs text-[#526253]">
                        {source.country || "Not specified"}
                      </p>
                    </div>

                    <div>
                      <a
                        href={source.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#17472D] hover:underline"
                      >
                        Visit publisher
                        <ExternalLink size={12} />
                      </a>
                    </div>

                    <p className="text-[11px] text-[#9aa394]">
                      Added {formatDate(source.createdAt)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void toggleSource(source)}
                    disabled={busyId === source.id}
                    className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                      source.status === "active"
                        ? "border-red-200 text-red-700 hover:bg-red-50"
                        : "border-[#cbd9c7] text-[#17472D] hover:bg-[#f1f6ef]"
                    }`}
                  >
                    {busyId === source.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Power size={16} />
                    )}

                    {source.status === "active"
                      ? "Deactivate source"
                      : "Activate source"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#e5e9e1] px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-[#17472D]">
                  Register trusted source
                </h2>
                <p className="mt-1 text-xs text-[#899487]">
                  Add a publisher and its RSS or API endpoint.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-[#899487] hover:bg-[#f2f5f0]"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#526253]">
                  Publisher name *
                </label>
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="e.g. Ministry of Food and Agriculture"
                  className="w-full rounded-xl border border-[#dfe6dc] px-4 py-3 text-sm outline-none focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#526253]">
                  Description
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="Briefly describe the publisher and its agricultural coverage."
                  className="w-full resize-y rounded-xl border border-[#dfe6dc] px-4 py-3 text-sm outline-none focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#526253]">
                    Publisher website *
                  </label>
                  <input
                    required
                    type="url"
                    value={form.websiteUrl}
                    onChange={(event) =>
                      setForm({ ...form, websiteUrl: event.target.value })
                    }
                    placeholder="https://example.com"
                    className="w-full rounded-xl border border-[#dfe6dc] px-4 py-3 text-sm outline-none focus:border-[#17472D]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#526253]">
                    RSS / API URL *
                  </label>
                  <input
                    required
                    type="url"
                    value={form.feedUrl}
                    onChange={(event) =>
                      setForm({ ...form, feedUrl: event.target.value })
                    }
                    placeholder="https://example.com/feed.xml"
                    className="w-full rounded-xl border border-[#dfe6dc] px-4 py-3 text-sm outline-none focus:border-[#17472D]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#526253]">
                    Source type *
                  </label>
                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        type: event.target.value as SourceForm["type"],
                      })
                    }
                    className="w-full rounded-xl border border-[#dfe6dc] bg-white px-4 py-3 text-sm outline-none focus:border-[#17472D]"
                  >
                    <option value="rss">RSS Feed</option>
                    <option value="api">Official API</option>
                    <option value="website">Website</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#526253]">
                    Agricultural category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm({ ...form, category: event.target.value })
                    }
                    className="w-full rounded-xl border border-[#dfe6dc] bg-white px-4 py-3 text-sm outline-none focus:border-[#17472D]"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#526253]">
                  Country
                </label>
                <input
                  maxLength={80}
                  value={form.country}
                  onChange={(event) =>
                    setForm({ ...form, country: event.target.value })
                  }
                  placeholder="Ghana"
                  className="w-full rounded-xl border border-[#dfe6dc] px-4 py-3 text-sm outline-none focus:border-[#17472D]"
                />
              </div>

              <div className="rounded-xl bg-[#f5f8f3] p-3 text-xs leading-5 text-[#647463]">
                Registering a source does not automatically fetch or publish articles. Feed validation and administrator review will be handled by the news collection system.
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-[#dfe6dc] px-5 py-3 text-sm font-semibold text-[#526253] hover:bg-[#f5f8f3]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17472D] px-6 py-3 text-sm font-semibold text-white hover:bg-[#103821] disabled:opacity-60"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {saving ? "Registering..." : "Register source"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}