import NewsPreview from "@/components/home/news-preview";

import {
  ArrowRight,
  Search,
  Sprout,
  Wheat,
  Tractor,
  Beef,
  FlaskConical,
  Trees,
  ShieldCheck,
  MapPin,
  Store,
  MessageCircle,
  ShoppingBag,
  CircleCheck,
  Users,
  GraduationCap,
  Wrench,
  BookOpen,
  Package,
} from "lucide-react";

const marketplaceTypes = [
  {
    title: "Farm products",
    description: "Discover fresh produce, livestock, seeds, fertilizers and other agricultural supplies.",
    icon: ShoppingBag,
    href: "/products?type=product",
  },
  {
    title: "Equipment for hire",
    description: "Find tractors, irrigation systems and agricultural machinery available for hire.",
    icon: Tractor,
    href: "/products?type=hire",
  },
  {
    title: "Farm services",
    description: "Connect with service providers offering land preparation, planting, harvesting and other farm services.",
    icon: Wrench,
    href: "/products?type=service",
  },
  {
    title: "Agricultural workers",
    description: "Find workers for planting, weeding, harvesting and other agricultural activities.",
    icon: Users,
    href: "/products?type=worker",
  },
  {
    title: "Agricultural experts",
    description: "Connect with agronomists and agricultural advisers for crop, soil and livestock guidance.",
    icon: GraduationCap,
    href: "/products?type=expert",
  },
  {
    title: "Tools and supplies",
    description: "Explore tools, equipment, spare parts and essential supplies for farm operations.",
    icon: Package,
    href: "/products?category=Farm%20Equipment",
  },
];

const categories = [
  { name: "Farm Produce", detail: "Grains, fruits and fresh vegetables", icon: Wheat },
  { name: "Seeds & Seedlings", detail: "Seeds and seedlings for crop production", icon: Sprout },
  { name: "Fertilizers", detail: "Nutrients to support healthy crop growth", icon: Trees },
  { name: "Crop Protection", detail: "Products for managing pests and crop diseases", icon: FlaskConical },
  { name: "Livestock & Feed", detail: "Livestock, animal feed and related supplies", icon: Beef },
  { name: "Farm Equipment", detail: "Agricultural tools, machinery and equipment", icon: Tractor },
];

const safetyTips = [
  "Confirm product details, quantities, prices and delivery arrangements in writing.",
  "Inspect goods upon delivery whenever possible and document any discrepancies.",
  "Confirm payments directly with your payment provider. Never rely on payment screenshots alone.",
  "Keep transaction records and report suspicious activities.",
];

