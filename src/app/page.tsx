
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
  Languages,
  ShoppingBag,
  ClipboardCheck,
  CircleCheck,
  UserRound,
  Camera,
  Video,
  Wrench,
  CloudSun,
  CloudRain,
  Thermometer,
  Droplets,
  Wind,
  Newspaper,
  Handshake,
  AlertTriangle,
  Package,
  Leaf,
  Info,
  Users,
  GraduationCap,
} from "lucide-react";

const marketplaceTypes = [
  {
    title: "Products for sale",
    description: "Buy produce, livestock, seeds, fertilizers and farm supplies.",
    icon: ShoppingBag,
    href: "/products?type=product",
  },
  {
    title: "Equipment for hire",
    description: "Find tractors, irrigation pumps, sprayers and machinery.",
    icon: Tractor,
    href: "/products?type=hire",
  },
  {
    title: "Agricultural services",
    description: "Find land preparation, harvesting and other farm services.",
    icon: Wrench,
    href: "/products?type=service",
  },
  {
    title: "Hire farm labourers",
    description: "Find workers for planting, weeding, harvesting and farm tasks.",
    icon: Users,
    href: "/products?type=worker",
  },
  {
    title: "Hire agricultural experts",
    description: "Find agronomists and advisers for crop, soil and livestock support.",
    icon: GraduationCap,
    href: "/products?type=expert",
  },
  {
    title: "Farm tools and machinery",
    description: "Explore equipment and agricultural tools.",
    icon: Package,
    href: "/products?category=Farm%20Equipment",
  },
];

const categories = [
  { name: "Farm Produce", detail: "Grains, fruits and vegetables", icon: Wheat },
  { name: "Seeds & Seedlings", detail: "Start your next harvest", icon: Sprout },
  { name: "Fertilizers", detail: "Nutrients for healthier crops", icon: Trees },
  { name: "Crop Protection", detail: "Crop-care products", icon: FlaskConical },
  { name: "Livestock & Feed", detail: "Animals, feed and supplies", icon: Beef },
  { name: "Farm Equipment", detail: "Tools, machinery and parts", icon: Tractor },
];

const products = [
  {
    name: "Fresh Tomatoes",
    category: "Farm Produce",
    price: "GH₵ 180",
    unit: "per crate",
    location: "Techiman, Bono East",
    image:
      "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=700&q=75",
  },
  {
    name: "Yellow Maize",
    category: "Grains & Cereals",
    price: "GH₵ 350",
    unit: "per 50 kg bag",
    location: "Ejura, Ashanti",
    image:
      "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=700&q=75",
  },
  {
    name: "Fresh Green Peppers",
    category: "Farm Produce",
    price: "GH₵ 120",
    unit: "per crate",
    location: "Nsawam, Eastern",
    image:
      "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=700&q=75",
  },
  {
    name: "Farm Seedlings",
    category: "Seeds & Seedlings",
    price: "GH₵ 85",
    unit: "per tray",
    location: "Kumasi, Ashanti",
    image:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=700&q=75",
  },
];

const buyingSteps = [
  {
    title: "Find what you need",
    description: "Search by product, category, location or service.",
    icon: Search,
  },
  {
    title: "Review the listing",
    description: "Check the price, quantity, photos, availability and seller information.",
    icon: ClipboardCheck,
  },
  {
    title: "Agree on the details",
    description: "Confirm quality, delivery or collection, and payment terms.",
    icon: MessageCircle,
  },
  {
    title: "Inspect and keep records",
    description: "Check goods against the agreement and keep transaction records.",
    icon: Package,
  },
];

const sellingSteps = [
  {
    title: "Create your account",
    description: "Register with accurate personal or business information.",
    icon: UserRound,
  },
  {
    title: "Create a listing",
    description: "Add the offer type, price, location and availability.",
    icon: ClipboardCheck,
  },
  {
    title: "Show your offer",
    description: "Use clear photos and videos when upload features are available.",
    icon: Camera,
  },
  {
    title: "Respond to enquiries",
    description: "Confirm terms and keep evidence of delivery and payment.",
    icon: Handshake,
  },
];

const agriculturalSources = [
  {
    name: "Ministry of Food and Agriculture",
    description: "Government agricultural news, policies and programmes.",
    href: "https://mofa.gov.gh/site/media-centre/latest-news",
  },
  {
    name: "Ghana Meteorological Agency",
    description: "Weather forecasts and agricultural weather information.",
    href: "https://www.meteo.gov.gh/",
  },
  {
    name: "FAO Ghana",
    description: "Agriculture, food security and sustainable farming resources.",
    href: "https://www.fao.org/ghana/en",
  },
  {
    name: "CSIR Ghana",
    description: "Scientific research and agricultural knowledge.",
    href: "https://www.csir.org.gh/",
  },
];

