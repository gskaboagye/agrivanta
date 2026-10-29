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
  CloudSun,
  BookOpen,
  Package,
} from "lucide-react";

const marketplaceTypes = [
  {
    title: "Farm products",
    description: "Explore produce, livestock, seeds, fertilizers and farm supplies.",
    icon: ShoppingBag,
    href: "/products?type=product",
  },
  {
    title: "Equipment for hire",
    description: "Find tractors, irrigation equipment and agricultural machinery.",
    icon: Tractor,
    href: "/products?type=hire",
  },
  {
    title: "Farm services",
    description: "Connect with providers for land preparation, harvesting and more.",
    icon: Wrench,
    href: "/products?type=service",
  },
  {
    title: "Farm labourers",
    description: "Find people for planting, weeding, harvesting and other farm work.",
    icon: Users,
    href: "/products?type=worker",
  },
  {
    title: "Agricultural experts",
    description: "Find agronomists and advisers for crop, soil and livestock support.",
    icon: GraduationCap,
    href: "/products?type=expert",
  },
  {
    title: "Tools and supplies",
    description: "Browse useful equipment, tools and parts for farm operations.",
    icon: Package,
    href: "/products?category=Farm%20Equipment",
  },
];

const categories = [
  { name: "Farm Produce", detail: "Grains, fruits and vegetables", icon: Wheat },
  { name: "Seeds & Seedlings", detail: "Prepare for the next planting", icon: Sprout },
  { name: "Fertilizers", detail: "Nutrients for crop growth", icon: Trees },
  { name: "Crop Protection", detail: "Crop-care products", icon: FlaskConical },
  { name: "Livestock & Feed", detail: "Animals, feed and supplies", icon: Beef },
  { name: "Farm Equipment", detail: "Tools and machinery", icon: Tractor },
];

const safetyTips = [
  "Confirm product details, quantity, price and delivery arrangements in writing.",
  "Inspect goods on delivery when practical and document any differences.",
  "Verify payments with your payment provider; do not rely on screenshots alone.",
  "Keep transaction records and report suspected scams.",
];

