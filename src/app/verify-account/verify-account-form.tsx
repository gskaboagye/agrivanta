"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Leaf, Mail, MessageSquare, ShieldCheck } from "lucide-react";
import { emailSchema } from "@/lib/validation";

type Channel = "email" | "sms";

type VerifyAccountFormProps = {
  initialEmail: string;
};

export default function VerifyAccountForm({
  initialEmail,
}: VerifyAccountFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState(initialEmail);
  const [channel, setChannel] = useState<Channel>("email");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function requestCode() {
    setError("");
    setMessage("");

    const emailResult = emailSchema.safeParse(email);

    if (!emailResult.success) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/verification/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailResult.data,
          purpose: "registration",
          channel,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Unable to send your verification code.");
        return;
      }

      setCodeSent(true);
      setMessage(
        result.message || "Your verification code has been sent."
      );
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the six-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/verification/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code,
          purpose: "registration",
          channel,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Verification failed.");
        return;
      }

      setMessage(
        result.message || "Your account has been verified successfully."
      );

      window.setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 1200);
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
            <ShieldCheck size={29} />
          </span>

          <h1 className="mt-5 text-2xl font-extrabold">
            Verify your account
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#718071]">
            Confirm your email address or phone number to activate your
            AgriVanta account.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          <label className="block text-sm font-semibold">
            Email address
            <input
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading || codeSent}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-lg border border-[#D9DED4] px-4 py-3 font-normal outline-none focus:border-[#17472D] disabled:bg-gray-50"
            />
          </label>

          <div>
            <p className="text-sm font-semibold">Choose verification method</p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={loading || codeSent}
                onClick={() => setChannel("email")}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-semibold transition ${
                  channel === "email"
                    ? "border-[#17472D] bg-[#EAF2EB] text-[#17472D]"
                    : "border-[#D9DED4] text-[#526354] hover:border-[#17472D]"
                }`}
              >
                <Mail size={17} />
                Email
              </button>

              <button
                type="button"
                disabled={loading || codeSent}
                onClick={() => setChannel("sms")}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-semibold transition ${
                  channel === "sms"
                    ? "border-[#17472D] bg-[#EAF2EB] text-[#17472D]"
                    : "border-[#D9DED4] text-[#526354] hover:border-[#17472D]"
                }`}
              >
                <MessageSquare size={17} />
                SMS
              </button>
            </div>
          </div>

          {!codeSent ? (
            <button
              type="button"
              onClick={requestCode}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#17472D] px-4 py-3.5 font-bold text-white hover:bg-[#235B3A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending code..." : "Send verification code"}
              {!loading && <ArrowRight size={17} />}
            </button>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <label className="block text-sm font-semibold">
                Six-digit verification code
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  className="mt-2 w-full rounded-lg border border-[#D9DED4] px-4 py-3 text-center text-xl font-bold tracking-[0.4em] outline-none focus:border-[#17472D]"
                />
              </label>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#17472D] px-4 py-3.5 font-bold text-white hover:bg-[#235B3A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify account"}
                {!loading && <ShieldCheck size={18} />}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setCodeSent(false);
                  setCode("");
                  setError("");
                  setMessage("");
                }}
                className="w-full text-sm font-semibold text-[#17472D] hover:underline"
              >
                Change method or request another code
              </button>
            </form>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {message && (
            <p
              role="status"
              className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
            >
              {message}
            </p>
          )}
        </div>

        <p className="mt-7 text-center text-sm text-[#718071]">
          Already verified?{" "}
          <Link
            href="/login"
            className="font-bold text-[#17472D] hover:underline"
          >
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}