const steps = [
  {
    number: "01",
    title: "Find what you need",
    description: "Search for products, categories, locations or agricultural services.",
  },
  {
    number: "02",
    title: "Review the offer",
    description: "Examine product descriptions, prices, availability and seller information.",
  },
  {
    number: "03",
    title: "Agree on the details",
    description: "Confirm product quality, quantities, delivery or collection arrangements and payment terms.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F8F6EE] text-[#193D2A]">
      <div className="bg-[#17472D] px-4 py-2 text-center text-xs font-medium tracking-wide text-white sm:text-sm">
        Connecting Ghana&apos;s agricultural value chain
      </div>



      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[#17472D]">
        <div className="absolute inset-0 -z-10">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=80"
            alt=""
            className="h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#103720] via-[#17472D]/90 to-[#17472D]/55" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold tracking-wide text-[#E8CA78] sm:text-sm">
              <MapPin size={15} /> Ghana&apos;s agricultural marketplace
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Agriculture works better when we <span className="text-[#E6BD57]">connect.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
              Discover farm produce and supplies, explore equipment and services, and access practical farming information — all in one place.
            </p>

            <form action="/products" className="mt-8 flex max-w-xl flex-col gap-2 rounded-xl bg-white p-2 shadow-xl sm:flex-row">
              <label className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <Search size={21} className="shrink-0 text-[#64806C]" />
                <span className="sr-only">Search the marketplace</span>
                <input
                  name="q"
                  type="search"
                  placeholder="Search maize, fertilizer, tractors..."
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[#193D2A] outline-none placeholder:text-gray-500"
                />
              </label>
              <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#D9A441] px-6 py-3 font-bold text-[#173B27] transition hover:bg-[#E7B958]">
                Search marketplace <ArrowRight size={17} />
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/75">
              <span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-[#E6BD57]" /> Practical safety guidance</span>
              <span className="inline-flex items-center gap-2"><MapPin size={16} className="text-[#E6BD57]" /> Built for Ghana</span>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/products" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 font-bold text-[#17472D] transition hover:bg-[#F1F2E8]">
                Explore marketplace <ArrowRight size={17} />
              </a>
              <a href="/register?role=seller" className="inline-flex items-center justify-center rounded-lg border border-white/40 px-5 py-3 font-bold text-white transition hover:bg-white/10">
                Start selling
              </a>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-4 rounded-[2rem] border border-white/20" />
            <img
              src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1000&q=80"
              alt="Cultivated farmland"
              className="h-[420px] w-full rounded-[1.5rem] object-cover shadow-2xl"
            />
            <div className="absolute -bottom-5 -left-7 max-w-xs rounded-xl bg-white p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#EAF0E6] text-[#17472D]">
                  <Store size={23} />
                </span>
                <div>
                  <p className="font-bold">Your next opportunity starts here</p>
                  <p className="mt-1 text-xs text-gray-600">Products, equipment, workers and services</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace paths */}
      <section id="marketplace" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9B741F]">Marketplace</p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">What do you need for your farm?</h2>
            <p className="mt-3 text-sm leading-7 text-[#647367] sm:text-base">
              Choose a starting point to find agricultural products, people and services.
            </p>
          </div>
          <a href="/products" className="inline-flex items-center gap-2 text-sm font-bold text-[#17472D] hover:text-[#9B741F]">
            Browse everything <ArrowRight size={17} />
          </a>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {marketplaceTypes.map((item) => {
            const Icon = item.icon;
            return (
              <a key={item.title} href={item.href} className="group rounded-2xl border border-[#E7E4D9] bg-white p-5 transition hover:-translate-y-1 hover:border-[#B5C6AF] hover:shadow-lg sm:p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF0E6] text-[#17472D] transition group-hover:bg-[#17472D] group-hover:text-white">
                  <Icon size={24} strokeWidth={1.8} />
                </span>
                <h3 className="mt-4 font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#718071]">{item.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#17472D]">
                  Explore <ArrowRight size={15} />
                </span>
              </a>
            );
          })}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="border-y border-[#E7E4D9] bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9B741F]">Browse by category</p>
              <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">Explore agricultural essentials</h2>
              <p className="mt-3 text-sm leading-6 text-[#647367] sm:text-base">Find supplies and products for different farming needs.</p>
            </div>
            <a href="/products" className="inline-flex items-center gap-2 text-sm font-bold text-[#17472D] hover:text-[#9B741F]">
              View marketplace <ArrowRight size={17} />
            </a>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <a key={category.name} href={`/products?category=${encodeURIComponent(category.name)}`} className="group rounded-xl border border-[#E7E4D9] bg-[#F8F6EE] p-4 transition hover:-translate-y-1 hover:border-[#B5C6AF] hover:shadow-md sm:p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF0E6] text-[#17472D] transition group-hover:bg-[#17472D] group-hover:text-white">
                    <Icon size={23} strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-4 text-sm font-bold leading-5">{category.name}</h3>
                  <p className="mt-2 text-xs leading-5 text-[#718071]">{category.detail}</p>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Farm tools */}
      <section id="farm-tools" className="bg-[#F1F2E8] py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9B741F]">Farm knowledge and technology</p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">Useful tools for informed decisions</h2>
            <p className="mt-3 text-sm leading-7 text-[#647367] sm:text-base">
              Explore practical agricultural learning resources alongside the marketplace.
            </p>
          </div>

          <div className="mt-7 max-w-3xl">
            <article className="rounded-2xl border border-[#E0E3D8] bg-white p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#FCF2D9] text-[#8B681C]"><MessageCircle size={28} /></span>
                <div className="flex-1">
                  <h3 className="text-xl font-extrabold">AgriGuide</h3>
                  <p className="mt-2 text-sm leading-6 text-[#647367]">
                    Explore agricultural learning topics such as crop production, soil health, livestock care and farm business. Get practical information to support better decisions across your farming activities.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
  <a
    href="/agriguide"
    className="inline-flex items-center gap-2 rounded-lg bg-[#17472D] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#235B3A]"
  >
    Open AgriGuide <ArrowRight size={16} />
  </a>
  <a
    href="/register?redirect=%2Fagriguide"
    className="inline-flex items-center gap-2 rounded-lg border border-[#17472D] px-5 py-3 text-sm font-bold text-[#17472D] transition hover:bg-[#F1F2E8]"
  >
    Create an account
  </a>
</div>
                  <p className="mt-3 text-xs leading-5 text-[#718071]">
                    AI-powered answers require an active AI service connection. Advice should be checked against trusted local guidance.
                  </p>
                </div>
              </div>
            </article>
          </div>

          <div className="mt-5 rounded-2xl border border-[#E0E3D8] bg-white p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF0E6] text-[#17472D]"><BookOpen size={22} /></span>
              <div className="flex-1">
                <h3 className="font-bold">Trusted agricultural information</h3>
                <p className="mt-1 text-sm leading-6 text-[#647367]">
                  Access agricultural updates, research and practical farming guidance from trusted institutions and organizations.
                </p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
                  <a href="https://mofa.gov.gh/" target="_blank" rel="noopener noreferrer" className="text-[#17472D] underline-offset-4 hover:underline">Ministry of Food and Agriculture</a>
                  <a href="https://www.fao.org/ghana/en" target="_blank" rel="noopener noreferrer" className="text-[#17472D] underline-offset-4 hover:underline">FAO Ghana</a>
                  <a href="https://www.csir.org.gh/" target="_blank" rel="noopener noreferrer" className="text-[#17472D] underline-offset-4 hover:underline">CSIR Ghana</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-[#E7E4D9] bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9B741F]">Getting started</p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">How AgriVanta Works</h2>
            <p className="mt-3 text-sm leading-7 text-[#647367] sm:text-base">
              Search for what you need, review available offers, and communicate with the other party to agree on the details before completing a transaction.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <article key={step.number} className="rounded-2xl border border-[#E7E4D9] bg-[#F8F6EE] p-5 sm:p-6">
                <span className="text-sm font-extrabold tracking-widest text-[#B48A2A]">{step.number}</span>
                <h3 className="mt-3 font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#718071]">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Agricultural News */}
      <NewsPreview />

      {/* Safety */}
      <section id="safe-trading" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#EAF0E6] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#17472D]">
              <ShieldCheck size={16} /> Trade carefully
            </span>
            <h2 className="mt-5 text-2xl font-extrabold sm:text-3xl">Trade with Confidence and Make Informed Decisions</h2>
            <p className="mt-4 text-sm leading-7 text-[#647367] sm:text-base">
              Verify important details, communicate clearly and keep records of your agreements. Use AgriVanta to discover available offers, then confirm all arrangements directly before completing a transaction.
            </p>
          </div>
          <div className="rounded-2xl border border-[#E7E4D9] bg-white p-5 sm:p-7">
            <div className="space-y-4">
              {safetyTips.map((tip) => (
                <div key={tip} className="flex items-start gap-3">
                  <CircleCheck size={20} className="mt-0.5 shrink-0 text-[#398153]" />
                  <p className="text-sm leading-6 text-[#526755]">{tip}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 border-t border-[#E7E4D9] pt-4 text-xs leading-5 text-[#718071]">
              Do not assume a seller is verified or that escrow, payment protection or dispute resolution is available unless the platform explicitly confirms those features.
            </p>
          </div>
        </div>
      </section>

      {/* Seller call to action */}
      <section className="px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-[#17472D]">
          <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center lg:p-12">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E6BD57]">For farmers and providers</p>
              <h2 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">Reach More Customers Through AgriVanta</h2>
              <p className="mt-3 text-sm leading-7 text-white/75 sm:text-base">
                List your agricultural products, equipment or services and connect with potential customers looking for solutions.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a href="/register?role=seller" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#D9A441] px-5 py-3.5 text-sm font-bold text-[#173B27] transition hover:bg-[#E7B958]">
                Create an account <ArrowRight size={17} />
              </a>
              <a href="/products" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">
                Explore listings <ArrowRight size={17} />
              </a>
            </div>
          </div>
        </div>
      </section>

            <footer className="bg-[#103720] text-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

            {/* Brand */}
            <div>
              <a href="/" className="inline-flex items-center gap-2 text-xl font-extrabold tracking-tight">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <Sprout size={23} />
                </span>
                AgriVanta
              </a>

              <p className="mt-4 max-w-sm text-sm leading-7 text-white/70">
                Connecting people, trade, knowledge and technology
                to create opportunities across Ghana's agricultural sector.
              </p>
            </div>

            {/* Marketplace */}
            <div>
              <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-white">
                Marketplace
              </h3>
              <div className="space-y-3 text-sm text-white/70">
                <a href="/products" className="block transition hover:text-[#D9A441]">Browse agricultural products</a>
                <a href="/products?type=hire" className="block transition hover:text-[#D9A441]">Equipment and machinery hire</a>
                <a href="/products?type=worker" className="block transition hover:text-[#D9A441]">Agricultural workers</a>
                <a href="/products?type=expert" className="block transition hover:text-[#D9A441]">Agricultural experts</a>
              </div>
            </div>

            {/* Account and resources */}
            <div>
              <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-white">
                Discover AgriVanta
              </h3>
              <div className="space-y-3 text-sm text-white/70">
                <a href="/agriguide" className="block transition hover:text-[#D9A441]">AgriGuide</a>
                <a href="/news" className="block transition hover:text-[#D9A441]">Agricultural news</a>
                <a href="/reports" className="block transition hover:text-[#D9A441]">Reports</a>
                <a href="/about" className="block transition hover:text-[#D9A441]">About Us</a>
                <a href="/feedback" className="block transition hover:text-[#D9A441]">Feedback</a>
                <a href="/faq" className="block transition hover:text-[#D9A441]">Frequently Asked Questions</a>
              </div>
            </div>

            {/* Support and social */}
            <div>
              <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-white">
                Support Our Mission
              </h3>

              <a
                href="/support-us"
                className="inline-flex items-center gap-2 rounded-lg bg-[#D9A441] px-4 py-3 text-sm font-bold text-[#173B27] transition hover:bg-[#E7B958]"
              >
                <Sprout size={18} />
                Support AgriVanta
                <ArrowRight size={16} />
              </a>

              <p className="mt-4 text-sm leading-6 text-white/65">
                Your support helps us develop a more connected and accessible
                agricultural community.
              </p>

              <h3 className="mb-3 mt-6 text-sm font-bold text-white">
                Follow AgriVanta
              </h3>

              <div className="flex flex-wrap gap-3">
                {[
                  {
                    name: "Facebook",
                    icon: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1V8c0-.9.3-1.5 1.6-1.5h1.7V3.7c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2H7.3V13h2.8v8z" /></svg>,
                  },
                  {
                    name: "Instagram",
                    icon: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>,
                  },
                  {
                    name: "LinkedIn",
                    icon: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M5 8.5H2V21h3V8.5ZM3.5 2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6ZM21 13.2c0-3.7-2-5.4-4.7-5.4a4 4 0 0 0-3.6 2V8.5h-3V21h3v-6.2c0-1.6.3-3.2 2.3-3.2s2 1.9 2 3.3V21h3v-7.8Z" /></svg>,
                  },
                  {
                    name: "YouTube",
                    icon: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M23 12s0-3.4-.4-5a2.5 2.5 0 0 0-1.8-1.8C19.2 4.8 12 4.8 12 4.8s-7.2 0-8.8.4A2.5 2.5 0 0 0 1.4 7C1 8.6 1 12 1 12s0 3.4.4 5a2.5 2.5 0 0 0 1.8 1.8c1.6.4 8.8.4 8.8.4s7.2 0 8.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-5 .4-5Z" /><path d="m10 15.5 6-3.5-6-3.5v7Z" fill="#103720" /></svg>,
                  },
                  {
                    name: "TikTok",
                    icon: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M19.6 7.2a5.7 5.7 0 0 1-3.5-1.2v8.2a5.7 5.7 0 1 1-5.7-5.7c.4 0 .8 0 1.2.1v3.2a2.5 2.5 0 1 0 1.7 2.4V2h3.1a5.7 5.7 0 0 0 3.2 3.5v1.7Z" /></svg>,
                  },
                ].map((platform) => (
                  <span
                    key={platform.name}
                    title={`${platform.name} — coming soon`}
                    aria-label={`${platform.name} social media page coming soon`}
                    aria-disabled="true"
                    className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-lg border border-white/20 text-white/70 transition hover:border-[#D9A441] hover:text-[#D9A441]"
                  >
                    {platform.icon}
                  </span>
                ))}
              </div>

              <p className="mt-3 text-xs text-white/45">
                Follow our journey. Our official social media pages will be available soon.
              </p>
            </div>
          </div>

          <div className="my-9 border-t border-white/15" />

          <div className="flex flex-col gap-4 text-sm text-white/65 md:flex-row md:items-center md:justify-between">
            <p>
              © 2026 AgriVanta. All rights reserved.
            </p>

            <p>
              Designed &amp; Developed by{" "}
              <span className="font-bold text-white">Godfred Sefa Aboagye</span>
              <span className="mx-2 hidden sm:inline">·</span>
              <span className="block sm:inline">Software Engineer</span>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}








