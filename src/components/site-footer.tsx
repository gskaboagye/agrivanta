import Link from "next/link";
import { Sprout, HandHeart, Music2, Mail, ArrowUpRight } from "lucide-react";

const footerLinks = [
  { label: "Marketplace", href: "/products" },
  { label: "AgriGuide", href: "/agriguide" },
  { label: "News", href: "/news" },
  { label: "Reports", href: "/reports" },
  { label: "About Us", href: "/about" },
  { label: "Feedback", href: "/feedback" },
];

const plannedSocials = [
  { label: "Facebook", icon: Sprout },
  { label: "Instagram", icon: Music2 },
  { label: "LinkedIn", icon: HandHeart },
  { label: "YouTube", icon: ArrowUpRight },
  { label: "TikTok", icon: Music2 },
];

export default function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[#DCE7D9] bg-[#F5F8F2] text-[#294333]">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#17472D] text-white">
                <Sprout size={23} />
              </span>
              <span className="text-xl font-extrabold tracking-tight text-[#17472D]">
                AgriVanta
              </span>
            </Link>

            <p className="max-w-xs text-sm leading-6 text-[#647568]">
              Agriculture Connected. Bringing farmers, buyers, suppliers,
              workers and agricultural experts together across Ghana.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#17472D]">
              Explore
            </h3>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#647568] transition hover:text-[#17472D]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#17472D]">
              Get Involved
            </h3>

            <Link
              href="/support-us"
              className="inline-flex items-center gap-2 rounded-xl bg-[#17472D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#23613D]"
            >
              <HandHeart size={18} />
              Support AgriVanta
              <ArrowUpRight size={15} />
            </Link>

            <p className="mt-3 max-w-xs text-sm leading-6 text-[#647568]">
              Help us grow an agricultural community where opportunities and
              connections can thrive.
            </p>

            <Link
              href="/feedback"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#17472D] hover:underline"
            >
              Share your feedback
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#17472D]">
              Connect With Us
            </h3>

            <p className="mb-4 text-sm leading-6 text-[#647568]">
              Our social media communities are coming soon. Follow AgriVanta
              when our official pages launch.
            </p>

            <div className="flex flex-wrap gap-2">
              {plannedSocials.map((social) => {
                const Icon = social.icon;

                return (
                  <span
                    key={social.label}
                    title={`${social.label} — coming soon`}
                    aria-label={`${social.label} — coming soon`}
                    className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-lg border border-[#DCE7D9] bg-white text-[#849487]"
                  >
                    <Icon size={18} />
                  </span>
                );
              })}
            </div>

            <p className="mt-3 text-xs text-[#849487]">
              Official social links will be added here.
            </p>
          </div>
        </div>

        <div className="my-9 border-t border-[#DCE7D9]" />

        <div className="flex flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[#647568]">
            © {currentYear} AgriVanta. All rights reserved.
          </p>

          <p className="text-[#647568]">
            Designed &amp; Developed by{" "}
            <span className="font-semibold text-[#17472D]">
              Godfred Sefa Aboagye
            </span>
            <span className="hidden sm:inline"> · </span>
            <span className="block sm:inline">Software Engineer</span>
          </p>
        </div>
      </div>
    </footer>
  );
}


