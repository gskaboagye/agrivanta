"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquareText,
  Send,
  Star,
  Lightbulb,
  Bug,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";

const feedbackTypes = [
  { value: "General Feedback", label: "General feedback", icon: MessageCircle },
  { value: "Suggestion", label: "Suggestion", icon: Lightbulb },
  { value: "Bug Report", label: "Report a problem", icon: Bug },
  { value: "Complaint", label: "Complaint", icon: MessageSquareText },
];

export default function FeedbackPage() {
  const [type, setType] = useState("General Feedback");
  const [rating, setRating] = useState(0);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!rating) {
      setError("Please select a rating for your experience.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          rating,
          subject,
          message,
          email: email.trim() || undefined,
          website: honeypot,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to submit your feedback.");
      }

      setSubmitted(true);
      setType("General Feedback");
      setRating(0);
      setSubject("");
      setMessage("");
      setEmail("");
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

  return (
    <main className="min-h-screen bg-[#F8F6EE] px-5 py-12 sm:px-8 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#17472D] transition hover:text-[#B8872D]"
        >
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        <header className="mt-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF0E6] text-[#17472D]">
            <MessageSquareText size={30} />
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#B8872D]">
            Your voice matters
          </p>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#17472D] sm:text-4xl">
            Share Your Feedback
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#718071] sm:text-base">
            Help us improve AgriVanta. Share your experience, report a problem,
            or suggest an idea that could make the platform better for
            everyone in agriculture.
          </p>
        </header>

        {submitted ? (
          <section className="mt-10 rounded-2xl border border-[#DCE3D7] bg-white p-8 text-center shadow-sm sm:p-12">
            <CheckCircle2 className="mx-auto text-[#23834A]" size={52} />
            <h2 className="mt-5 text-2xl font-extrabold text-[#17472D]">
              Thank you for your feedback!
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#718071]">
              Your feedback has been submitted successfully. It will help us
              make AgriVanta better.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="mt-7 rounded-lg bg-[#17472D] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#235B3A]"
            >
              Send More Feedback
            </button>
          </section>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-10 space-y-7 rounded-2xl border border-[#E3E8DE] bg-white p-6 shadow-sm sm:p-9"
          >
            <div
  className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
  aria-hidden="true"
>
  <label htmlFor="feedback-website">Leave this field empty</label>
  <input
    id="feedback-website"
    name="website"
    type="text"
    value={honeypot}
    onChange={(event) => setHoneypot(event.target.value)}
    tabIndex={-1}
    autoComplete="off"
  />
</div>

<div>
              <label className="mb-3 block text-sm font-bold text-[#294532]">
                What would you like to share?
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                {feedbackTypes.map((item) => {
                  const Icon = item.icon;
                  const selected = type === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setType(item.value)}
                      className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm font-semibold transition ${
                        selected
                          ? "border-[#17472D] bg-[#EAF0E6] text-[#17472D]"
                          : "border-[#E3E8DE] text-[#718071] hover:border-[#A7B9A5]"
                      }`}
                    >
                      <Icon size={20} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-bold text-[#294532]">
                How would you rate your experience?
              </label>

              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-label={`Rate ${value} out of 5`}
                    aria-pressed={rating === value}
                    onClick={() => setRating(value)}
                    className="rounded-md p-1 transition hover:scale-110"
                  >
                    <Star
                      size={30}
                      className={
                        value <= rating
                          ? "fill-[#D9A441] text-[#D9A441]"
                          : "text-[#C9D0C5]"
                      }
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs text-[#718071]">
                  {rating ? `${rating} out of 5` : "Select a rating"}
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="feedback-subject"
                className="mb-2 block text-sm font-bold text-[#294532]"
              >
                Subject
              </label>
              <input
                id="feedback-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                required
                maxLength={120}
                placeholder="What is your feedback about?"
                className="w-full rounded-lg border border-[#DCE3D7] px-4 py-3 text-sm text-[#294532] outline-none transition placeholder:text-[#A0AA9C] focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
              />
            </div>

            <div>
              <label
                htmlFor="feedback-message"
                className="mb-2 block text-sm font-bold text-[#294532]"
              >
                Your message
              </label>
              <textarea
                id="feedback-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
                minLength={10}
                maxLength={3000}
                rows={6}
                placeholder="Tell us more about your experience or idea..."
                className="w-full resize-y rounded-lg border border-[#DCE3D7] px-4 py-3 text-sm leading-6 text-[#294532] outline-none transition placeholder:text-[#A0AA9C] focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
              />
              <p className="mt-2 text-right text-xs text-[#9AA397]">
                {message.length}/3000 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="feedback-email"
                className="mb-2 block text-sm font-bold text-[#294532]"
              >
                Email address <span className="font-normal text-[#9AA397]">(optional)</span>
              </label>
              <input
                id="feedback-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={254}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[#DCE3D7] px-4 py-3 text-sm text-[#294532] outline-none transition placeholder:text-[#A0AA9C] focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
              />
              <p className="mt-2 text-xs leading-5 text-[#9AA397]">
                Provide your email if you would like us to follow up with you.
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#17472D] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#235B3A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={17} />
              {loading ? "Submitting..." : "Submit Feedback"}
            </button>

            <p className="text-center text-xs leading-5 text-[#9AA397]">
              Your feedback helps us build a stronger agricultural community.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}