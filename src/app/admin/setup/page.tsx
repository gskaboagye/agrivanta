
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Leaf,
  ShieldCheck,
  LockKeyhole,
  UserRound,
  Mail,
  ArrowRight,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function AdminSetupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupSecret, setSetupSecret] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [availability, setAvailability] = useState<
    "checking" | "available" | "unavailable" | "error"
  >("checking");

  useEffect(() => {
    const controller = new AbortController();

    async function checkSetupAvailability() {
      try {
        const response = await fetch("/api/admin/setup/status", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to verify setup availability."
          );
        }

        setAvailability(
          data.available === true ? "available" : "unavailable"
        );
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        console.error("Setup availability check failed:", err);
        setAvailability("error");
      }
    }

    checkSetupAvailability();

    return () => controller.abort();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    if (password.length < 12) {
      setError("Your password must contain at least 12 characters.");
      return;
    }

    if (new TextEncoder().encode(password).length > 72) {
      setError("Your password must not exceed 72 UTF-8 bytes.");
      return;
    }

    if (setupSecret.length < 32) {
      setError("Enter the valid administrator setup secret.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/setup", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          setupSecret,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to create administrator account."
        );
      }

      setSuccess(
        "Your administrator account has been created successfully. Redirecting to login..."
      );

      // Clear sensitive form values.
      setPassword("");
      setConfirmPassword("");
      setSetupSecret("");

      window.setTimeout(() => {
        router.replace("/admin/login");
      }, 1800);
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

  if (availability === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F8F4] px-4">
        <div className="text-center">
          <LoaderCircle size={32} className="mx-auto animate-spin text-[#17472D]" />
          <p className="mt-4 text-sm font-medium text-[#587052]">
            Checking administrator setup availability...
          </p>
        </div>
      </main>
    );
  }

  if (availability === "unavailable" || availability === "error") {
    const setupError = availability === "error";

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F8F4] px-4 py-10">
        <section className="w-full max-w-md rounded-2xl border border-[#e5e9e1] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#17472D]/10">
            {setupError ? (
              <AlertCircle size={26} className="text-[#17472D]" />
            ) : (
              <ShieldCheck size={26} className="text-[#17472D]" />
            )}
          </div>

          <h1 className="mt-5 text-xl font-bold text-[#17472D]">
            {setupError
              ? "Unable to verify setup"
              : "Administrator setup unavailable"}
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#687568]">
            {setupError
              ? "We could not verify whether initial administrator registration is available. Please try again later."
              : "Initial administrator registration has already been completed or started. Please sign in to the administrator portal."}
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {setupError && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full rounded-xl bg-[#17472D] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#103921]"
              >
                Try again
              </button>
            )}

            <Link
              href="/admin/login"
              className="w-full rounded-xl border border-[#dfe6dc] px-5 py-3 text-sm font-bold text-[#17472D] transition hover:bg-[#F7F8F4]"
            >
              Go to administrator login
            </Link>

            <Link
              href="/"
              className="text-sm text-[#899487] hover:underline"
            >
              Return to AgriVanta
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-[#e1e7dd] bg-white py-3 pl-11 pr-4 text-sm text-[#26372b] outline-none transition placeholder:text-[#a0a99c] focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8F4] px-4 py-10">
      <div className="w-full max-w-[520px]">
        <div className="mb-7 text-center">
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
            Secure administrator registration
          </div>
        </div>

        <section className="overflow-hidden rounded-[24px] border border-[#e5e9e1] bg-white shadow-[0_15px_55px_rgba(31,55,35,0.07)]">
          <div className="bg-[#17472D] px-6 py-7 text-white sm:px-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
              <LockKeyhole size={23} className="text-[#e7c77e]" />
            </div>

            <h1 className="mt-5 text-2xl font-bold tracking-tight">
              Create the first administrator
            </h1>

            <p className="mt-2 max-w-sm text-sm leading-6 text-white/70">
              Set up the primary administrator account for managing the
              AgriVanta platform.
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

            {success && (
              <div
                role="status"
                className="flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 p-3.5 text-sm text-green-800"
              >
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <p>{success}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-xs font-bold text-[#354737]"
              >
                Full name
              </label>

              <div className="relative">
                <UserRound
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#899487]"
                />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={80}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your full name"
                  className={inputClass}
                />
              </div>
            </div>

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
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@example.com"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-bold text-[#354737]"
              >
                Administrator password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#899487]"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={12}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 12 characters"
                  className={`${inputClass} pr-12`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#899487] hover:bg-[#f2f5ef]"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <p className="mt-2 text-[11px] text-[#8b9588]">
                Use at least 12 characters. Maximum 72 UTF-8 bytes.
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-xs font-bold text-[#354737]"
              >
                Confirm password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#899487]"
                />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Re-enter your password"
                  className={`${inputClass} pr-12`}
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#899487] hover:bg-[#f2f5ef]"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            <div className="border-t border-[#edf0e9] pt-5">
              <label
                htmlFor="setupSecret"
                className="mb-2 block text-xs font-bold text-[#354737]"
              >
                Private setup secret
              </label>

              <div className="relative">
                <ShieldCheck
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#899487]"
                />
                <input
                  id="setupSecret"
                  type="password"
                  autoComplete="off"
                  required
                  value={setupSecret}
                  onChange={(event) => setSetupSecret(event.target.value)}
                  placeholder="Enter your private setup secret"
                  className={inputClass}
                />
              </div>

              <p className="mt-2 text-[11px] leading-5 text-[#8b9588]">
                Enter the ADMIN_SETUP_SECRET value configured in your
                server environment. It is sent to the setup API and is
                not saved in browser storage.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || Boolean(success)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#17472D] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#103921] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Creating administrator...
                </>
              ) : (
                <>
                  Create administrator account
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            <p className="text-center text-xs text-[#899487]">
              Already have an administrator account?{" "}
              <Link
                href="/admin/login"
                className="font-bold text-[#17472D] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </section>

        <p className="mt-6 text-center text-[11px] leading-5 text-[#929a8e]">
          AgriVanta Administrator Portal
          <span className="mx-2">·</span>
          Secure platform access
        </p>
      </div>
    </main>
  );
}