const steps = [
  {
    number: "01",
    title: "Find what you need",
    description: "Search by product, category, location or service.",
  },
  {
    number: "02",
    title: "Review the offer",
    description: "Check the description, price, availability and seller details.",
  },
  {
    number: "03",
    title: "Agree on the details",
    description: "Confirm quality, delivery or collection, and payment terms.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F8F6EE] text-[#193D2A]">
      <div className="bg-[#17472D] px-4 py-2 text-center text-xs font-medium tracking-wide text-white sm:text-sm">
        Connecting Ghana&apos;s agricultural value chain
      </div>

      <header className="sticky top-0 z-30 border-b border-[#E7E4D9] bg-[#F8F6EE]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a href="/" className="flex shrink-0 items-center gap-2.5" aria-label="AgriVanta home">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#17472D] text-[#D9A441]">
              <Sprout size={27} strokeWidth={1.8} />
            </span>
            <span>
              <span className="block text-xl font-extrabold tracking-tight sm:text-2xl">AgriVanta</span>
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-[#71806F] sm:block">
                Powering Every Link in Agriculture
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-5 text-sm font-semibold lg:flex" aria-label="Main navigation">
            <a href="/products" className="transition hover:text-[#9B741F]">Marketplace</a>
            <a href="#categories" className="transition hover:text-[#9B741F]">Categories</a>
            <a href="/agriguide" className="transition hover:text-[#9B741F]">AgriGuide</a>
            <a href="/weather" className="transition hover:text-[#9B741F]">Weather</a>
            <a href="#how-it-works" className="transition hover:text-[#9B741F]">How it works</a>
          </nav>

          <div className="flex items-center gap-2">
            <a href="/login" className="hidden rounded-lg px-3 py-2.5 text-sm font-semibold transition hover:bg-[#EDEBDD] sm:inline-flex">
              Sign in
            </a>
            <a href="/register" className="inline-flex items-center gap-2 rounded-lg bg-[#17472D] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#235B3A] sm:px-4">
              Get started <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </header>

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
              Discover farm produce and supplies, find equipment and services, and access practical farming information—all in one place.
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
              Explore weather information and agricultural learning resources alongside the marketplace.
            </p>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <article className="rounded-2xl border border-[#E0E3D8] bg-white p-6 sm:p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF0E6] text-[#17472D]"><CloudSun size={26} /></span>
              <h3 className="mt-4 text-xl font-extrabold">Farm weather</h3>
              <p className="mt-2 text-sm leading-6 text-[#647367]">
                Check weather conditions and forecasts to help plan field work, planting and other farm activities.
              </p>
              <a href="/weather" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#17472D] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#235B3A]">
                View weather <ArrowRight size={16} />
              </a>
            </article>

            <article className="rounded-2xl border border-[#E0E3D8] bg-white p-6 sm:p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FCF2D9] text-[#8B681C]"><MessageCircle size={25} /></span>
              <h3 className="mt-4 text-xl font-extrabold">AgriGuide</h3>
              <p className="mt-2 text-sm leading-6 text-[#647367]">
                Explore agricultural learning topics such as crop production, soil health, livestock care and farm business.
              </p>
              <a href="/agriguide" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#17472D] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#235B3A]">
                Open AgriGuide <ArrowRight size={16} />
              </a>
              <p className="mt-3 text-xs leading-5 text-[#718071]">
                AI-powered answers require an active AI service connection. Advice should be checked against trusted local guidance.
              </p>
            </article>
          </div>

          <div className="mt-5 rounded-2xl border border-[#E0E3D8] bg-white p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF0E6] text-[#17472D]"><BookOpen size={22} /></span>
              <div className="flex-1">
                <h3 className="font-bold">Trusted agricultural information</h3>
                <p className="mt-1 text-sm leading-6 text-[#647367]">
                  Use reliable sources for agricultural updates, weather information and research.
                </p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
                  <a href="https://mofa.gov.gh/" target="_blank" rel="noopener noreferrer" className="text-[#17472D] underline-offset-4 hover:underline">Ministry of Food and Agriculture</a>
                  <a href="https://www.meteo.gov.gh/" target="_blank" rel="noopener noreferrer" className="text-[#17472D] underline-offset-4 hover:underline">Ghana Meteorological Agency</a>
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
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">A clearer way to get connected</h2>
            <p className="mt-3 text-sm leading-7 text-[#647367] sm:text-base">
              Start with a search, review the offer and agree on the details before making a transaction.
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

      {/* Safety */}
      <section id="safe-trading" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#EAF0E6] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#17472D]">
              <ShieldCheck size={16} /> Trade carefully
            </span>
            <h2 className="mt-5 text-2xl font-extrabold sm:text-3xl">Make informed trading decisions.</h2>
            <p className="mt-4 text-sm leading-7 text-[#647367] sm:text-base">
              Always verify important details and keep records of your agreements. Use the platform to discover offers, but confirm arrangements directly before completing a transaction.
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
              <h2 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">Bring your agricultural business to more people.</h2>
              <p className="mt-3 text-sm leading-7 text-white/75 sm:text-base">
                List products, equipment or services and connect with people looking for agricultural offers.
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
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:px-8">
          <div>
            <a href="/" className="text-xl font-extrabold tracking-tight">AgriVanta</a>
            <p className="mt-2 max-w-sm text-sm leading-6 text-white/70">
              Powering Every Link in Agriculture. Connecting trade, knowledge and technology to help agriculture grow.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 text-sm text-white/75 sm:grid-cols-3">
            <div className="space-y-3">
              <p className="font-bold text-white">Marketplace</p>
              <a href="/products" className="block hover:text-white">Browse products</a>
              <a href="/products?type=hire" className="block hover:text-white">Equipment hire</a>
              <a href="/products?type=worker" className="block hover:text-white">Farm labourers</a>
              <a href="/products?type=expert" className="block hover:text-white">Agricultural experts</a>
            </div>
            <div className="space-y-3">
              <p className="font-bold text-white">Your account</p>
              <a href="/login" className="block hover:text-white">Sign in</a>
              <a href="/register" className="block hover:text-white">Create an account</a>
              <a href="#how-it-works" className="block hover:text-white">How it works</a>
              <a href="#safe-trading" className="block hover:text-white">Safe trading</a>
            </div>
            <div className="space-y-3">
              <p className="font-bold text-white">Farm knowledge</p>
              <a href="/weather" className="block hover:text-white">Farm weather</a>
              <a href="/agriguide" className="block hover:text-white">AgriGuide</a>
              <a href="https://www.fao.org/ghana/en" target="_blank" rel="noopener noreferrer" className="block hover:text-white">FAO Ghana</a>
            </div>
          </div>
          <div className="border-t border-white/15 pt-5 text-xs text-white/60 md:col-span-2">
            © 2026 AgriVanta. Powering Every Link in Agriculture.
          </div>
        </div>
      </footer>
    </main>
  );
}
