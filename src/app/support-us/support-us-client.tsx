"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Sprout,
  Users,
  BookOpen,
  HandHeart,
  ShieldCheck,
  CheckCircle2,
  Construction,
} from "lucide-react";

const amounts = [25, 50, 100, 250, 500];

const reasons = [
  {
    icon: Sprout,
    title: "Support agricultural connections",
    description:
      "Help bring farmers, buyers, suppliers and service providers closer together.",
  },
  {
    icon: BookOpen,
    title: "Improve access to knowledge",
    description:
      "Support the development of useful agricultural learning resources and information.",
  },
  {
    icon: Users,
    title: "Grow the agricultural community",
    description:
      "Help us build a platform that creates opportunities for people across agriculture.",
  },
];

export default function SupportUsClient() {
  const [frequency, setFrequency] = useState<"once" | "monthly">("once");
  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState("");

  const selectedAmount = customAmount
    ? Number(customAmount)
    : amount;

  return (
    <main className="min-h-screen bg-[#F8F6EE] text-[#193D2A]">
      <section className="relative isolate overflow-hidden bg-[#17472D]">
        <div className="absolute inset-0 -z-10">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=85"
            alt=""
            className="h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#103720] via-[#17472D]/95 to-[#17472D]/70" />
        </div>

        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-white/80 transition hover:text-[#E6BD57]"
          >
            <ArrowLeft size={18} />
            Back to Home
          </Link>

          <div className="mt-12 max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#E6BD57]">
              <HandHeart size={15} />
              Support AgriVanta
            </span>

            <h1 className="mt-7 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Help us build a stronger agricultural{" "}
              <span className="text-[#E6BD57]">community.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/80 sm:text-lg">
              AgriVanta is working to connect farmers, buyers, suppliers,
              workers and agricultural experts across Ghana. Your support
              can help us continue developing this platform and expanding
              access to agricultural opportunities.
            </p>

            <a
              href="#contribute"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#E6BD57] px-6 py-3.5 text-sm font-extrabold text-[#173D28] transition hover:bg-[#F0CE76]"
            >
              Explore contribution options
              <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B8872D]">
            Why your support matters
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#17472D] sm:text-4xl">
            Be part of the journey
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#718071] sm:text-base">
            Building a useful agricultural platform takes commitment,
            technology and a community that believes in the vision.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {reasons.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-2xl border border-[#E3E8DE] bg-white p-7 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF0E6] text-[#17472D]">
                  <Icon size={24} />
                </div>
                <h3 className="mt-5 text-lg font-extrabold text-[#17472D]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#718071]">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="contribute"
        className="border-y border-[#E3E8DE] bg-white py-16 sm:py-20"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B8872D]">
              Make a contribution
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#17472D] sm:text-4xl">
              Every contribution counts.
            </h2>
            <p className="mt-5 text-sm leading-7 text-[#718071] sm:text-base">
              Choose how you would like to support the continued development
              of AgriVanta. You will be able to make a secure contribution
              when our payment system is ready.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-[#23834A]" size={20} />
                <p className="text-sm leading-6 text-[#526557]">
                  Choose a one-time or monthly contribution.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-[#23834A]" size={20} />
                <p className="text-sm leading-6 text-[#526557]">
                  Select a suggested amount or enter your own.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 shrink-0 text-[#23834A]" size={20} />
                <p className="text-sm leading-6 text-[#526557]">
                  Payment options will be introduced after deployment and
                  testing.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E3E8DE] bg-[#F8F6EE] p-6 shadow-sm sm:p-8">
            <h3 className="text-xl font-extrabold text-[#17472D]">
              Choose your contribution
            </h3>
            <p className="mt-2 text-sm text-[#718071]">
              Select a contribution frequency and amount.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFrequency("once")}
                className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                  frequency === "once"
                    ? "border-[#17472D] bg-[#EAF0E6] text-[#17472D]"
                    : "border-[#E3E8DE] bg-white text-[#718071] hover:border-[#A7B9A5]"
                }`}
              >
                One-time
              </button>
              <button
                type="button"
                onClick={() => setFrequency("monthly")}
                className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                  frequency === "monthly"
                    ? "border-[#17472D] bg-[#EAF0E6] text-[#17472D]"
                    : "border-[#E3E8DE] bg-white text-[#718071] hover:border-[#A7B9A5]"
                }`}
              >
                Monthly
              </button>
            </div>

            <div className="mt-7">
              <label className="text-sm font-bold text-[#294532]">
                Select an amount
              </label>

              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {amounts.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setAmount(value);
                      setCustomAmount("");
                    }}
                    className={`rounded-xl border px-2 py-3 text-sm font-bold transition ${
                      amount === value && !customAmount
                        ? "border-[#17472D] bg-[#EAF0E6] text-[#17472D]"
                        : "border-[#E3E8DE] bg-white text-[#718071] hover:border-[#A7B9A5]"
                    }`}
                  >
                    GH₵{value}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor="custom-amount"
                className="text-sm font-bold text-[#294532]"
              >
                Or enter a custom amount (GH₵)
              </label>
              <input
                id="custom-amount"
                type="number"
                min="1"
                max="100000"
                step="0.01"
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
                placeholder="Enter amount"
                className="mt-3 w-full rounded-xl border border-[#DCE3D7] bg-white px-4 py-3 text-sm text-[#193D2A] outline-none transition focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
              />
            </div>

            <div className="mt-6 rounded-xl border border-[#DCE3D7] bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[#718071]">
                Your selected contribution
              </p>
              <p className="mt-2 text-3xl font-extrabold text-[#17472D]">
                GH₵{Number.isFinite(selectedAmount) ? selectedAmount.toFixed(2) : "0.00"}
              </p>
              <p className="mt-1 text-sm text-[#718071]">
                {frequency === "once" ? "One-time contribution" : "Monthly contribution"}
              </p>
            </div>

            <button
              type="button"
              disabled
              className="mt-6 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#17472D]/60 px-5 py-4 text-sm font-bold text-white"
            >
              <Construction size={18} />
              Contributions opening after launch
            </button>

            <p className="mt-4 text-center text-xs leading-6 text-[#718071]">
              No payment will be collected at this stage. Your selected
              contribution is for preview only.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-16 text-center sm:px-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF0E6] text-[#17472D]">
          <Heart size={27} />
        </div>
        <h2 className="mt-5 text-2xl font-extrabold text-[#17472D] sm:text-3xl">
          Thank you for believing in the vision.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#718071] sm:text-base">
          Together, we can make agricultural connections, knowledge and
          opportunities easier to access across Ghana.
        </p>
        <Link
          href="/about"
          className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#17472D] transition hover:text-[#B8872D]"
        >
          Learn more about AgriVanta
          <ArrowRight size={17} />
        </Link>
      </section>
    </main>
  );
}
