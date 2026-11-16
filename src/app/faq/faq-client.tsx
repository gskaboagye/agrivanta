"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  CircleHelp,
  MessageCircle,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  UserRound,
  X,
} from "lucide-react";

const categories = [
  { name: "All questions", icon: BookOpen },
  { name: "Getting started", icon: Sprout },
  { name: "Accounts", icon: UserRound },
  { name: "Marketplace", icon: ShoppingBag },
  { name: "Communication", icon: MessageCircle },
  { name: "Privacy & security", icon: ShieldCheck },
  { name: "Support", icon: CircleHelp },
];

const questions = [
  {
    category: "Getting started",
    question: "What is AgriVanta?",
    answer:
      "AgriVanta is an agricultural connection platform designed to bring farmers, buyers, suppliers, workers and agricultural experts together across Ghana. It provides access to agricultural products, services, information and opportunities.",
  },
  {
    category: "Getting started",
    question: "Who can use AgriVanta?",
    answer:
      "Farmers, buyers, suppliers, agricultural workers and agricultural experts can create accounts and use the platform according to their needs and account roles.",
  },
  {
    category: "Getting started",
    question: "How do I create an account?",
    answer:
      "Visit the registration page, provide the requested information, select the appropriate account type and complete the registration process. Follow any verification instructions displayed during registration.",
    href: "/register",
    linkLabel: "Create an account",
  },
  {
    category: "Getting started",
    question: "How do I sign in?",
    answer:
      "Open the login page and enter the email address and password associated with your account.",
    href: "/login",
    linkLabel: "Go to login",
  },
  {
    category: "Accounts",
    question: "How do I manage my profile?",
    answer:
      "Sign in to your account, open your dashboard and select Account details. From your profile page, you can review and update the personal information and preferences available to your account.",
  },
  {
    category: "Accounts",
    question: "Can I change my phone number?",
    answer:
      "You can update your phone number through your profile settings. Phone verification may be required before certain phone-related features become available.",
  },
  {
    category: "Accounts",
    question: "What should I do if I forget my password?",
    answer:
      "Use the Forgot password option on the login page and follow the instructions to reset your password.",
    href: "/forgot-password",
    linkLabel: "Reset your password",
  },
  {
    category: "Marketplace",
    question: "What can I find on the AgriVanta marketplace?",
    answer:
      "The marketplace brings together agricultural products, equipment available for hire, agricultural services, workers, experts and other farming supplies.",
    href: "/products",
    linkLabel: "Explore the marketplace",
  },
  {
    category: "Marketplace",
    question: "How can I create a listing?",
    answer:
      "Sign in to your account and use the listing creation option in your dashboard, where available for your account role. Provide accurate information and relevant details about what you are offering.",
  },
  {
    category: "Marketplace",
    question: "How do I find a seller or agricultural service provider?",
    answer:
      "Browse the marketplace, explore available listings and open a listing to review its details and the seller information made available.",
  },
  {
    category: "Communication",
    question: "Can I communicate with other users?",
    answer:
      "AgriVanta provides messaging and inquiry features to help users connect about listings and agricultural opportunities. Available features may depend on your account and the listing.",
  },
  {
    category: "Communication",
    question: "Can I contact a seller through WhatsApp?",
    answer:
      "Where a seller has enabled WhatsApp contact and made their phone number available, the relevant listing or seller page may provide a WhatsApp contact option.",
  },
  {
    category: "Privacy & security",
    question: "Is my phone number visible to everyone?",
    answer:
      "Your profile includes privacy preferences that control the visibility of certain contact information. Review your profile settings to manage the available visibility options.",
  },
  {
    category: "Privacy & security",
    question: "How can I keep my account secure?",
    answer:
      "Use a strong, unique password, keep your sign-in details private and sign out when using a shared device. Never share verification codes or passwords with another person.",
  },
  {
    category: "Support",
    question: "How can I get help with a problem?",
    answer:
      "Visit the Support Us page for information about AgriVanta's mission and contribution options. You can also use the feedback page to share feedback or report an issue.",
    href: "/feedback",
    linkLabel: "Share feedback",
  },
  {
    category: "Support",
    question: "Can I make a financial contribution to AgriVanta now?",
    answer:
      "The contribution page currently allows you to preview one-time or monthly contribution amounts. Payment collection is not active yet, and no payment will be collected at this stage.",
    href: "/support-us",
    linkLabel: "Visit Support Us",
  },
  {
    category: "Support",
    question: "Where can I learn about AgriVanta?",
    answer:
      "Visit the About Us page to learn more about the platform and its mission to connect people and opportunities across Ghana's agricultural sector.",
    href: "/about",
    linkLabel: "About AgriVanta",
  },
];

