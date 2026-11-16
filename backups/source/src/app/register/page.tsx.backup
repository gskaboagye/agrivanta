"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Leaf } from "lucide-react";

const roles = [
  { value: "farmer", label: "Farmer" },
  { value: "buyer", label: "Buyer" },
  { value: "supplier", label: "Supplier / Service Provider" },
  { value: "worker", label: "Farm Worker" },
  { value: "expert", label: "Agricultural Expert" },
];

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("farmer");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          role,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Unable to create your account.");
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
    <main className="min-h-screen bg-[#F8F6EE] px-4 py-10 text-[#193D2A] sm:py-16">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-[#E7E4D9] bg-white shadow-sm md:grid md:grid-cols-2">
        <section className="flex flex-col justify-between bg-[#17472D] p-8 text-white sm:p-10">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D9A441] text-[#17472D]">
              <Leaf size={25} />
            </span>
            <span className="text-2xl font-extrabold">AgriVanta</span>
          </Link>

          <div className="py-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E6BD57]">
              Join the agricultural network
            </p>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">
              Grow your opportunities.
            </h1>
            <p className="mt-4 leading-7 text-white/75">
              Connect with farmers, buyers, suppliers, workers and
              agricultural experts across Ghana.
            </p>
          </div>

          <p className="text-sm text-white/65">
            Powering Every Link in Agriculture.
          </p>
        </section>

        <section className="p-6 sm:p-10">
          <h2 className="text-2xl font-extrabold">Create your account</h2>
          <p className="mt-2 text-sm text-[#718071]">
            Enter your details to join AgriVanta.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block text-sm font-semibold">
              Full name
              <input
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-lg border border-[#D9DED4] px-4 py-3 font-normal outline-none focus:border-[#17472D]"
                placeholder="Your full name"
              />
            </label>

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
              Phone number <span className="font-normal text-[#718071]">(optional)</span>
              <input
                type="tel"
                maxLength={30}
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-2 w-full rounded-lg border border-[#D9DED4] px-4 py-3 font-normal outline-none focus:border-[#17472D]"
                placeholder="Your contact number"
              />
            </label>

            <label className="block text-sm font-semibold">
              Account type
              <select
                required
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="mt-2 w-full rounded-lg border border-[#D9DED4] bg-white px-4 py-3 font-normal outline-none focus:border-[#17472D]"
              >
                {roles.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold">
              Password
              <span className="relative mt-2 block">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  minLength={10}
                  maxLength={72}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-[#D9DED4] px-4 py-3 pr-12 font-normal outline-none focus:border-[#17472D]"
                  placeholder="At least 10 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718071]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            <label className="block text-sm font-semibold">
              Confirm password
              <input
                required
                type="password"
                minLength={10}
                maxLength={72}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-2 w-full rounded-lg border border-[#D9DED4] px-4 py-3 font-normal outline-none focus:border-[#17472D]"
                placeholder="Enter your password again"
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
              {loading ? "Creating account..." : "Create account"}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#718071]">
            Already registered?{" "}
            <Link href="/login" className="font-bold text-[#17472D] hover:underline">
              Log in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}