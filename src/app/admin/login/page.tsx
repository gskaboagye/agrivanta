"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Leaf,
  ShieldCheck,
  LockKeyhole,
  Mail,
  ArrowRight,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (
      !normalizedEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your administrator password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to sign in. Please try again."
        );
      }

      if (!data.success || !data.administrator) {
        throw new Error("The server returned an invalid login response.");
      }

      setPassword("");

      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[#e1e7dd] bg-white py-3 pl-11 pr-4 text-sm text-[#26372b] outline-none transition placeholder:text-[#a0a99c] focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8F4] px-4 py-10">
      <div className="w-full max-w-[480px]">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2"
            aria-label="AgriVanta home"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#17472D] text-white">
              <Leaf size={23} />
            </span>

            <span className="text-2xl font-extrabold tracking-tight text-[#17472D]">
              AgriVanta
            </span>
          </Link>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#e3e9df] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#587052]">
            <ShieldCheck size={14} />
            Administrator Portal
          </div>
        </div>

        <section className="overflow-hidden rounded-[24px] border border-[#e5e9e1] bg-white shadow-[0_15px_55px_rgba(31,55,35,0.07)]">
          <div className="bg-[#17472D] px-6 py-8 text-white sm:px-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
              <LockKeyhole size={23} className="text-[#e7c77e]" />
            </div>

            <h1 className="mt-5 text-2xl font-bold tracking-tight">
              Welcome back
            </h1>

            <p className="mt-2 max-w-sm text-sm leading-6 text-white/70">
              Sign in to access the AgriVanta administration dashboard and
              manage your agricultural platform.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 px-6 py-7 sm:px-9 sm:py-8"
          >
            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-3.5 text-sm text-red-700"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-bold text-[#354737]"
              >
                Administrator email
              </label>

              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#899487]"
                />

                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your administrator email"
                  className={inputClass}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-bold text-[#354737]"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#899487]"
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className={`${inputClass} pr-12`}
                  disabled={loading}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#899487] hover:bg-[#f2f5ef]"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#17472D] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#103921] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign in securely
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
        </section>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs font-medium text-[#899487] transition hover:text-[#17472D]"
          >
            Return to AgriVanta
          </Link>

          <p className="mt-4 text-[11px] text-[#a0a99c]">
            AgriVanta Administrator Portal · Secure platform access
          </p>
        </div>
      </div>
    </main>
  );
}