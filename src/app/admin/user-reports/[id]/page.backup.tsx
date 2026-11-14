
"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldAlert,
  UserRound,
  CalendarDays,
  FileText,
  Clock,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  ClipboardList,
  UserCheck,
  UserMinus,
  UserPlus,
} from "lucide-react";

type ReportStatus =
  | "pending"
  | "investigating"
  | "resolved"
  | "dismissed";

type AdminNote = {
  note: string;
  adminId: string;
  adminName: string;
  createdAt: string;
};

type AdminResponse = {
  responseId: string;
  message: string;
  adminId: string;
  adminName: string;
  createdAt: string;
};

type AssignedOfficer = {
  adminId: string;
  name: string;
  email?: string;
  assignedAt?: string;
  assignedBy?: {
    adminId: string;
    name: string;
  };
};

type ReportOfficer = {
  adminId: string;
  name: string;
};

type Report = {
  reportId: string;
  referenceNumber: string;
  reporter: {
    userId: string;
    name: string;
    email: string;
    role?: string;
  };
  category: string;
  subject: string;
  description: string;
  reportedEntity: {
    type: "listing" | "user" | "platform";
    id?: string;
    label?: string;
  } | null;
  evidence?: string[];
  status: ReportStatus;
  priority: "low" | "medium" | "high" | "urgent";
  adminNotes: AdminNote[];
  adminResponses?: AdminResponse[];
  resolution: string | null;
  assignedTo?: AssignedOfficer | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusStyle(status: ReportStatus) {
  const styles: Record<ReportStatus, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    investigating: "bg-blue-50 text-blue-700 border-blue-200",
    resolved: "bg-green-50 text-green-700 border-green-200",
    dismissed: "bg-gray-100 text-gray-600 border-gray-200",
  };

  return styles[status];
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function AdminUserReportDetailsContent() {
  const params = useParams<{ id: string }>();
  const reportId = params.id;

  const [report, setReport] = useState<Report | null>(null);
  const [status, setStatus] = useState<ReportStatus>("pending");
  const [priority, setPriority] = useState("medium");
  const [adminNote, setAdminNote] = useState("");
  const [adminResponse, setAdminResponse] = useState("");
  const [resolution, setResolution] = useState("");

  const [officers, setOfficers] = useState<ReportOfficer[]>([]);
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [canManageAssignments, setCanManageAssignments] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [savingAssignment, setSavingAssignment] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingResponse, setSendingResponse] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const assignmentEndpoint =
    `/api/admin/user-reports/${encodeURIComponent(reportId)}/assignment`;

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/user-reports/${encodeURIComponent(reportId)}`,
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        window.location.assign("/admin/login");
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load this report.");
      }

      const loadedReport: Report = data.report;

      setReport(loadedReport);
      setStatus(loadedReport.status);
      setPriority(loadedReport.priority);
      setResolution(loadedReport.resolution ?? "");
      setSelectedOfficerId(
        loadedReport.assignedTo?.adminId ?? ""
      );

      // Only administrators with assignment permission can
      // retrieve the available Report Officers.
      setAssignmentLoading(true);

      try {
        const officersResponse = await fetch(assignmentEndpoint, {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        if (officersResponse.status === 401) {
          window.location.assign("/admin/login");
          return;
        }

        if (officersResponse.status === 403) {
          setCanManageAssignments(false);
          setOfficers([]);
        } else {
          const officersData = await officersResponse.json();

          if (!officersResponse.ok || !officersData.success) {
            throw new Error(
              officersData.message ||
                "Unable to load Report Officers."
            );
          }

          setOfficers(officersData.officers ?? []);
          setCanManageAssignments(true);
        }
      } finally {
        setAssignmentLoading(false);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading the report."
      );
    } finally {
      setLoading(false);
    }
  }, [reportId, assignmentEndpoint]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  async function handleAssignment() {
    if (!report || savingAssignment) return;

    const currentOfficerId = report.assignedTo?.adminId ?? "";
    const newOfficerId = selectedOfficerId;

    if (currentOfficerId === newOfficerId) {
      setError("Please select a different officer or unassign the report.");
      return;
    }

    if (!newOfficerId && !currentOfficerId) {
      setError("This report is not currently assigned.");
      return;
    }

    if (
      newOfficerId &&
      !officers.some((officer) => officer.adminId === newOfficerId)
    ) {
      setError("Please select a valid active Report Officer.");
      return;
    }

    setSavingAssignment(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(assignmentEndpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminId: newOfficerId || null,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.assign("/admin/login");
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to update the report assignment."
        );
      }

      const updatedAssignee: AssignedOfficer | null =
        data.assignment.assignedTo;

      setReport((current) =>
        current
          ? {
              ...current,
              assignedTo: updatedAssignee,
              updatedAt: new Date().toISOString(),
            }
          : current
      );

      setSelectedOfficerId(updatedAssignee?.adminId ?? "");
      setSuccess(data.message || "Report assignment updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while updating the assignment."
      );
    } finally {
      setSavingAssignment(false);
    }
  }

  async function handleUpdate(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!report) return;

    if (status === "resolved" && !resolution.trim()) {
      setError(
        "Enter the resolution details before resolving this report."
      );
      return;
    }

    if (resolution.length > 3000 || adminNote.length > 3000) {
      setError(
        "Investigation notes and resolution details cannot exceed 3,000 characters."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload: {
        status: ReportStatus;
        priority: string;
        adminNote?: string;
        resolution?: string | null;
      } = {
        status,
        priority,
      };

      if (adminNote.trim()) {
        payload.adminNote = adminNote.trim();
      }

      if (resolution !== (report.resolution ?? "")) {
        payload.resolution = resolution.trim() || null;
      }

      const response = await fetch(
        `/api/admin/user-reports/${encodeURIComponent(reportId)}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        window.location.assign("/admin/login");
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update the report.");
      }

      setReport((current) =>
        current
          ? {
              ...data.report,
              assignedTo: current.assignedTo,
            }
          : data.report
      );

      setStatus(data.report.status);
      setPriority(data.report.priority);
      setResolution(data.report.resolution ?? "");
      setAdminNote("");
      setSuccess("Report updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while updating the report."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSendResponse(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!adminResponse.trim()) {
      setError("Please enter a response before sending.");
      return;
    }

    if (adminResponse.trim().length > 3000) {
      setError("The response cannot exceed 3,000 characters.");
      return;
    }

    setSendingResponse(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/user-reports/${encodeURIComponent(reportId)}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            adminResponse: adminResponse.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        window.location.assign("/admin/login");
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to send the official response."
        );
      }

      setReport((current) =>
        current
          ? {
              ...data.report,
              assignedTo: current.assignedTo,
            }
          : data.report
      );

      setAdminResponse("");
      setSuccess("Official response sent successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while sending the response."
      );
    } finally {
      setSendingResponse(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F8F4]">
        <div className="text-center">
          <RefreshCw
            size={28}
            className="mx-auto animate-spin text-[#17472D]"
          />
          <p className="mt-3 text-sm text-[#899487]">
            Loading report details...
          </p>
        </div>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="min-h-screen bg-[#F7F8F4] px-5 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#e5e9e1] bg-white p-8 text-center">
          <AlertTriangle size={32} className="mx-auto text-red-500" />
          <h1 className="mt-4 text-xl font-bold text-[#17472D]">
            Unable to open report
          </h1>
          <p className="mt-2 text-sm text-[#899487]">
            {error || "This report could not be found."}
          </p>
          <Link
            href="/admin/user-reports"
            className="mt-6 inline-flex rounded-xl bg-[#17472D] px-5 py-3 text-xs font-bold text-white"
          >
            Return to reports
          </Link>
        </div>
      </main>
    );
  }

  const assignedOfficer = report.assignedTo ?? null;

  return (
    <main className="min-h-screen bg-[#F7F8F4] text-[#26372b]">
      <header className="border-b border-[#e5e9e1] bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-5 sm:px-8">
          <Link
            href="/admin/user-reports"
            aria-label="Back to user reports"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e9e1] text-[#52624f] transition hover:bg-[#f2f5ef]"
          >
            <ArrowLeft size={19} />
          </Link>

          <div>
            <p className="text-lg font-extrabold text-[#17472D]">
              AgriVanta
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#899487]">
              Administrator / User Reports / Investigation
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#74816f]">
              <ShieldAlert size={16} />
              Report investigation
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-[#17472D] sm:text-3xl">
              Investigate Report
            </h1>

            <p className="mt-2 text-sm text-[#7c8879]">
              Review the complaint, document findings and manage its resolution.
            </p>
          </div>

          <span
            className={`inline-flex self-start rounded-lg border px-3 py-2 text-xs font-bold ${statusStyle(report.status)}`}
          >
            {formatStatus(report.status)}
          </span>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-2xl border border-[#e5e9e1] bg-white p-5 sm:p-7">
              <div className="flex flex-col justify-between gap-3 border-b border-[#edf0ea] pb-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                    Reference number
                  </p>
                  <h2 className="mt-1 text-lg font-extrabold text-[#17472D]">
                    {report.referenceNumber}
                  </h2>
                </div>

                <span className="inline-flex w-fit rounded-lg bg-[#f1f5ef] px-3 py-2 text-xs font-semibold text-[#52624f]">
                  {report.category}
                </span>
              </div>

              <div className="pt-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                  Complaint subject
                </p>
                <h3 className="mt-2 text-lg font-bold text-[#26372b]">
                  {report.subject}
                </h3>

                <p className="mt-5 text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                  Description
                </p>
                <div className="mt-2 whitespace-pre-wrap rounded-xl bg-[#f8faf6] p-4 text-sm leading-7 text-[#52624f]">
                  {report.description}
                </div>
              </div>

              <div className="mt-5 grid gap-4 border-t border-[#edf0ea] pt-5 sm:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#899487]">
                    <CalendarDays size={15} />
                    Submitted
                  </div>
                  <p className="mt-2 text-xs font-medium text-[#52624f]">
                    {formatDate(report.createdAt)}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#899487]">
                    <Clock size={15} />
                    Last updated
                  </div>
                  <p className="mt-2 text-xs font-medium text-[#52624f]">
                    {formatDate(report.updatedAt)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#e5e9e1] bg-white p-5 sm:p-7">
              <div className="flex items-center gap-2 border-b border-[#edf0ea] pb-4">
                <UserRound size={18} className="text-[#17472D]" />
                <h2 className="text-base font-bold text-[#26372b]">
                  Reported entity
                </h2>
              </div>

              {report.reportedEntity ? (
                <div className="mt-5 rounded-xl bg-[#f8faf6] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                    Target type
                  </p>
                  <p className="mt-1 text-sm font-bold capitalize text-[#17472D]">
                    {report.reportedEntity.type}
                  </p>

                  {report.reportedEntity.label && (
                    <>
                      <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                        Target name
                      </p>
                      <p className="mt-1 text-sm text-[#52624f]">
                        {report.reportedEntity.label}
                      </p>
                    </>
                  )}

                  {report.reportedEntity.id && (
                    <>
                      <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                        Target reference
                      </p>
                      <p className="mt-1 break-all font-mono text-xs text-[#52624f]">
                        {report.reportedEntity.id}
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <p className="mt-5 text-sm text-[#899487]">
                  This report does not reference a specific listing or user.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-[#e5e9e1] bg-white p-5 sm:p-7">
              <div className="flex items-center gap-2 border-b border-[#edf0ea] pb-4">
                <ClipboardList size={18} className="text-[#17472D]" />
                <h2 className="text-base font-bold text-[#26372b]">
                  Investigation history
                </h2>
              </div>

              <div className="mt-5 space-y-4">
                {report.adminNotes?.length ? (
                  [...report.adminNotes]
                    .reverse()
                    .map((note, index) => (
                      <div
                        key={`${note.adminId}-${note.createdAt}-${index}`}
                        className="rounded-xl border border-[#e8ede5] bg-[#fbfcfa] p-4"
                      >
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                          <p className="text-xs font-bold text-[#17472D]">
                            {note.adminName || "Administrator"}
                          </p>
                          <span className="text-[10px] text-[#899487]">
                            {formatDate(note.createdAt)}
                          </span>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#52624f]">
                          {note.note}
                        </p>
                      </div>
                    ))
                ) : (
                  <div className="py-6 text-center">
                    <MessageSquare
                      size={25}
                      className="mx-auto text-[#b5beb1]"
                    />
                    <p className="mt-3 text-xs text-[#899487]">
                      No investigation notes have been added yet.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-[#e5e9e1] bg-white p-5 sm:p-7">
              <div className="flex items-center gap-2 border-b border-[#edf0ea] pb-4">
                <MessageSquare size={18} className="text-[#17472D]" />
                <div>
                  <h2 className="text-base font-bold text-[#26372b]">
                    Official responses to reporter
                  </h2>
                  <p className="mt-1 text-xs text-[#899487]">
                    These messages are visible to the person who submitted the report.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {report.adminResponses?.length ? (
                  [...report.adminResponses].reverse().map((response) => (
                    <div
                      key={response.responseId}
                      className="rounded-xl border border-[#e8ede5] bg-[#fbfcfa] p-4"
                    >
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                        <p className="text-xs font-bold text-[#17472D]">
                          {response.adminName || "Administrator"}
                        </p>
                        <span className="text-[10px] text-[#899487]">
                          {formatDate(response.createdAt)}
                        </span>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#52624f]">
                        {response.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-5 text-center">
                    <MessageSquare
                      size={25}
                      className="mx-auto text-[#b5beb1]"
                    />
                    <p className="mt-3 text-xs text-[#899487]">
                      No official responses have been sent yet.
                    </p>
                  </div>
                )}
              </div>

              <form
                onSubmit={handleSendResponse}
                className="mt-6 border-t border-[#edf0ea] pt-5"
              >
                <label
                  htmlFor="admin-response"
                  className="mb-2 block text-xs font-semibold text-[#52624f]"
                >
                  Write an official response
                </label>
                <textarea
                  id="admin-response"
                  value={adminResponse}
                  onChange={(event) => setAdminResponse(event.target.value)}
                  rows={5}
                  maxLength={3000}
                  placeholder="Write a clear and professional response to the reporter..."
                  className="w-full resize-y rounded-xl border border-[#dfe7dc] bg-[#fbfcfa] px-3 py-3 text-sm leading-6 text-[#52624f] outline-none placeholder:text-[#a0aa9b] focus:border-[#17472D]"
                />
                <p className="mt-1 text-right text-[10px] text-[#899487]">
                  {adminResponse.length}/3000
                </p>

                <button
                  type="submit"
                  disabled={sendingResponse || !adminResponse.trim()}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#17472D] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#103a23] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sendingResponse ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : (
                    <MessageSquare size={15} />
                  )}
                  {sendingResponse
                    ? "Sending response..."
                    : "Send official response"}
                </button>
              </form>
            </section>
          </div>

          <aside className="space-y-6">
            {canManageAssignments && (
              <section className="rounded-2xl border border-[#e5e9e1] bg-white p-5">
                <div className="flex items-center gap-2 border-b border-[#edf0ea] pb-4">
                  <UserCheck size={18} className="text-[#17472D]" />
                  <h2 className="text-sm font-bold text-[#26372b]">
                    Assignment management
                  </h2>
                </div>

                <div className="mt-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                    Currently assigned officer
                  </p>

                  {assignedOfficer ? (
                    <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-4">
                      <div className="flex items-center gap-2">
                        <UserCheck
                          size={17}
                          className="shrink-0 text-green-700"
                        />
                        <p className="text-sm font-bold text-green-900">
                          {assignedOfficer.name}
                        </p>
                      </div>

                      {assignedOfficer.email && (
                        <p className="mt-2 break-all text-xs text-green-800">
                          {assignedOfficer.email}
                        </p>
                      )}

                      {assignedOfficer.assignedAt && (
                        <p className="mt-2 text-[10px] text-green-800">
                          Assigned: {formatDate(assignedOfficer.assignedAt)}
                        </p>
                      )}

                      {assignedOfficer.assignedBy?.name && (
                        <p className="mt-1 text-[10px] text-green-800">
                          Assigned by: {assignedOfficer.assignedBy.name}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-center gap-2 text-amber-800">
                        <UserMinus size={17} />
                        <p className="text-sm font-semibold">
                          Not assigned
                        </p>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-amber-800">
                        This report has not yet been assigned to a Report Officer.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="report-officer"
                    className="mb-2 block text-xs font-semibold text-[#52624f]"
                  >
                    Select Report Officer
                  </label>

                  <select
                    id="report-officer"
                    value={selectedOfficerId}
                    onChange={(event) =>
                      setSelectedOfficerId(event.target.value)
                    }
                    disabled={assignmentLoading || savingAssignment}
                    className="w-full rounded-xl border border-[#dfe7dc] bg-[#fbfcfa] px-3 py-3 text-xs text-[#52624f] outline-none focus:border-[#17472D] disabled:opacity-60"
                  >
                    <option value="">Select an officer</option>
                    {officers.map((officer) => (
                      <option
                        key={officer.adminId}
                        value={officer.adminId}
                      >
                        {officer.name}
                      </option>
                    ))}
                  </select>

                  {assignmentLoading && (
                    <p className="mt-2 flex items-center gap-2 text-[10px] text-[#899487]">
                      <RefreshCw size={12} className="animate-spin" />
                      Loading Report Officers...
                    </p>
                  )}

                  {!assignmentLoading && officers.length === 0 && (
                    <p className="mt-2 text-[10px] leading-5 text-amber-700">
                      No active Report Officers are currently available.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void handleAssignment()}
                  disabled={
                    savingAssignment ||
                    assignmentLoading ||
                    !selectedOfficerId ||
                    selectedOfficerId === assignedOfficer?.adminId
                  }
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#17472D] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#103a23] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingAssignment ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : (
                    <UserPlus size={15} />
                  )}
                  {savingAssignment
                    ? "Saving assignment..."
                    : assignedOfficer
                      ? "Reassign report"
                      : "Assign report"}
                </button>

                {assignedOfficer && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOfficerId("");
                      void handleAssignment();
                    }}
                    disabled={savingAssignment || assignmentLoading}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <UserMinus size={15} />
                    Unassign report
                  </button>
                )}

                <p className="mt-4 text-[10px] leading-5 text-[#899487]">
                  Only active administrators with the Report Officer role can be assigned to reports.
                </p>
              </section>
            )}

            <section className="rounded-2xl border border-[#e5e9e1] bg-white p-5">
              <div className="flex items-center gap-2 border-b border-[#edf0ea] pb-4">
                <UserRound size={18} className="text-[#17472D]" />
                <h2 className="text-sm font-bold text-[#26372b]">
                  Reporter information
                </h2>
              </div>

              <div className="mt-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                  Full name
                </p>
                <p className="mt-1 text-sm font-semibold text-[#26372b]">
                  {report.reporter?.name || "Unknown user"}
                </p>

                <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                  Email address
                </p>
                <p className="mt-1 break-all text-sm text-[#52624f]">
                  {report.reporter?.email || "Not available"}
                </p>

                <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                  Account role
                </p>
                <p className="mt-1 text-sm capitalize text-[#52624f]">
                  {report.reporter?.role || "Not available"}
                </p>

                <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                  User reference
                </p>
                <p className="mt-1 break-all font-mono text-[10px] text-[#899487]">
                  {report.reporter?.userId || "Not available"}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-[#e5e9e1] bg-white p-5">
              <div className="flex items-center gap-2 border-b border-[#edf0ea] pb-4">
                <FileText size={18} className="text-[#17472D]" />
                <h2 className="text-sm font-bold text-[#26372b]">
                  Investigation controls
                </h2>
              </div>

              <form onSubmit={handleUpdate} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="report-status"
                    className="mb-2 block text-xs font-semibold text-[#52624f]"
                  >
                    Report status
                  </label>
                  <select
                    id="report-status"
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as ReportStatus)
                    }
                    className="w-full rounded-xl border border-[#dfe7dc] bg-[#fbfcfa] px-3 py-3 text-xs text-[#52624f] outline-none focus:border-[#17472D]"
                  >
                    <option value="pending">Pending</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="report-priority"
                    className="mb-2 block text-xs font-semibold text-[#52624f]"
                  >
                    Priority level
                  </label>
                  <select
                    id="report-priority"
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                    className="w-full rounded-xl border border-[#dfe7dc] bg-[#fbfcfa] px-3 py-3 text-xs text-[#52624f] outline-none focus:border-[#17472D]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="admin-note"
                    className="mb-2 block text-xs font-semibold text-[#52624f]"
                  >
                    Internal investigation note
                  </label>
                  <textarea
                    id="admin-note"
                    value={adminNote}
                    onChange={(event) => setAdminNote(event.target.value)}
                    rows={5}
                    maxLength={3000}
                    placeholder="Document your findings. Only administrators can see this note..."
                    className="w-full resize-y rounded-xl border border-[#dfe7dc] bg-[#fbfcfa] px-3 py-3 text-xs leading-6 text-[#52624f] outline-none placeholder:text-[#a0aa9b] focus:border-[#17472D]"
                  />
                  <p className="mt-1 text-right text-[10px] text-[#899487]">
                    {adminNote.length}/3000
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="resolution"
                    className="mb-2 block text-xs font-semibold text-[#52624f]"
                  >
                    Resolution details
                  </label>
                  <textarea
                    id="resolution"
                    value={resolution}
                    onChange={(event) => setResolution(event.target.value)}
                    rows={4}
                    maxLength={3000}
                    placeholder="Describe the outcome or corrective action..."
                    className="w-full resize-y rounded-xl border border-[#dfe7dc] bg-[#fbfcfa] px-3 py-3 text-xs leading-6 text-[#52624f] outline-none placeholder:text-[#a0aa9b] focus:border-[#17472D]"
                  />
                  <p className="mt-1 text-right text-[10px] text-[#899487]">
                    {resolution.length}/3000
                  </p>
                </div>

                {status === "resolved" && (
                  <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-[11px] leading-5 text-green-800">
                    Resolution details are required before this report can be resolved.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#17472D] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#103a23] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  {saving ? "Saving changes..." : "Save investigation"}
                </button>
              </form>
            </section>

            {report.resolvedAt && (
              <section className="rounded-2xl border border-green-200 bg-green-50 p-5">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 size={18} />
                  <h2 className="text-sm font-bold">
                    Resolution recorded
                  </h2>
                </div>
                <p className="mt-3 text-xs leading-6 text-green-800">
                  {formatDate(report.resolvedAt)}
                </p>
              </section>
            )}
          </aside>
        </div>

        <p className="mt-8 text-center text-[11px] text-[#9aa395]">
          AgriVanta Administration · Confidential Investigation Record
        </p>
      </div>
    </main>
  );
}

export default function AdminUserReportDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F8F6EE] p-6">
          <div className="mx-auto max-w-5xl rounded-2xl border border-[#E7E4D9] bg-white p-8 text-center text-sm text-[#647367]">
            Loading report details...
          </div>
        </main>
      }
    >
      <AdminUserReportDetailsContent />
    </Suspense>
  );
}