const safetyPrinciples = [
  "Confirm product details, quantity, price and delivery arrangements in writing.",
  "Inspect goods on delivery when practical and document any differences.",
  "Do not rely on payment screenshots alone; verify payment with the provider.",
  "Keep transaction records and report suspected scams.",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F8F6EE] text-[#193D2A]">
      {/* Announcement */}
      <div className="bg-[#17472D] px-4 py-2 text-center text-xs font-medium tracking-wide text-white sm:text-sm">
        Connecting Ghana&apos;s agricultural value chain
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-30 border-b border-[#E7E4D9] bg-[#F8F6EE]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <a href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#17472D] text-[#D9A441]">
              <Sprout size={27} strokeWidth={1.8} />
            </span>
            <span>
              <span className="block text-xl font-extrabold tracking-tight sm:text-2xl">
                AgriVanta
              </span>
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-[#71806F] sm:block">
                Powering Every Link in Agriculture
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-5 text-sm font-medium xl:flex">
            <a href="#marketplace-types" className="hover:text-[#9B741F]">
              Buy & Hire
            </a>
            <a href="#products" className="hover:text-[#9B741F]">
              Listings
            </a>
            <a href="#categories" className="hover:text-[#9B741F]">
              Categories
            </a>
            <a href="#farm-intelligence" className="hover:text-[#9B741F]">
              Farm Intelligence
            </a>
            <a href="/agriguide" className="hover:text-[#9B741F]">
              AgriGuide AI
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="/login"
              className="hidden rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-[#EDEBDD] sm:inline-flex"
            >
              Sign in
            </a>
            <a
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-[#17472D] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#235B3A] sm:px-4"
            >
              Get started
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </header>

      {/* 1. Hero and search: the primary user task */}
      <section className="relative isolate overflow-hidden bg-[#17472D]">
        <div className="absolute inset-0 -z-10">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=80"
            alt=""
            className="h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#103720] via-[#17472D]/90 to-[#17472D]/50" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold tracking-wide text-[#E8CA78] sm:text-sm">
              <ShieldCheck size={16} />
              A connected agricultural marketplace
            </span>

            <h1 className="mt-7 text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Powering Every Link in{" "}
              <span className="text-[#E6BD57]">Agriculture.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
              Buy and sell farm produce, hire equipment and workers, find
              agricultural experts, and discover useful farming knowledge.
            </p>

            <form
              action="/products"
              className="mt-8 flex max-w-xl flex-col gap-2 rounded-xl bg-white p-2 shadow-xl sm:flex-row"
            >
              <label className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <Search size={21} className="shrink-0 text-[#64806C]" />
                <input
                  name="q"
                  type="search"
                  placeholder="Products, equipment or services..."
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[#193D2A] outline-none placeholder:text-gray-500"
                />
              </label>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#D9A441] px-6 py-3 font-bold text-[#173B27] hover:bg-[#E7B958]"
              >
                Search
                <ArrowRight size={17} />
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/75">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#E6BD57]" />
                Trade more carefully
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin size={16} className="text-[#E6BD57]" />
                Built for Ghana
              </span>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-4 rounded-[2rem] border border-white/15" />
            <img
              src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1000&q=80"
              alt="Cultivated agricultural fields"
              className="h-[410px] w-full rounded-[1.5rem] object-cover shadow-2xl"
            />
            <div className="absolute -bottom-5 -left-8 max-w-xs rounded-xl bg-white p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#EAF0E6] text-[#17472D]">
                  <Store size={23} />
                </span>
                <div>
                  <p className="font-bold">Your next opportunity starts here</p>
                  <p className="mt-1 text-xs text-gray-600">
                    Products, equipment, workers and services
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main actions: buy, hire or find expertise */}
      <section
        id="marketplace-types"
        className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"
      >
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9B741F]">
            Start here
          </p>
          <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
            What do you need for your farm?
          </h2>
          <p className="mt-3 text-sm leading-7 text-[#647367] sm:text-base">
            Choose an option to find products, equipment, workers or services
            across Ghana&apos;s agricultural value chain.
          </p>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {marketplaceTypes.map((item) => {
            const Icon = item.icon;

            return (
              <a
                key={item.title}
                href={item.href}
                className="group rounded-xl border border-[#E7E4D9] bg-white p-5 transition hover:-translate-y-1 hover:border-[#B5C6AF] hover:shadow-lg"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF0E6] text-[#17472D] group-hover:bg-[#17472D] group-hover:text-white">
                  <Icon size={24} />
                </span>
                <h3 className="mt-4 font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#718071]">
                  {item.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#17472D]">
                  Explore
                  <ArrowRight size={15} />
                </span>
              </a>
            );
          })}
        </div>
      </section>

      {/* 3. Featured listings: show users what they can find */}
      <section
        id="products"
        className="border-y border-[#E7E4D9] bg-white py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9B741F]">
                Discover products
              </p>
              <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
                Featured marketplace listings
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#647367] sm:text-base">
                Explore example listings across the agricultural value chain.
              </p>
            </div>
            <a
              href="/products"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#17472D] hover:text-[#9B741F]"
            >
              Browse all listings
              <ArrowRight size={17} />
            </a>
          </div>

          <div className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <article
                key={product.name}
                className="overflow-hidden rounded-xl border border-[#E7E4D9] bg-white transition hover:-translate-y-1 hover:shadow-lg"
              >
                <a href="/products" className="group block">
                  <div className="relative h-52 overflow-hidden bg-[#F0F0E8]">
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-[#17472D]">
                      {product.category}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold">{product.name}</h3>
                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="text-xl font-extrabold text-[#17472D]">
                        {product.price}
                      </span>
                      <span className="text-xs text-[#718071]">
                        {product.unit}
                      </span>
                    </div>
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-[#718071]">
                      <MapPin size={14} />
                      {product.location}
                    </p>
                  </div>
                </a>
              </article>
            ))}
          </div>

          <p className="mt-5 text-xs leading-5 text-[#718071]">
            These are demonstration listings. Prices, sellers and availability
            have not been verified. Replace these examples with real marketplace
            data before launch.
          </p>
        </div>
      </section>

      {/* 4. Categories: a second way to browse */}
      <section
        id="categories"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9B741F]">
              Browse by category
            </p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
              Everything agriculture, in one place.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#647367] sm:text-base">
              Browse products and supplies across the agricultural value chain.
            </p>
          </div>
          <a
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#17472D] hover:text-[#9B741F]"
          >
            Browse marketplace
            <ArrowRight size={17} />
          </a>
        </div>

        <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <a
                key={category.name}
                href={`/products?category=${encodeURIComponent(category.name)}`}
                className="group rounded-xl border border-[#E7E4D9] bg-white p-4 transition hover:-translate-y-1 hover:border-[#B5C6AF] hover:shadow-lg sm:p-5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF0E6] text-[#17472D] transition group-hover:bg-[#17472D] group-hover:text-white">
                  <Icon size={24} strokeWidth={1.8} />
                </span>
                <h3 className="mt-4 text-sm font-bold leading-5">
                  {category.name}
                </h3>
                <p className="mt-2 text-xs leading-5 text-[#718071]">
                  {category.detail}
                </p>
              </a>
            );
          })}
        </div>
      </section>

      {/* 5. Trust and safe trading */}
      <section
        id="safetrade"
        className="border-y border-[#E7E4D9] bg-white py-16 sm:py-20"
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#EAF0E6] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#17472D]">
              <ShieldCheck size={16} />
              Trust and safety
            </span>
            <h2 className="mt-5 text-3xl font-extrabold sm:text-4xl">
              Trade with greater confidence.
            </h2>
            <p className="mt-4 leading-7 text-[#647367]">
              Agricultural trade depends on trust. Take time to confirm details,
              document agreements and recognise common scam risks before making
              a transaction.
            </p>
            <p className="mt-3 text-sm leading-6 text-[#718071]">
              Automated payment protection, escrow, seller verification and
              dispute resolution should not be assumed unless those features
              are implemented and explicitly confirmed by the platform.
            </p>
          </div>

          <div className="rounded-2xl border border-[#E7E4D9] bg-[#F8F6EE] p-5 sm:p-7">
            <h3 className="text-lg font-extrabold">
              Before completing a transaction
            </h3>
            <div className="mt-5 space-y-4">
              {safetyPrinciples.map((principle) => (
                <div key={principle} className="flex items-start gap-3">
                  <CircleCheck
                    size={20}
                    className="mt-0.5 shrink-0 text-[#398153]"
                  />
                  <p className="text-sm leading-6 text-[#526755]">
                    {principle}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-[#E8DAB5] bg-[#FCF6E6] p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={20}
                  className="mt-0.5 shrink-0 text-[#8B681C]"
                />
                <p className="text-sm leading-6 text-[#6C5729]">
                  Never send money solely because someone pressures you to act
                  quickly. Confirm the seller, order details and payment
                  recipient through trusted channels.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Seller and service-provider opportunities */}
      <section
        id="sell"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
      >
        <div className="overflow-hidden rounded-2xl bg-[#EAF0E6]">
          <div className="grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_auto] lg:p-14">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9B741F]">
                For farmers and agricultural professionals
              </p>
              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                Take your agricultural business further.
              </h2>
              <p className="mt-4 leading-7 text-[#526755]">
                Showcase your products, equipment and services, or connect with
                people looking for agricultural labour and expertise.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <a
                href="/register?role=seller"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#17472D] px-6 py-3.5 font-bold text-white hover:bg-[#235B3A]"
              >
                Start selling
                <ArrowRight size={18} />
              </a>
              <a
                href="/products?type=worker"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#17472D]/20 bg-white px-6 py-3.5 text-sm font-bold text-[#17472D] hover:bg-[#F8F6EE]"
              >
                Find farm workers
              </a>
              <a
                href="/products?type=expert"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#17472D]/20 bg-white px-6 py-3.5 text-sm font-bold text-[#17472D] hover:bg-[#F8F6EE]"
              >
                Find agricultural experts
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9B741F]">
              Better listings
            </p>
            <h3 className="mt-2 text-2xl font-extrabold sm:text-3xl">
              Show buyers what you really offer.
            </h3>
            <p className="mt-4 leading-7 text-[#647367]">
              Detailed seller profiles, clear descriptions and useful media
              can help customers understand your products, equipment and work.
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex gap-3">
                <Camera size={22} className="shrink-0 text-[#17472D]" />
                <div>
                  <h4 className="font-bold">Multiple product photos</h4>
                  <p className="mt-1 text-sm leading-6 text-[#718071]">
                    Show product condition, packaging, different angles and
                    quantities clearly.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Video size={22} className="shrink-0 text-[#17472D]" />
                <div>
                  <h4 className="font-bold">Product and service videos</h4>
                  <p className="mt-1 text-sm leading-6 text-[#718071]">
                    Demonstrate equipment or showcase examples of completed work.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <UserRound size={22} className="shrink-0 text-[#17472D]" />
                <div>
                  <h4 className="font-bold">Detailed profiles</h4>
                  <p className="mt-1 text-sm leading-6 text-[#718071]">
                    Explain your experience, location, services and business
                    information.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-5 text-xs leading-5 text-[#718071]">
              Media uploads and advanced seller profiles require the appropriate
              upload service and backend functionality.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <img
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=700&q=75"
              alt="Agricultural farmland"
              loading="lazy"
              className="h-52 w-full rounded-xl object-cover sm:h-64"
            />
            <img
              src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=700&q=75"
              alt="Cultivated fields"
              loading="lazy"
              className="mt-7 h-52 w-full rounded-xl object-cover sm:h-64"
            />
            <div className="col-span-2 rounded-xl bg-[#F1F2E8] p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-[#17472D]">
                  <Store size={22} />
                </span>
                <div>
                  <p className="font-bold">Your agricultural business belongs here</p>
                  <p className="mt-1 text-xs leading-5 text-[#647367]">
                    Create a clear offer and help potential customers understand
                    what you provide.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Farm intelligence: useful, but secondary to the marketplace */}
      <section
        id="farm-intelligence"
        className="bg-[#F1F2E8] py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9B741F]">
              Technology for better farming
            </p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">
              Understand your farm. Make informed decisions.
            </h2>
            <p className="mt-4 leading-7 text-[#647367]">
              AgriVanta aims to combine local weather information, agricultural
              education and practical guidance for crop and livestock farmers.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <article className="rounded-2xl border border-[#E0E3D8] bg-white p-5 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF0E6] text-[#17472D]">
                  <CloudSun size={26} />
                </span>
                <div>
                  <h3 className="text-lg font-extrabold">Local Weather</h3>
                  <p className="mt-1 text-sm text-[#718071]">
                    Weather for your selected farm location
                  </p>
                </div>
              </div>

              <span className="mt-4 inline-flex rounded-full border border-[#E8DAB5] bg-[#FCF6E6] px-2.5 py-1 text-[10px] font-bold text-[#8B681C]">
                Coming soon
              </span>

              <p className="mt-4 text-sm leading-6 text-[#647367]">
                Weather information could help farmers plan field work, irrigation,
                planting and livestock care. Live forecast data is not available
                from this placeholder.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { label: "Temperature", value: "-- °C", icon: Thermometer },
                  { label: "Rain probability", value: "--", icon: CloudRain },
                  { label: "Humidity", value: "--", icon: Droplets },
                  { label: "Wind speed", value: "--", icon: Wind },
                ].map((metric) => {
                  const Icon = metric.icon;

                  return (
                    <div
                      key={metric.label}
                      className="rounded-xl border border-[#E7E4D9] bg-[#F8F6EE] p-3"
                    >
                      <Icon size={19} className="text-[#17472D]" />
                      <p className="mt-3 text-xs text-[#718071]">
                        {metric.label}
                      </p>
                      <p className="mt-1 text-lg font-extrabold">
                        {metric.value}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-xl bg-[#F1F2E8] p-4">
                <h4 className="flex items-center gap-2 font-bold">
                  <Leaf size={18} />
                  Planting and farm advice
                </h4>
                <p className="mt-2 text-sm leading-6 text-[#647367]">
                  Useful guidance should consider rainfall outlook, soil moisture,
                  crop type, growth stage and relevant livestock management needs.
                </p>
              </div>

              <a
                href="https://www.meteo.gov.gh/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#17472D] hover:text-[#9B741F]"
              >
                Visit Ghana Meteorological Agency
                <ArrowRight size={16} />
              </a>
            </article>

            <article className="rounded-2xl border border-[#E0E3D8] bg-white p-5 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF0E6] text-[#17472D]">
                  <Newspaper size={25} />
                </span>
                <div>
                  <h3 className="text-lg font-extrabold">Agricultural News</h3>
                  <p className="mt-1 text-sm text-[#718071]">
                    Follow reliable information sources
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-[#647367]">
                Explore official sources for agricultural announcements,
                research, weather information and farming initiatives. These
                links are not live news headlines.
              </p>

              <div className="mt-5 space-y-3">
                {agriculturalSources.map((source) => (
                  <a
                    key={source.name}
                    href={source.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-between gap-3 rounded-xl border border-[#E7E4D9] p-4 transition hover:bg-[#F8F6EE]"
                  >
                    <span>
                      <span className="block text-sm font-bold">
                        {source.name}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[#718071]">
                        {source.description}
                      </span>
                    </span>
                    <ArrowRight
                      size={17}
                      className="mt-0.5 shrink-0 text-[#17472D]"
                    />
                  </a>
                ))}
              </div>
            </article>
          </div>

          {/* AgriGuide AI */}
          <article
            id="agriguide"
            className="mt-5 overflow-hidden rounded-2xl bg-[#17472D] text-white"
          >
            <div className="grid items-center gap-7 p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:p-10">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-[#E6BD57]">
                    <MessageCircle size={25} />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#E6BD57]">
                    Your agricultural learning assistant
                  </span>
                </div>

                <h3 className="mt-5 text-2xl font-extrabold sm:text-3xl">
                  Meet AgriGuide AI.
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                  Learn about crop production, soil health, livestock care and
                  farm business. English and Twi support, backed by trustworthy
                  agricultural resources, is a planned capability.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {["Crop production", "Soil health", "Livestock", "Farm business"].map(
                    (topic) => (
                      <span
                        key={topic}
                        className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white/85"
                      >
                        {topic}
                      </span>
                    ),
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:min-w-52">
                <div className="flex items-center gap-2 text-sm text-white/75">
                  <Languages size={19} className="text-[#E6BD57]" />
                  English and Twi planned
                </div>
                <a
                  href="/agriguide"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#D9A441] px-6 py-3.5 text-sm font-bold text-[#173B27] hover:bg-[#E7B958]"
                >
                  Explore AgriGuide
                  <ArrowRight size={17} />
                </a>
                <p className="text-xs leading-5 text-white/60">
                  Live AI and source retrieval must be connected separately.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* 8. How it works: useful guidance after the primary actions */}
      <section
        id="how-it-works"
        className="border-y border-[#E7E4D9] bg-white py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9B741F]">
              Your AgriVanta user guide
            </p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">
              Getting started is simple.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#647367] sm:text-base">
              Understand the steps for buying, selling and connecting with
              agricultural service providers.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-[#E7E4D9] p-5 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF0E6] text-[#17472D]">
                  <ShoppingBag size={25} />
                </span>
                <div>
                  <h3 className="text-xl font-extrabold">How to Buy</h3>
                  <p className="mt-1 text-sm text-[#718071]">
                    For customers and agricultural businesses
                  </p>
                </div>
              </div>

              <div className="mt-7 space-y-6">
                {buyingSteps.map((step, index) => {
                  const Icon = step.icon;

                  return (
                    <div key={step.title} className="flex gap-4">
                      <div className="flex shrink-0 flex-col items-center">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF0E6] text-[#17472D]">
                          <Icon size={20} />
                        </span>
                        {index < buyingSteps.length - 1 && (
                          <span className="mt-2 h-6 w-px bg-[#D9E2D4]" />
                        )}
                      </div>
                      <div className="pb-1">
                        <h4 className="font-bold">
                          {index + 1}. {step.title}
                        </h4>
                        <p className="mt-1 text-sm leading-6 text-[#647367]">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <a
                href="/products"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#17472D] px-5 py-3 text-sm font-bold text-white hover:bg-[#235B3A]"
              >
                Explore marketplace
                <ArrowRight size={16} />
              </a>
            </article>

            <article className="rounded-2xl border border-[#E7E4D9] p-5 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FCF2D9] text-[#8B681C]">
                  <Store size={25} />
                </span>
                <div>
                  <h3 className="text-xl font-extrabold">How to Sell</h3>
                  <p className="mt-1 text-sm text-[#718071]">
                    For farmers, traders and service providers
                  </p>
                </div>
              </div>

              <div className="mt-7 space-y-6">
                {sellingSteps.map((step, index) => {
                  const Icon = step.icon;

                  return (
                    <div key={step.title} className="flex gap-4">
                      <div className="flex shrink-0 flex-col items-center">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FCF2D9] text-[#8B681C]">
                          <Icon size={20} />
                        </span>
                        {index < sellingSteps.length - 1 && (
                          <span className="mt-2 h-6 w-px bg-[#E8DFC5]" />
                        )}
                      </div>
                      <div className="pb-1">
                        <h4 className="font-bold">
                          {index + 1}. {step.title}
                        </h4>
                        <p className="mt-1 text-sm leading-6 text-[#647367]">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <a
                href="/register?role=seller"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#17472D] px-5 py-3 text-sm font-bold text-white hover:bg-[#235B3A]"
              >
                Start selling
                <ArrowRight size={16} />
              </a>
            </article>
          </div>

          <div className="mt-6 rounded-xl bg-[#F1F2E8] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <Info size={21} className="mt-0.5 shrink-0 text-[#17472D]" />
              <div>
                <h3 className="font-bold">Using AgriVanta safely</h3>
                <p className="mt-2 text-sm leading-6 text-[#647367]">
                  Agree on transaction details before proceeding. Payment,
                  checkout, delivery and dispute-handling options depend on
                  available platform features and the agreement between parties.
                  Do not assume a seller has been verified unless the platform
                  explicitly confirms it.
                </p>
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
            <p className="mt-2 max-w-sm text-sm leading-6 text-white/70">
              Powering Every Link in Agriculture. Connecting trade, knowledge
              and technology to help agriculture grow.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm text-white/75 sm:grid-cols-3">
            <div className="space-y-3">
              <p className="font-bold text-white">Marketplace</p>
              <a href="#categories" className="block hover:text-white">
                Categories
              </a>
              <a href="/products" className="block hover:text-white">
                Products
              </a>
              <a href="#marketplace-types" className="block hover:text-white">
                Equipment and services
              </a>
              <a href="/products?type=worker" className="block hover:text-white">
                Farm labourers
              </a>
              <a href="/products?type=expert" className="block hover:text-white">
                Agricultural experts
              </a>
            </div>

            <div className="space-y-3">
              <p className="font-bold text-white">Help and safety</p>
              <a href="#how-it-works" className="block hover:text-white">
                How to buy and sell
              </a>
              <a href="#safetrade" className="block hover:text-white">
                Safe trading guidance
              </a>
              <a href="/register" className="block hover:text-white">
                Create an account
              </a>
            </div>

            <div className="space-y-3">
              <p className="font-bold text-white">Farm knowledge</p>
              <a href="#farm-intelligence" className="block hover:text-white">
                Farm Intelligence
              </a>
              <a href="/agriguide" className="block hover:text-white">
                AgriGuide AI
              </a>
              <a href="#farm-intelligence" className="block hover:text-white">
                Agricultural news
              </a>
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
