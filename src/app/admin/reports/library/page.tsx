"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Search,
  FileText,
  Eye,
  Edit3,
  Trash2,
  Send,
  Archive,
  RefreshCw,
  Loader2,
  X,
  Upload,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";

const DEFAULT_CATEGORIES = [
  "Crop Production",
  "Livestock",
  "Agribusiness",
  "Agricultural Technology",
  "Agricultural Policy",
  "Fisheries",
  "Climate and Environment",
  "General Agriculture",
];

type ReportResource = {
  url: string;
  publicId?: string;
  format?: string;
  bytes?: number | null;
};

type Report = {
  id: string;
  title: string;
  description: string;
  category: string;
  type: "pdf" | "external";
  resource: ReportResource;
  source: string;
  publicationDate: string;
  status: "draft" | "published";
  author: { name?: string } | null;
  createdAt: string | null;
  publishedAt: string | null;
};

type ReportForm = {
  title: string;
  description: string;
  category: string;
  type: "pdf" | "external";
  resource: ReportResource | null;
  source: string;
  publicationDate: string;
};

const EMPTY_FORM: ReportForm = {
  title: "",
  description: "",
  category: DEFAULT_CATEGORIES[0],
  type: "pdf",
  resource: null,
  source: "",
  publicationDate: new Date().toISOString().slice(0, 10),
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

export default function AgriculturalReportsAdminPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  const [overview, setOverview] = useState({
    totalReports: 0,
    publishedReports: 0,
    draftReports: 0,
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
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [form, setForm] = useState<ReportForm>(EMPTY_FORM);

  const loadReports = useCallback(async () => {
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
        `/api/admin/reports/library?${params.toString()}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load reports.");
      }

      setReports(data.reports ?? []);
      setOverview(
        data.overview ?? {
          totalReports: 0,
          publishedReports: 0,
          draftReports: 0,
        }
      );
      setCategories(data.categories ?? DEFAULT_CATEGORIES);
      setTotalPages(Math.max(1, data.pagination?.totalPages ?? 1));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load reports."
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, category, status]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  function updateForm<K extends keyof ReportForm>(
    key: K,
    value: ReportForm[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreateEditor() {
    setEditingReport(null);
    setForm({
      ...EMPTY_FORM,
      publicationDate: new Date().toISOString().slice(0, 10),
    });
    setError("");
    setNotice("");
    setEditorOpen(true);
  }

  function openEditEditor(report: Report) {
    setEditingReport(report);
    setForm({
      title: report.title,
      description: report.description,
      category: report.category,
      type: report.type,
      resource: report.resource,
      source: report.source,
      publicationDate: report.publicationDate,
    });
    setError("");
    setNotice("");
    setEditorOpen(true);
  }

  function closeEditor() {
    if (saving || uploading) return;

    setEditorOpen(false);
    setEditingReport(null);
    setForm(EMPTY_FORM);
  }

  async function uploadPdf(file: File) {
    setUploading(true);
    setError("");
    setNotice("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "/api/admin/reports/library/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "PDF upload failed.");
      }

      setForm((current) => ({
        ...current,
        resource: data.file,
      }));

      setNotice("PDF uploaded successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to upload PDF."
      );
    } finally {
      setUploading(false);
    }
  }

  async function saveReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (!form.resource) {
        throw new Error(
          form.type === "pdf"
            ? "Please upload a PDF document."
            : "Please provide an external report URL."
        );
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        type: form.type,
        resource:
          form.type === "external"
            ? { url: form.resource.url.trim() }
            : form.resource,
        source: form.source.trim(),
        publicationDate: form.publicationDate,
        ...(!editingReport ? { status: "draft" } : {}),
      };

      const response = await fetch(
        editingReport
          ? `/api/admin/reports/library/${editingReport.id}`
          : "/api/admin/reports/library",
        {
          method: editingReport ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save report.");
      }

      setNotice(data.message || "Report saved successfully.");
      setEditorOpen(false);
      setEditingReport(null);
      setForm(EMPTY_FORM);

      await loadReports();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save report."
      );
    } finally {
      setSaving(false);
    }
  }

  async function changePublication(report: Report) {
    const nextStatus =
      report.status === "published" ? "draft" : "published";

    const confirmed = window.confirm(
      nextStatus === "published"
        ? `Publish "${report.title}"?`
        : `Unpublish "${report.title}"?`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/admin/reports/library/${report.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update publication.");
      }

      setNotice(data.message);
      await loadReports();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Publication update failed."
      );
    }
  }

  async function deleteReport(report: Report) {
    const confirmed = window.confirm(
      `Permanently delete "${report.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/admin/reports/library/${report.id}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete report.");
      }

      setNotice(data.message);
      await loadReports();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete report."
      );
    }
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
              <FileText size={18} />
              AGRIVANTA ADMINISTRATION
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Agricultural Reports
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Upload, manage and publish agricultural reports and research
              publications.
            </p>
          </div>

          <button
            onClick={openCreateEditor}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17472D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#103920]"
          >
            <Plus size={18} />
            Add Report
          </button>
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
              label: "Total Reports",
              value: overview.totalReports,
              icon: FileText,
              color: "text-blue-700",
              background: "bg-blue-50",
            },
            {
              label: "Published Reports",
              value: overview.publishedReports,
              icon: Eye,
              color: "text-green-700",
              background: "bg-green-50",
            },
            {
              label: "Draft Reports",
              value: overview.draftReports,
              icon: Archive,
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
              placeholder="Search reports..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
            />
          </div>

          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#17472D]"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#17472D]"
          >
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>

          <button
            onClick={() => void loadReports()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-bold text-gray-900">Report Library</h2>
              <p className="mt-1 text-xs text-gray-500">
                Manage PDF documents and external agricultural publications.
              </p>
            </div>

            <span className="text-sm text-gray-500">
              {overview.totalReports} total reports
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-gray-500">
              <Loader2 className="animate-spin" size={22} />
              Loading reports...
            </div>
          ) : reports.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 rounded-2xl bg-[#F0F4EE] p-4">
                <FileText size={32} className="text-[#17472D]" />
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                No reports found
              </h3>

              <p className="mt-2 max-w-md text-sm text-gray-500">
                Add your first agricultural report or adjust your search
                filters.
              </p>

              <button
                onClick={openCreateEditor}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#17472D] px-5 py-3 text-sm font-semibold text-white hover:bg-[#103920]"
              >
                <Plus size={17} />
                Add First Report
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {reports.map((report) => (
                <article
                  key={report.id}
                  className="flex flex-col gap-4 p-5 transition hover:bg-gray-50/70 sm:flex-row"
                >
                  <div className="flex h-28 w-full shrink-0 items-center justify-center rounded-xl bg-[#F0F4EE] sm:w-24">
                    <FileText size={35} className="text-[#17472D]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={report.status} />

                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                        {report.category}
                      </span>

                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                        {report.type === "pdf" ? "PDF Document" : "External Link"}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900">
                      {report.title}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                      {report.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>Source: {report.source}</span>
                      <span>
                        Published date: {formatDate(report.publicationDate)}
                      </span>
                      <span>
                        Added by {report.author?.name || "AgriVanta Admin"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <a
                      href={report.resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open report"
                      className="rounded-lg border border-gray-200 p-2.5 text-gray-600 hover:border-[#17472D] hover:text-[#17472D]"
                    >
                      {report.type === "pdf" ? (
                        <Download size={17} />
                      ) : (
                        <ExternalLink size={17} />
                      )}
                    </a>

                    <button
                      onClick={() => openEditEditor(report)}
                      title="Edit report"
                      className="rounded-lg border border-gray-200 p-2.5 text-gray-600 hover:border-[#17472D] hover:text-[#17472D]"
                    >
                      <Edit3 size={17} />
                    </button>

                    <button
                      onClick={() => void changePublication(report)}
                      title={
                        report.status === "published"
                          ? "Unpublish"
                          : "Publish"
                      }
                      className="rounded-lg border border-gray-200 p-2.5 text-gray-600 hover:border-[#17472D] hover:text-[#17472D]"
                    >
                      {report.status === "published" ? (
                        <Archive size={17} />
                      ) : (
                        <Send size={17} />
                      )}
                    </button>

                    <button
                      onClick={() => void deleteReport(report)}
                      title="Delete report"
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
      </div>

      {editorOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-3 sm:p-6">
          <div className="mx-auto my-4 max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-7">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingReport ? "Edit Report" : "Add Agricultural Report"}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Provide the report details and attach its document or link.
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

            <form onSubmit={(event) => void saveReport(event)} className="space-y-5 p-5 sm:p-7">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Report title
                </label>

                <input
                  required
                  minLength={5}
                  maxLength={180}
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  placeholder="Enter the report title"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
                />
                <p className="mt-1 text-xs text-gray-400">
                  5-180 characters
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Description
                </label>

                <textarea
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  placeholder="Describe the report and what readers will learn..."
                  className="w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
                />

                <p className="mt-1 text-xs text-gray-400">
                  10-1,000 characters
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Category
                  </label>

                  <select
                    value={form.category}
                    onChange={(event) =>
                      updateForm("category", event.target.value)
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-[#17472D]"
                  >
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Report type
                  </label>

                  <select
                    value={form.type}
                    onChange={(event) => {
                      const nextType = event.target.value as "pdf" | "external";

                      updateForm("type", nextType);
                      updateForm("resource", null);
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-[#17472D]"
                  >
                    <option value="pdf">PDF document</option>
                    <option value="external">External report link</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Source organization
                  </label>

                  <input
                    required
                    minLength={2}
                    maxLength={160}
                    value={form.source}
                    onChange={(event) => updateForm("source", event.target.value)}
                    placeholder="e.g. Ministry of Food and Agriculture"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#17472D]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Publication date
                  </label>

                  <input
                    type="date"
                    required
                    value={form.publicationDate}
                    onChange={(event) =>
                      updateForm("publicationDate", event.target.value)
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-[#17472D]"
                  />
                </div>
              </div>

              {form.type === "pdf" ? (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    PDF document
                  </label>

                  <div className="rounded-xl border border-dashed border-gray-300 p-5">
                    {form.resource?.url ? (
                      <div className="mb-4 flex items-center gap-3 rounded-lg bg-[#F0F4EE] p-3">
                        <FileText className="shrink-0 text-[#17472D]" size={25} />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-800">
                            PDF document uploaded
                          </p>
                          <a
                            href={form.resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-[#17472D] hover:underline"
                          >
                            Preview document
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4 flex flex-col items-center py-3 text-center">
                        <Upload size={30} className="mb-2 text-[#17472D]" />
                        <p className="text-sm font-semibold text-gray-700">
                          Upload a report PDF
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          PDF format only. Maximum file size: 20 MB.
                        </p>
                      </div>
                    )}

                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                      {uploading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Upload size={16} />
                      )}

                      {uploading
                        ? "Uploading..."
                        : form.resource
                          ? "Replace PDF"
                          : "Choose PDF"}

                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        disabled={uploading || saving}
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadPdf(file);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    External report URL
                  </label>

                  <input
                    type="url"
                    required
                    maxLength={2048}
                    value={form.resource?.url ?? ""}
                    onChange={(event) =>
                      updateForm("resource", {
                        url: event.target.value,
                      })
                    }
                    placeholder="https://example.com/agricultural-report.pdf"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#17472D]"
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    Enter a secure HTTPS link to the original publication.
                  </p>
                </div>
              )}

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

                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17472D] px-6 py-3 text-sm font-semibold text-white hover:bg-[#103920] disabled:opacity-50"
                >
                  {saving && <Loader2 size={17} className="animate-spin" />}
                  {saving
                    ? "Saving..."
                    : editingReport
                      ? "Save Changes"
                      : "Save as Draft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}