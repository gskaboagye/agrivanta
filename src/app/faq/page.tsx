import type { Metadata } from "next";
import FAQClient from "./faq-client";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | AgriVanta",
  description:
    "Find answers about AgriVanta accounts, agricultural products, listings, communication and support.",
};

export default function FAQPage() {
  return <FAQClient />;
}