export default function FAQClient() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All questions");
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const filteredQuestions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return questions.filter((item) => {
      const matchesCategory =
        activeCategory === "All questions" ||
        item.category === activeCategory;

      const matchesSearch =
        !query ||
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  return (
    <main className="min-h-screen bg-[#F8F6EE] text-[#193D2A]">
      <section className="bg-[#17472D]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/75 transition hover:text-[#E6BD57]"
          >
            <ArrowRight className="rotate-180" size={17} />
            Back to home
          </Link>

          <div className="mt-10 max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#E6BD57]">
              <CircleHelp size={15} />
              Help centre
            </span>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Frequently asked{" "}
              <span className="text-[#E6BD57]">questions.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">
              Find helpful answers about using AgriVanta, managing your
              account and connecting with Ghana's agricultural community.
            </p>
          </div>

          <div className="mt-9 flex max-w-2xl items-center gap-3 rounded-xl border border-white/15 bg-white px-4 py-2 shadow-lg">
            <Search className="shrink-0 text-[#718071]" size={21} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search questions or topics..."
              aria-label="Search frequently asked questions"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-[#193D2A] outline-none placeholder:text-[#929b90]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="rounded-lg p-2 text-[#718071] hover:bg-[#F0F3ED]"
              >
                <X size={17} />
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[250px_1fr] lg:py-16">
        <aside>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-[#879487]">
            Browse by category
          </h2>

          <div className="flex gap-2 overflow-x-auto pb-3 lg:flex-col lg:overflow-visible">
            {categories.map((category) => {
              const Icon = category.icon;
              const active = activeCategory === category.name;

              return (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => {
                    setActiveCategory(category.name);
                    setOpenQuestion(null);
                  }}
                  className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                    active
                      ? "bg-[#17472D] text-white shadow-sm"
                      : "border border-[#E3E8DE] bg-white text-[#647568] hover:border-[#A7B9A5] hover:text-[#17472D]"
                  }`}
                >
                  <Icon size={18} />
                  {category.name}
                </button>
              );
            })}
          </div>
        </aside>

        <div>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-[#17472D] sm:text-2xl">
                {activeCategory === "All questions"
                  ? "All questions"
                  : activeCategory}
              </h2>
              <p className="mt-1 text-sm text-[#879487]">
                {filteredQuestions.length}{" "}
                {filteredQuestions.length === 1 ? "question" : "questions"} found
              </p>
            </div>
          </div>

          {filteredQuestions.length > 0 ? (
            <div className="space-y-3">
              {filteredQuestions.map((item) => {
                const isOpen = openQuestion === item.question;

                return (
                  <article
                    key={item.question}
                    className="overflow-hidden rounded-2xl border border-[#E3E8DE] bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() =>
                        setOpenQuestion(isOpen ? null : item.question)
                      }
                      className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
                    >
                      <span>
                        <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#B8872D]">
                          {item.category}
                        </span>
                        <span className="text-sm font-bold leading-6 text-[#294532] sm:text-base">
                          {item.question}
                        </span>
                      </span>
                      <ChevronDown
                        size={20}
                        className={`shrink-0 text-[#17472D] transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="border-t border-[#EDF0E9] px-5 pb-5 pt-4 sm:px-6">
                        <p className="text-sm leading-7 text-[#647568]">
                          {item.answer}
                        </p>
                        {item.href && (
                          <Link
                            href={item.href}
                            className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#17472D] transition hover:text-[#B8872D]"
                          >
                            {item.linkLabel}
                            <ArrowRight size={15} />
                          </Link>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#C9D5C5] bg-white px-6 py-14 text-center">
              <Search className="mx-auto text-[#A2B09F]" size={30} />
              <h3 className="mt-4 text-lg font-bold text-[#294532]">
                No matching questions
              </h3>
              <p className="mt-2 text-sm text-[#879487]">
                Try another search term or choose a different category.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("All questions");
                }}
                className="mt-5 text-sm font-bold text-[#17472D] hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-[#E3E8DE] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-12 sm:px-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-extrabold text-[#17472D]">
              Still need help?
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-[#718071]">
              Share your feedback or visit our Support Us page to learn more
              about the AgriVanta mission.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/feedback"
              className="inline-flex items-center gap-2 rounded-xl bg-[#17472D] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#23613D]"
            >
              Contact through feedback
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/support-us"
              className="inline-flex items-center gap-2 rounded-xl border border-[#DCE7D9] px-5 py-3 text-sm font-bold text-[#17472D] transition hover:bg-[#F5F8F2]"
            >
              Support AgriVanta
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
