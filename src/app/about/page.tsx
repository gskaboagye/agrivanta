import {
  ArrowRight,
  Sprout,
  Target,
  Eye,
  Users,
  ShoppingBag,
  Tractor,
  GraduationCap,
  BookOpen,
  Handshake,
  ShieldCheck,
  Lightbulb,
  Network,
  Newspaper,
  Wrench,
  Leaf,
  CheckCircle2,
} from "lucide-react";

const audiences = [
  {
    icon: Sprout,
    title: "Farmers",
    description:
      "Discover agricultural inputs, access useful resources, and connect with people and services that support farming activities.",
  },
  {
    icon: ShoppingBag,
    title: "Buyers",
    description:
      "Explore agricultural produce, livestock, seeds, fertilizers and other supplies from marketplace listings.",
  },
  {
    icon: Tractor,
    title: "Suppliers and service providers",
    description:
      "Present agricultural products, equipment and services to people looking for solutions for their farming needs.",
  },
  {
    icon: Users,
    title: "Farm workers",
    description:
      "Connect with opportunities to provide agricultural labour for planting, weeding, harvesting and other farm activities.",
  },
  {
    icon: GraduationCap,
    title: "Agricultural experts",
    description:
      "Make professional agricultural knowledge and advisory services easier to discover.",
  },
];

const platformFeatures = [
  {
    icon: ShoppingBag,
    title: "Agricultural marketplace",
    description:
      "Explore farm produce, livestock, seeds, fertilizers, crop protection products and other agricultural supplies.",
  },
  {
    icon: Tractor,
    title: "Equipment and farm services",
    description:
      "Discover equipment for hire, machinery, farm labour and services that support agricultural operations.",
  },
  {
    icon: BookOpen,
    title: "AgriGuide",
    description:
      "Explore practical agricultural learning topics covering crop production, soil health, livestock care and farm business.",
  },
  {
    icon: Newspaper,
    title: "Agricultural news",
    description:
      "Stay informed through agricultural news and updates relevant to the farming community.",
  },
];

