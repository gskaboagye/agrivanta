
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  UserRound,
  Mail,
  Phone,
  CalendarDays,
  ShieldCheck,
  MessageCircle,
  RefreshCw,
  AlertCircle,
  Clock,
  Power,
} from "lucide-react";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: "active" | "disabled";
  phonePublic: boolean;
  whatsappEnabled: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

function formatDate(date: string | null) {
  if (!date) return "Not available";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function AdminUserProfileContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [user, setUser] = useState<ManagedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/admin/users/${encodeURIComponent(id)}`,
          {
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
          throw new Error(data.message || "Unable to load user profile.");
        }

        if (!cancelled) {
          setUser(data.user);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to retrieve user information."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleStatusChange() {
    if (!user || updatingStatus) return;

    const nextStatus =
      user.status === "active" ? "disabled" : "active";

    const action =
      nextStatus === "disabled" ? "disable" : "activate";

    const confirmed = window.confirm(
      nextStatus === "disabled"
        ? `Are you sure you want to disable ${user.name}'s account? They will no longer be able to access their account.`
        : `Are you sure you want to reactivate ${user.name}'s account?`
    );

    if (!confirmed) return;

    setUpdatingStatus(true);
    setError("");
    setStatusMessage("");

    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
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
          data.message || `Unable to ${action} this account.`
        );
      }

      setUser(data.user);
      setStatusMessage(data.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update account status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F8F4] text-[#26372b]">
      <header className="border-b border-[#e5e9e1] bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-5 sm:px-8">
          <Link
            href="/admin/users"
            aria-label="Back to user management"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e9e1] text-[#52624f] transition hover:bg-[#f2f5ef]"
          >
            <ArrowLeft size={19} />
          </Link>

          <div>
            <p className="text-lg font-extrabold text-[#17472D]">
              AgriVanta
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#899487]">
              Administrator / User Profile
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#74816f]">
            Platform administration
          </p>

          <h1 className="text-2xl font-extrabold tracking-tight text-[#17472D] sm:text-3xl">
            User Profile
          </h1>

          <p className="mt-2 text-sm text-[#7c8879]">
            View registered account information and account preferences.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#e5e9e1] bg-white px-6 py-20 text-center">
            <RefreshCw
              size={25}
              className="mx-auto animate-spin text-[#17472D]"
            />
            <p className="mt-3 text-sm text-[#899487]">
              Loading user profile...
            </p>
          </div>
        ) : error && !user ? (
          <div className="rounded-2xl border border-red-100 bg-white p-6">
            <div className="flex items-start gap-3 text-red-700">
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
              <div>
                <h2 className="font-bold">Unable to load profile</h2>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>

            <Link
              href="/admin/users"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#17472D]"
            >
              <ArrowLeft size={16} />
              Return to user management
            </Link>
          </div>
        ) : user ? (
          <>
            <section className="mb-6 rounded-2xl border border-[#e5e9e1] bg-white p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#17472D]/10 text-[#17472D]">
                    <UserRound size={31} />
                  </div>

                  <div>
                    <h2 className="text-xl font-extrabold text-[#17472D]">
                      {user.name || "Unnamed user"}
                    </h2>
                    <p className="mt-1 text-sm text-[#899487]">
                      {user.email}
                    </p>
                    <span className="mt-2 inline-flex rounded-lg bg-[#17472D]/8 px-2.5 py-1 text-xs font-semibold capitalize text-[#42634a]">
                      {user.role}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3 sm:items-end">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${
                      user.status === "disabled"
                        ? "bg-red-50 text-red-700"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        user.status === "disabled"
                          ? "bg-red-500"
                          : "bg-green-600"
                      }`}
                    />
                    {user.status === "disabled"
                      ? "Disabled account"
                      : "Active account"}
                  </span>

                  <button
                    type="button"
                    onClick={handleStatusChange}
                    disabled={updatingStatus}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      user.status === "active"
                        ? "bg-red-50 text-red-700 hover:bg-red-100"
                        : "bg-[#17472D] text-white hover:bg-[#103b24]"
                    }`}
                  >
                    {updatingStatus ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Power size={16} />
                    )}

                    {updatingStatus
                      ? "Updating..."
                      : user.status === "active"
                        ? "Disable Account"
                        : "Activate Account"}
                  </button>
                </div>
              </div>
            </section>

            {statusMessage && (
              <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
                {statusMessage}
              </div>
            )}

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-2xl border border-[#e5e9e1] bg-white p-6">
                <div className="mb-5 flex items-center gap-2">
                  <UserRound size={19} className="text-[#17472D]" />
                  <h3 className="font-bold text-[#354737]">
                    Personal information
                  </h3>
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                      Full name
                    </p>
                    <p className="text-sm font-semibold">
                      {user.name || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                      <Mail size={13} /> Email address
                    </p>
                    <p className="break-all text-sm font-semibold">
                      {user.email}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                      <Phone size={13} /> Phone number
                    </p>
                    <p className="text-sm font-semibold">
                      {user.phone || "Not provided"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[#e5e9e1] bg-white p-6">
                <div className="mb-5 flex items-center gap-2">
                  <ShieldCheck size={19} className="text-[#17472D]" />
                  <h3 className="font-bold text-[#354737]">
                    Account information
                  </h3>
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                      Account type
                    </p>
                    <p className="text-sm font-semibold capitalize">
                      {user.role}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                      Account status
                    </p>
                    <p className="text-sm font-semibold capitalize">
                      {user.status}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                      <CalendarDays size={13} /> Registration date
                    </p>
                    <p className="text-sm font-semibold">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                      <Clock size={13} /> Last updated
                    </p>
                    <p className="text-sm font-semibold">
                      {formatDate(user.updatedAt)}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[#e5e9e1] bg-white p-6 lg:col-span-2">
                <div className="mb-5 flex items-center gap-2">
                  <MessageCircle size={19} className="text-[#17472D]" />
                  <h3 className="font-bold text-[#354737]">
                    Contact preferences
                  </h3>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                      Phone visibility
                    </p>
                    <p className="text-sm font-semibold">
                      {user.phonePublic ? "Public" : "Private"}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                      WhatsApp contact
                    </p>
                    <p className="text-sm font-semibold">
                      {user.whatsappEnabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-6">
              <Link
                href="/admin/users"
                className="inline-flex items-center gap-2 rounded-xl border border-[#e1e7dd] bg-white px-4 py-3 text-sm font-bold text-[#42634a] transition hover:bg-[#f2f5ef]"
              >
                <ArrowLeft size={16} />
                Back to all users
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}

export default function AdminUserProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F7F8F4]">
          <p className="text-sm text-[#74816f]">
            Loading user profile...
          </p>
        </main>
      }
    >
      <AdminUserProfileContent />
    </Suspense>
  );
}
