"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Leaf } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Unable to log in.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F6EE] px-4 py-12 text-[#193D2A]">
      <div className="w-full max-w-md rounded-2xl border border-[#E7E4D9] bg-white p-6 shadow-sm sm:p-9">
        <Link href="/" className="flex items-center justify-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#17472D] text-[#D9A441]">
            <Leaf size={25} />
          </span>
          <span className="text-2xl font-extrabold">AgriVanta</span>
        </Link>

        <h1 className="mt-8 text-center text-2xl font-extrabold">
          Welcome back
        </h1>
        <p className="mt-2 text-center text-sm text-[#718071]">
          Log in to your AgriVanta account.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <label className="block text-sm font-semibold">
            Email address
            <input
              required
              type="email"
              maxLength={254}
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-lg border border-[#D9DED4] px-4 py-3 font-normal outline-none focus:border-[#17472D]"
              placeholder="you@example.com"
            />
          </label>

          <label className="block text-sm font-semibold">
            Password
            <input
              required
              type="password"
              maxLength={72}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-lg border border-[#D9DED4] px-4 py-3 font-normal outline-none focus:border-[#17472D]"
              placeholder="Enter your password"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#17472D] px-4 py-3.5 font-bold text-white hover:bg-[#235B3A] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
            {!loading && <ArrowRight size={17} />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#718071]">
          Don't have an account?{" "}
          <Link href="/register" className="font-bold text-[#17472D] hover:underline">
            Register
          </Link>
        </p>

        <p className="mt-8 text-center text-xs text-[#718071]">
          Powering Every Link in Agriculture.
        </p>
      </div>
    </main>
  );
}