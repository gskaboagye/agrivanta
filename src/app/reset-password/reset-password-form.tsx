"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Leaf,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

export default function ResetPasswordForm() {
  const router = useRouter();

  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const token = window.sessionStorage.getItem(
        "agrivanta_password_reset_token"
      );

      if (token && /^[a-f0-9]{64}$/i.test(token)) {
        setResetToken(token);
      } else {
        setError("Your password recovery session is missing or invalid. Please request a new recovery code.");
      }
    } catch {
      setError("Unable to access your recovery session. Please start the recovery process again.");
    } finally {
      setTokenLoading(false);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!resetToken) {
      setError("Your recovery session has expired. Please request a new code.");
      return;
    }

    if (newPassword.length < 10) {
      setError("Your new password must contain at least 10 characters.");
      return;
    }

    if (new TextEncoder().encode(newPassword).length > 72) {
      setError("Your new password must not exceed 72 bytes.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resetToken,
          newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Unable to reset your password.");
        return;
      }

      window.sessionStorage.removeItem(
        "agrivanta_password_reset_token"
      );

      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F6EE] px-4 py-12 text-[#193D2A]">
      <section className="w-full max-w-lg rounded-2xl border border-[#E7E4D9] bg-white p-6 shadow-sm sm:p-10">
        <Link href="/" className="mx-auto flex w-fit items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#17472D] text-[#D9A441]">
            <Leaf size={25} />
          </span>
          <span className="text-2xl font-extrabold">AgriVanta</span>
        </Link>

        <div className="mt-9 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF2EB] text-[#17472D]">
            {success ? <ShieldCheck size={29} /> : <LockKeyhole size={27} />}
          </span>

          <h1 className="mt-5 text-2xl font-extrabold">
            {success ? "Password reset successful" : "Create a new password"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#718071]">
            {success
              ? "Your password has been updated. You can now sign in using your new password."
              : "Choose a strong password to secure your AgriVanta account."}
          </p>
        </div>

        {tokenLoading ? (
          <p className="mt-8 text-center text-sm text-[#718071]">
            Preparing your recovery session...
          </p>
        ) : success ? (
          <div className="mt-8 space-y-4">
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#17472D] px-4 py-3.5 font-bold text-white hover:bg-[#235B3A]"
            >
              Continue to login
              <ArrowRight size={17} />
            </Link>
          </div>
        ) : resetToken ? (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block text-sm font-semibold">
              New password
              <span className="relative mt-2 block">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={10}
                  maxLength={72}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Enter your new password"
                  className="w-full rounded-lg border border-[#D9DED4] px-4 py-3 pr-12 font-normal outline-none focus:border-[#17472D]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718071]"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </span>
            </label>

            <label className="block text-sm font-semibold">
              Confirm new password
              <span className="relative mt-2 block">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={10}
                  maxLength={72}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Enter your new password again"
                  className="w-full rounded-lg border border-[#D9DED4] px-4 py-3 pr-12 font-normal outline-none focus:border-[#17472D]"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((value) => !value)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirmation password"
                      : "Show confirmation password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718071]"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </span>
            </label>

            <p className="text-xs leading-5 text-[#718071]">
              Use at least 10 characters. Your password must not exceed 72
              bytes.
            </p>

            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#17472D] px-4 py-3.5 font-bold text-white hover:bg-[#235B3A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Updating password..." : "Reset password"}
              {!loading && <KeyRound size={18} />}
            </button>
          </form>
        ) : (
          <div className="mt-8 space-y-4">
            <Link
              href="/forgot-password"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#17472D] px-4 py-3.5 font-bold text-white hover:bg-[#235B3A]"
            >
              Request a new recovery code
              <ArrowRight size={17} />
            </Link>
          </div>
        )}

        {error && !success && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {!success && (
          <p className="mt-7 text-center text-sm text-[#718071]">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-bold text-[#17472D] hover:underline"
            >
              Log in
            </Link>
          </p>
        )}
      </section>
    </main>
  );
}
