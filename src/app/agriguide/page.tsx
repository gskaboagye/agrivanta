"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUp,
  BookOpen,
  Check,
  ExternalLink,
  Languages,
  MessageCircle,
  Sprout,
} from "lucide-react";

type Language = "en" | "tw";

const translations = {
  en: {
    label: "AGRICULTURAL LEARNING ASSISTANT",
    title: "Grow your knowledge.",
    description:
      "Learn better farming practices, explore agricultural information, and build your farming knowledge.",
    welcome: "What would you like to learn today?",
    welcomeDescription:
      "Ask about crop production, soil health, livestock, pests, or agricultural business.",
    placeholder: "Ask a question about farming...",
    send: "Send question",
    language: "Answer language",
    sources: "Trusted agricultural resources",
    sourceDescription:
      "AgriGuide will cite relevant sources when its AI and knowledge retrieval are connected.",
    note: "Educational guidance does not replace advice from a qualified agricultural extension officer.",
    suggestions: [
      "How do I prepare soil for planting maize?",
      "How can I improve tomato production?",
      "What are good poultry management practices?",
      "How can I prevent post-harvest losses?",
    ],
    coming: "The AI is not connected yet. We will enable answers in the next development step.",
    back: "Back to AgriVanta",
  },
  tw: {
    label: "KUAYƐ HO ADESUA BOAFOƆ",
    title: "Sua pii fa kuayɛ ho.",
    description:
      "Sua kuayɛ akwan pa, hwehwɛ kuayɛ ho nsɛm, na ma wo kuayɛ ho nimdeɛ nyɛ kɛse.",
    welcome: "Ɛdeɛn na wopɛ sɛ wusua nnɛ?",
    welcomeDescription:
      "Bisa nsɛm fa nnɔbaeɛ, dɔteɛ, mmoayɛn, nnɔbaeɛ ho mmoawa, anaa kuayɛ adwuma ho.",
    placeholder: "Bisa asɛm bi fa kuayɛ ho...",
    send: "Fa asɛm no kɔ",
    language: "Mmuaeɛ kasa",
    sources: "Kuayɛ ho nsɛm a wotumi de ho to so",
    sourceDescription:
      "Sɛ AI no ne nimdeɛ nhwehwɛmu no yɛ adwuma a, AgriGuide bɛkyerɛ nsɛm a ɛboa ma wɔnya mmuaeɛ a ɛfata.",
    note: "Eyi yɛ adesua ho akwankyerɛ. Ɛnsi kuayɛ ho ɔfotufoɔ a ɔfata ananmu.",
    suggestions: [
      "Mɛyɛ dɛn asiesie dɔteɛ ama mɛdua atoko?",
      "Mɛyɛ dɛn ama tomato nnɔbaeɛ ayɛ pii?",
      "Akwan pa bɛn na wɔfa so hwɛ nkokɔ?",
      "Mɛyɛ dɛn atew nnɔbaeɛ a ɛsɛe wɔ otwa akyi so?",
    ],
    coming: "AI no nnya nyɛ adwuma seesei. Yɛbɛma mmuaeɛ ayɛ adwuma wɔ anammɔn a ɛdi hɔ no mu.",
    back: "San kɔ AgriVanta",
  },
};