const values = [
  {
    icon: Network,
    title: "Connection",
    description:
      "We believe better connections between agricultural participants can create more opportunities across the value chain.",
  },
  {
    icon: Lightbulb,
    title: "Knowledge",
    description:
      "Access to useful agricultural information can help people make more informed decisions.",
  },
  {
    icon: Handshake,
    title: "Accessibility",
    description:
      "We aim to make agricultural products, services and resources easier to discover in one connected platform.",
  },
  {
    icon: ShieldCheck,
    title: "Responsibility",
    description:
      "We encourage careful decisions, transparent communication and responsible marketplace interactions.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#F8F6EE] text-[#193D2A]">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[#17472D]">
        <div className="absolute inset-0 -z-10">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=85"
            alt=""
            className="h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#103720] via-[#17472D]/90 to-[#17472D]/65" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#E6BD57]">
              <Leaf size={15} />
              About AgriVanta
            </span>

            <h1 className="mt-7 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Agriculture works better when we{" "}
              <span className="text-[#E6BD57]">connect.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/80 sm:text-lg">
              AgriVanta is a Ghana-focused agricultural platform bringing
              farmers, buyers, suppliers, workers and agricultural experts
              closer together through trade, knowledge and technology.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-[#D9A441] px-6 py-3.5 text-sm font-bold text-[#173B27] transition hover:bg-[#E7B958]"
              >
                Join AgriVanta <ArrowRight size={17} />
              </a>
              <a
                href="/products"
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Explore marketplace
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9B741F]">
              Our story
            </p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
              Bringing the agricultural community closer together.
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-[#647367] sm:text-base">
              <p>
                Agriculture involves more than growing crops and raising
                livestock. It brings together farmers, buyers, suppliers,
                equipment providers, farm workers, service providers and
                agricultural professionals.
              </p>
              <p>
                Yet finding the right products, services, people and
                information can take time. AgriVanta is designed to make
                these connections easier by bringing different parts of the
                agricultural value chain into one digital platform.
              </p>
              <p>
                Our focus is to connect agricultural opportunities with the
                people who need them, while making useful knowledge and
                resources easier to discover.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl">
              <img
                src="https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?auto=format&fit=crop&w=1100&q=85"
                alt="Green agricultural landscape"
                className="h-[340px] w-full object-cover sm:h-[430px]"
              />
            </div>
            <div className="absolute -bottom-5 left-4 right-4 rounded-2xl border border-[#E7E4D9] bg-white p-5 shadow-lg sm:left-8 sm:right-8 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-[#9B741F]">
                Our guiding idea
              </p>
              <p className="mt-2 text-lg font-extrabold text-[#17472D] sm:text-xl">
                Powering Every Link in Agriculture.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission and Vision */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9B741F]">
              Our direction
            </p>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              What drives AgriVanta
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-[#E7E4D9] bg-[#F8F6EE] p-7 sm:p-9">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#17472D] text-white">
                <Target size={27} />
              </span>
              <h3 className="mt-6 text-2xl font-extrabold">Our Mission</h3>
              <p className="mt-4 text-sm leading-7 text-[#647367] sm:text-base">
                To connect Ghana&apos;s agricultural community through an
                accessible digital platform that supports agricultural
                trade, improves the discovery of services and resources,
                and makes practical agricultural knowledge easier to access.
              </p>
            </article>

            <article className="rounded-2xl border border-[#E7E4D9] bg-[#F8F6EE] p-7 sm:p-9">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FCF2D9] text-[#8B681C]">
                <Eye size={27} />
              </span>
              <h3 className="mt-6 text-2xl font-extrabold">Our Vision</h3>
              <p className="mt-4 text-sm leading-7 text-[#647367] sm:text-base">
                To contribute to a more connected and accessible agricultural
                ecosystem where people, products, services and knowledge can
                come together to support agricultural development.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Who we serve */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9B741F]">
              Our community
            </p>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Built for the people behind agriculture.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#647367] sm:text-base">
              Agriculture works through collaboration. AgriVanta brings
              different participants together so they can discover relevant
              opportunities, products, services and knowledge.
            </p>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {audiences.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-2xl border border-[#E7E4D9] bg-white p-6 transition hover:-translate-y-1 hover:shadow-md"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF0E6] text-[#17472D]">
                    <Icon size={24} strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-5 text-lg font-extrabold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#718071]">
                    {item.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* What we offer */}
      <section className="bg-[#F1F2E8] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9B741F]">
              One connected platform
            </p>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              More than a marketplace.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#647367] sm:text-base">
              AgriVanta brings together agricultural trade, services and
              information to support different needs across the value chain.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {platformFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="flex gap-4 rounded-2xl border border-[#E0E3D8] bg-white p-6 sm:p-7"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EAF0E6] text-[#17472D]">
                    <Icon size={24} strokeWidth={1.8} />
                  </span>
                  <div>
                    <h3 className="text-lg font-extrabold">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#718071]">
                      {feature.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9B741F]">
              What matters to us
            </p>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              The values behind our work.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <article key={value.title} className="text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF0E6] text-[#17472D]">
                    <Icon size={26} strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-5 font-extrabold">{value.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#718071]">
                    {value.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Responsible use */}
      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 rounded-2xl border border-[#E7E4D9] bg-white p-6 sm:flex-row sm:items-center sm:p-8">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FCF2D9] text-[#8B681C]">
              <CheckCircle2 size={28} />
            </span>
            <div>
              <h2 className="text-xl font-extrabold">
                Encouraging informed agricultural decisions
              </h2>
              <p className="mt-2 text-sm leading-7 text-[#647367]">
                We encourage users to verify product details, confirm
                arrangements directly, keep transaction records and consult
                trusted agricultural guidance when making important decisions.
                Discovering an offer on AgriVanta should be the beginning of
                an informed conversation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-[#17472D]">
          <div className="relative isolate px-6 py-12 sm:px-10 sm:py-16 lg:px-16">
            <div className="absolute -right-20 -top-28 -z-10 h-80 w-80 rounded-full border-[45px] border-white/5" />
            <div className="absolute -bottom-40 right-1/3 -z-10 h-80 w-80 rounded-full border-[45px] border-white/5" />

            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E6BD57]">
                Be part of the connection
              </p>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                Let&apos;s build a more connected agricultural community.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/75 sm:text-base">
                Whether you farm, buy, supply, provide services or share
                agricultural knowledge, there is a place for you on AgriVanta.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#D9A441] px-6 py-3.5 text-sm font-bold text-[#173B27] transition hover:bg-[#E7B958]"
                >
                  Get started <ArrowRight size={17} />
                </a>
                <a
                  href="/products"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Explore AgriVanta
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#103720] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:px-8">
          <div>
            <a href="/" className="text-xl font-extrabold tracking-tight">
              AgriVanta
            </a>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/70">
              Powering Every Link in Agriculture. Connecting trade, knowledge
              and technology to help agriculture grow.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm text-white/75 sm:grid-cols-3">
            <div className="space-y-3">
              <p className="font-bold text-white">Marketplace</p>
              <a href="/products" className="block hover:text-white">
                Browse products
              </a>
              <a href="/products?type=hire" className="block hover:text-white">
                Equipment hire
              </a>
              <a href="/products?type=worker" className="block hover:text-white">
                Farm labourers
              </a>
              <a href="/products?type=expert" className="block hover:text-white">
                Agricultural experts
              </a>
            </div>

            <div className="space-y-3">
              <p className="font-bold text-white">Your account</p>
              <a href="/login" className="block hover:text-white">Sign in</a>
              <a href="/register" className="block hover:text-white">Create an account</a>
              <a href="/feedback" className="block hover:text-white">Feedback</a>
            </div>

            <div className="space-y-3">
              <p className="font-bold text-white">Farm knowledge</p>
              <a href="/agriguide" className="block hover:text-white">AgriGuide</a>
              <a href="/news" className="block hover:text-white">Agricultural news</a>
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