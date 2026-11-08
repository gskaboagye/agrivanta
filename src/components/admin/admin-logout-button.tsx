"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, LoaderCircle } from "lucide-react";

export default function AdminLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to log out.");
      }

      router.replace("/admin/login");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Logout failed. Please try again."
      );
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl border border-[#e5e9e1] bg-white px-3 py-2 text-xs font-bold text-[#52624f] transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <LoaderCircle size={16} className="animate-spin" />
        ) : (
          <LogOut size={16} />
        )}
        {loading ? "Signing out..." : "Sign out"}
      </button>

      {error && (
        <p role="alert" className="max-w-48 text-right text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}