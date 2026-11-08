"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
  UserRound,
  RefreshCw,
  CalendarDays,
  Mail,
  Phone,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: "active" | "disabled";
  createdAt: string | null;
  updatedAt: string | null;
};

type Pagination = {
  page: number;
  pageSize: number;
  totalUsers: number;
  totalPages: number;
};

const roles = [
  { label: "All users", value: "all" },
  { label: "Farmers", value: "farmer" },
  { label: "Buyers", value: "buyer" },
  { label: "Suppliers", value: "supplier" },
  { label: "Workers", value: "worker" },
  { label: "Experts", value: "expert" },
];

function formatDate(date: string | null) {
  if (!date) return "Not available";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatRole(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    totalUsers: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async (page: number) => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        role,
        search: search.trim(),
      });

      const response = await fetch(
        `/api/admin/users?${params.toString()}`,
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
        throw new Error(data.message || "Unable to load users.");
      }

      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading users."
      );
    } finally {
      setLoading(false);
    }
  }, [role, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  const activeUsers = users.filter(
    (user) => user.status === "active"
  ).length;

  const disabledUsers = users.filter(
    (user) => user.status === "disabled"
  ).length;

  return (
    <main className="min-h-screen bg-[#F7F8F4] text-[#26372b]">
      <header className="border-b border-[#e5e9e1] bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-5 sm:px-8">
          <Link
            href="/admin"
            aria-label="Back to administrator dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e9e1] text-[#52624f] transition hover:bg-[#f2f5ef]"
          >
            <ArrowLeft size={19} />
          </Link>

          <div>
            <p className="text-lg font-extrabold text-[#17472D]">
              AgriVanta
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#899487]">
              Administrator / User Management
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#74816f]">
              <Users size={16} />
              Platform administration
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-[#17472D] sm:text-3xl">
              User Management
            </h1>

            <p className="mt-2 text-sm text-[#7c8879]">
              View, search and manage registered AgriVanta accounts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadUsers(1)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#dfe7dc] bg-white px-4 py-2.5 text-xs font-bold text-[#42634a] transition hover:bg-[#f2f5ef] disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh users
          </button>
        </div>

        <section className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#e5e9e1] bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#899487]">
                Total registered
              </p>
              <Users size={19} className="text-[#17472D]" />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-[#17472D]">
              {pagination.totalUsers}
            </p>
            <p className="mt-1 text-xs text-[#899487]">
              Matching users
            </p>
          </div>

          <div className="rounded-2xl border border-[#e5e9e1] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#899487]">
              Active on this page
            </p>
            <p className="mt-3 text-3xl font-extrabold text-[#17472D]">
              {activeUsers}
            </p>
            <p className="mt-1 text-xs text-[#899487]">
              Currently displayed
            </p>
          </div>

          <div className="rounded-2xl border border-[#e5e9e1] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#899487]">
              Disabled on this page
            </p>
            <p className="mt-3 text-3xl font-extrabold text-[#a34c3d]">
              {disabledUsers}
            </p>
            <p className="mt-1 text-xs text-[#899487]">
              Currently displayed
            </p>
          </div>

          <div className="rounded-2xl border border-[#e5e9e1] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#899487]">
              Records per page
            </p>
            <p className="mt-3 text-3xl font-extrabold text-[#17472D]">
              {pagination.pageSize}
            </p>
            <p className="mt-1 text-xs text-[#899487]">
              Paginated user records
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#e5e9e1] bg-white">
          <div className="border-b border-[#e5e9e1] p-5 sm:p-6">
            <h2 className="text-base font-bold text-[#26372b]">
              Registered accounts
            </h2>
            <p className="mt-1 text-xs text-[#899487]">
              Search and filter accounts by their registered details.
            </p>

            <div className="mt-5 flex flex-col gap-4 lg:flex-row">
              <div className="relative flex-1">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#899487]"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full rounded-xl border border-[#e1e7dd] bg-[#fafbf8] py-3 pl-11 pr-4 text-sm text-[#26372b] outline-none transition placeholder:text-[#a0a99c] focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {roles.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setRole(item.value)}
                    className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
                      role === item.value
                        ? "bg-[#17472D] text-white"
                        : "border border-[#e5e9e1] bg-white text-[#687565] hover:bg-[#f5f7f2]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="m-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Unable to load user records</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-[#f8faf6]">
                <tr className="border-b border-[#e5e9e1] text-[10px] font-bold uppercase tracking-wider text-[#899487]">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Account type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Registration date</th>
                  <th className="px-6 py-4">Contact</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf0e9]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <RefreshCw
                        size={22}
                        className="mx-auto animate-spin text-[#17472D]"
                      />
                      <p className="mt-3 text-sm text-[#899487]">
                        Loading registered users...
                      </p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-[#899487]">
                      User records could not be displayed.
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <UserRound
                        size={28}
                        className="mx-auto text-[#a0a99c]"
                      />
                      <p className="mt-3 text-sm font-semibold text-[#52624f]">
                        No users found
                      </p>
                      <p className="mt-1 text-xs text-[#899487]">
                        Try another search term or account filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => window.location.assign(`/admin/users/${user.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          window.location.assign(`/admin/users/${user.id}`);
                        }
                      }}
                      tabIndex={0}
                      role="link"
                      aria-label={`View profile for ${user.name}`}
                      className="cursor-pointer transition hover:bg-[#f0f5ed] focus:bg-[#f0f5ed] focus:outline-none"
                    >
                      <td className="px-6 py-4">
                        <p className="whitespace-nowrap text-sm font-bold text-[#354737]">
                          {user.name || "Unnamed user"}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-[#899487]">
                          <Mail size={12} />
                          {user.email}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-lg bg-[#17472D]/8 px-2.5 py-1.5 text-xs font-semibold text-[#42634a]">
                          {formatRole(user.role)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${
                            user.status === "disabled"
                              ? "bg-red-50 text-red-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            user.status === "disabled"
                              ? "bg-red-500"
                              : "bg-green-600"
                          }`} />
                          {formatRole(user.status)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 whitespace-nowrap text-xs text-[#687565]">
                          <CalendarDays size={14} />
                          {formatDate(user.createdAt)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {user.phone ? (
                          <span className="flex items-center gap-2 whitespace-nowrap text-xs text-[#687565]">
                            <Phone size={14} />
                            {user.phone}
                          </span>
                        ) : (
                          <span className="text-xs text-[#a0a99c]">
                            Not provided
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#e5e9e1] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-[#899487]">
              Showing {users.length} of {pagination.totalUsers} matching users
            </p>

            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-[#687565]">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                type="button"
                onClick={() => void loadUsers(pagination.page - 1)}
                disabled={loading || pagination.page <= 1}
                aria-label="Previous page"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e9e1] text-[#52624f] transition hover:bg-[#f2f5ef] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={17} />
              </button>

              <button
                type="button"
                onClick={() => void loadUsers(pagination.page + 1)}
                disabled={loading || pagination.page >= pagination.totalPages}
                aria-label="Next page"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e9e1] text-[#52624f] transition hover:bg-[#f2f5ef] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </section>

        <footer className="mt-8 border-t border-[#e5e9e1] pt-5 text-center text-xs text-[#9aa394]">
          AgriVanta Administrator Portal
        </footer>
      </div>
    </main>
  );
}