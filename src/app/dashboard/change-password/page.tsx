"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword.length < 10) {
      setError("Your new password must contain at least 10 characters.");
      return;
    }

    if (new TextEncoder().encode(newPassword).length > 72) {
      setError("Your new password must not exceed 72 UTF-8 bytes.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Your new password and confirmation do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("Your new password must be different from your current password.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        throw new Error(data.message || "Unable to change your password.");
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  function PasswordField({
    label,
    value,
    onChange,
    visible,
    toggleVisibility,
    autoComplete,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    visible: boolean;
    toggleVisibility: () => void;
    autoComplete: string;
  }) {
    return (
      <label className="block">
        <span className="mb-2 block text-sm font-semibold">{label}</span>
        <span className="relative block">
          <input
            required
            type={visible ? "text" : "password"}
            autoComplete={autoComplete}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="block w-full min-w-0 rounded-xl border border-[#dfe5da] px-3 py-3 pr-12 text-sm outline-none transition focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10 sm:px-4"
          />
          <button
            type="button"
            onClick={toggleVisibility}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#879084] hover:text-[#17472D]"
          >
            {visible ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </span>
      </label>
    );
  }

  return (
    <main className="min-h-full min-w-0 bg-[#F7F8F4] px-3 py-5 text-[#243629] sm:px-7 sm:py-8 lg:px-10">
      <div className="mx-auto w-full min-w-0 max-w-2xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#17472D] hover:underline"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>

        <header className="mt-5 min-w-0 rounded-2xl bg-[#17472D] p-4 text-white sm:mt-6 sm:rounded-3xl sm:p-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <KeyRound size={25} />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-white/65">
                Account security
              </p>
              <h1 className="mt-1 break-words text-xl font-bold sm:text-2xl">Change password</h1>
            </div>
          </div>

          <p className="mt-4 max-w-xl text-sm leading-6 text-white/75">
            Update your password to help keep your AgriVanta account secure.
            You will need to log in again after changing it.
          </p>
        </header>

        <section className="mt-5 min-w-0 rounded-2xl border border-[#e5e9e0] bg-white p-3 sm:mt-6 sm:p-7">
          <div className="flex min-w-0 items-center gap-3">
            <LockKeyhole size={21} className="text-[#17472D]" />
            <div>
              <h2 className="text-base font-bold">Password details</h2>
              <p className="mt-1 text-sm text-[#879084]">
                Enter your current password and choose a new one.
              </p>
            </div>
          </div>

          {success ? (
            <div className="mt-6 min-w-0 rounded-xl border border-green-200 bg-green-50 p-4 sm:p-5">
              <CheckCircle2 size={25} className="text-green-700" />
              <h3 className="mt-3 font-bold text-green-800">
                Password changed successfully
              </h3>
              <p className="mt-2 text-sm leading-6 text-green-800">
                Your password has been updated and your previous sessions
                have been invalidated. Please log in again using your new
                password.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#17472D] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#103921] sm:w-auto"
              >
                Go to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 min-w-0 space-y-5">
              <PasswordField
                label="Current password"
                value={currentPassword}
                onChange={setCurrentPassword}
                visible={showCurrent}
                toggleVisibility={() => setShowCurrent((value) => !value)}
                autoComplete="current-password"
              />

              <PasswordField
                label="New password"
                value={newPassword}
                onChange={setNewPassword}
                visible={showNew}
                toggleVisibility={() => setShowNew((value) => !value)}
                autoComplete="new-password"
              />

              <PasswordField
                label="Confirm new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                visible={showConfirm}
                toggleVisibility={() => setShowConfirm((value) => !value)}
                autoComplete="new-password"
              />

              <div className="flex min-w-0 gap-3 rounded-xl bg-[#F8F6EE] p-3 sm:p-4">
                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-[#806020]"
                />
                <div className="text-xs leading-5 text-[#6f6958]">
                  <p className="font-bold">Password requirements</p>
                  <ul className="mt-1 list-inside list-disc">
                    <li>At least 10 characters</li>
                    <li>No more than 72 UTF-8 bytes</li>
                    <li>Must be different from your current password</li>
                  </ul>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#17472D] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#103921] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {saving ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <KeyRound size={18} />
                )}
                {saving ? "Updating password..." : "Update password"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