export default function AgriGuidePage() {
  const [language, setLanguage] = useState<Language>("en");
  const [question, setQuestion] = useState("");
  const [notice, setNotice] = useState("");

  const t = translations[language];

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!question.trim()) return;

    setNotice(t.coming);
  }

  return (
    <main className="min-h-screen bg-[#F8F6EE] text-[#183D2A]">
      <header className="border-b border-[#E2E7DD] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-2xl font-extrabold">
            Agri<span className="text-[#D9A441]">Vanta</span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-[#526658] hover:text-[#17472D]"
          >
            <ArrowLeft size={17} />
            <span className="hidden sm:inline">{t.back}</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:py-12">
        <aside className="space-y-6">
          <section className="rounded-2xl bg-[#17472D] p-5 text-white">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <Sprout size={28} className="text-[#E8C66F]" />
            </div>

            <p className="text-xs font-semibold uppercase tracking-widest text-[#E8C66F]">
              AgriVanta
            </p>

            <h1 className="mt-2 text-2xl font-bold">AgriGuide AI</h1>

            <p className="mt-2 text-sm leading-6 text-white/75">
              {t.label}
            </p>
          </section>

          <section className="rounded-2xl border border-[#E0E5DA] bg-white p-5">
            <div className="flex items-center gap-2">
              <Languages size={19} />
              <h2 className="font-bold">{t.language}</h2>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setLanguage("en");
                  setNotice("");
                }}
                aria-pressed={language === "en"}
                className={`rounded-lg border px-3 py-3 text-sm font-semibold ${
                  language === "en"
                    ? "border-[#17472D] bg-[#EAF0E6]"
                    : "border-[#E0E5DA] hover:border-[#17472D]"
                }`}
              >
                {language === "en" && (
                  <Check size={15} className="mr-1 inline" />
                )}
                English
              </button>

              <button
                type="button"
                onClick={() => {
                  setLanguage("tw");
                  setNotice("");
                }}
                aria-pressed={language === "tw"}
                className={`rounded-lg border px-3 py-3 text-sm font-semibold ${
                  language === "tw"
                    ? "border-[#17472D] bg-[#EAF0E6]"
                    : "border-[#E0E5DA] hover:border-[#17472D]"
                }`}
              >
                {language === "tw" && (
                  <Check size={15} className="mr-1 inline" />
                )}
                Twi
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E0E5DA] bg-white p-5">
            <div className="flex items-center gap-2">
              <BookOpen size={19} />
              <h2 className="font-bold">{t.sources}</h2>
            </div>

            <p className="mt-3 text-sm leading-6 text-[#657468]">
              {t.sourceDescription}
            </p>

            <div className="mt-4 space-y-4 text-sm">
              <a
                href="https://mofa.gov.gh/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-2 text-[#17472D] hover:underline"
              >
                Ghana Ministry of Food and Agriculture
                <ExternalLink size={15} className="shrink-0" />
              </a>

              <a
                href="https://www.csir.org.gh/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-2 text-[#17472D] hover:underline"
              >
                CSIR Ghana
                <ExternalLink size={15} className="shrink-0" />
              </a>

              <a
                href="https://www.fao.org/ghana/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-2 text-[#17472D] hover:underline"
              >
                FAO Ghana
                <ExternalLink size={15} className="shrink-0" />
              </a>
            </div>
          </section>
        </aside>

        <section className="flex min-h-[680px] flex-col overflow-hidden rounded-2xl border border-[#E0E5DA] bg-white shadow-sm">
          <div className="border-b border-[#E8ECE4] px-5 py-6 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-widest text-[#987526]">
              {t.label}
            </p>

            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              {t.title}
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#657468] sm:text-base">
              {t.description}
            </p>
          </div>

          <div className="flex flex-1 flex-col px-5 py-8 sm:px-8">
            <div className="mx-auto my-auto w-full max-w-2xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF0E6]">
                <MessageCircle size={28} className="text-[#17472D]" />
              </div>

              <h3 className="mt-5 text-center text-xl font-bold">
                {t.welcome}
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-center text-sm leading-6 text-[#657468]">
                {t.welcomeDescription}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {t.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setQuestion(suggestion);
                      setNotice("");
                    }}
                    className="rounded-xl border border-[#E0E5DA] p-4 text-left text-sm leading-6 transition hover:border-[#17472D] hover:bg-[#F8FAF5]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {notice && (
                <p
                  role="status"
                  className="mt-5 rounded-lg border border-[#E9D8A9] bg-[#FFF9E9] p-3 text-sm leading-6 text-[#72551A]"
                >
                  {notice}
                </p>
              )}
            </div>

            <div className="mx-auto mt-10 w-full max-w-2xl">
              <form onSubmit={handleSubmit}>
                <label htmlFor="agri-question" className="sr-only">
                  {t.placeholder}
                </label>

                <div className="flex items-end gap-3 rounded-2xl border border-[#D8DFD4] p-3 shadow-sm focus-within:border-[#17472D]">
                  <textarea
                    id="agri-question"
                    value={question}
                    onChange={(event) => {
                      setQuestion(event.target.value);
                      setNotice("");
                    }}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey &&
                        !event.nativeEvent.isComposing
                      ) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    rows={2}
                    maxLength={2000}
                    placeholder={t.placeholder}
                    className="max-h-36 min-h-12 flex-1 resize-y bg-transparent px-2 py-2 text-sm outline-none"
                  />

                  <button
                    type="submit"
                    disabled={!question.trim()}
                    aria-label={t.send}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#17472D] text-white hover:bg-[#103620] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowUp size={21} />
                  </button>
                </div>
              </form>

              <p className="mt-3 text-center text-xs leading-5 text-[#788478]">
                {t.note}
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer className="border-t border-[#E0E5DA] bg-white px-5 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 text-xs text-[#657468]">
          <span>AgriVanta — Powering Every Link in Agriculture.</span>
          <span>AgriGuide AI</span>
        </div>
      </footer>
    </main>
  );
}
