import Link from "next/link";

const sections = [
  {
    title: "1. Acceptance of these terms",
    content: [
      "By creating an account or using AgriVanta, you agree to these Terms and Conditions and our Privacy Policy. If you do not agree, you should not create an account or use the platform.",
      "You must provide accurate information when registering and keep your account details up to date."
    ],
  },
  {
    title: "2. About AgriVanta",
    content: [
      "AgriVanta is an agricultural connection platform designed to bring farmers, buyers, suppliers, service providers, agricultural workers and agricultural experts together.",
      "The platform provides features such as agricultural listings, inquiries, user profiles, notifications, agricultural information and AI-assisted tools.",
      "AgriVanta provides a platform for discovery and communication. Unless expressly stated otherwise, it does not act as the buyer, seller, agent or representative of users conducting transactions."
    ],
  },
  {
    title: "3. Eligibility and accounts",
    content: [
      "You must be legally capable of entering into an agreement under applicable law to use AgriVanta. If you are under the age of 18, you should not register without the involvement and consent of a parent or legal guardian.",
      "You are responsible for keeping your login credentials secure and for activities carried out through your account.",
      "You must not impersonate another person, create accounts using misleading information or use another person's account without permission.",
      "We may restrict or suspend accounts where there is reasonable evidence of misuse, fraud, unlawful activity or a breach of these terms."
    ],
  },
  {
    title: "4. Listings and user content",
    content: [
      "Users are responsible for the accuracy, legality and completeness of the listings, photographs, videos, descriptions, prices, locations and other content they submit.",
      "You must have the necessary rights and permissions to upload or share content on AgriVanta.",
      "You must not publish false, misleading, fraudulent, abusive, unlawful, discriminatory or infringing content.",
      "You retain responsibility for content you submit. By submitting content, you give AgriVanta permission to host, store, process and display that content as reasonably necessary to operate, maintain and improve the platform.",
      "We may remove, restrict or review content that appears to violate these terms or applicable law."
    ],
  },
  {
    title: "5. Buyers, sellers and transactions",
    content: [
      "AgriVanta helps users discover listings and communicate with one another. Users are responsible for independently assessing the people, products, services and offers they interact with.",
      "Before making a payment, sharing sensitive information or entering into an agreement, users should verify the identity of the other party and confirm all relevant details.",
      "AgriVanta does not guarantee the quality, safety, availability, ownership, legality or accuracy of products or services listed by users.",
      "Unless a specific feature expressly states otherwise, AgriVanta does not hold payments in escrow, guarantee transactions or provide automatic refunds.",
      "Any agreement, payment, delivery or transaction between users is their responsibility."
    ],
  },
  {
    title: "6. Communication and contact information",
    content: [
      "Users may communicate through inquiries and other available platform features.",
      "Your email address or other contact information may be shared with another user where necessary for an inquiry or where your account visibility settings permit it.",
      "You are responsible for the information you choose to share publicly, including your phone number and WhatsApp contact preferences.",
      "You must not use contact information obtained through AgriVanta for spam, harassment, fraud or unsolicited marketing."
    ],
  },
  {
    title: "7. AgriGuide and AI-assisted features",
    content: [
      "AgriVanta may provide AI-assisted services, including AgriGuide and Assist, to help users access agricultural information and general platform guidance.",
      "AI-generated responses may be incomplete, inaccurate or unsuitable for a particular situation. They are provided for informational and educational purposes and are not a substitute for advice from a qualified agricultural extension officer, veterinarian, plant health specialist or other appropriate professional.",
      "Do not rely solely on AI-generated information when making decisions that could affect health, safety, crops, livestock or significant financial interests.",
      "You should independently verify important recommendations, particularly those involving pesticides, fertilisers, animal health or other regulated products."
    ],
  },
  {
    title: "8. Notifications and communications",
    content: [
      "AgriVanta may send service-related communications by email, platform notification or, where enabled and separately consented to, SMS.",
      "You are responsible for keeping your contact details accurate and managing the notification preferences available in your account.",
      "SMS delivery depends on service availability, network providers and the configuration of our messaging service. We cannot guarantee delivery of every message."
    ],
  },
  {
    title: "9. Prohibited activities",
    content: [
      "You must not use AgriVanta to commit fraud, distribute malware, interfere with platform security, access another user's account without permission, upload unlawful material, harass other users or disrupt platform operations.",
      "You must not scrape, copy, resell or misuse platform content or services in a way that violates applicable law or the rights of others.",
      "You must not use AgriVanta to advertise or facilitate unlawful goods, services or activities."
    ],
  },
  {
    title: "10. Platform availability and changes",
    content: [
      "We aim to keep AgriVanta available and functional, but we do not guarantee uninterrupted access or that every feature will always be available.",
      "We may update, improve, suspend or discontinue features where reasonably necessary for maintenance, security, legal compliance or platform development."
    ],
  },
  {
    title: "11. Suspension and account closure",
    content: [
      "You may stop using AgriVanta at any time. Where account deletion or closure is available, you may use the applicable account controls or contact the platform support team.",
      "We may restrict or suspend access where necessary to protect users, investigate suspected misuse, enforce these terms or comply with applicable law.",
      "Closing an account does not automatically mean that every record associated with it is immediately erased. Some information may need to be retained for legitimate operational, security or legal purposes, as explained in our Privacy Policy."
    ],
  },
  {
    title: "12. Liability",
    content: [
      "To the extent permitted by applicable law, AgriVanta is not responsible for disputes, losses or damages arising from transactions, communications, products, services or conduct between users.",
      "We do not guarantee that user-submitted information, listings or AI-generated responses are accurate, complete or reliable.",
      "Nothing in these terms excludes or limits liability where doing so would be unlawful under applicable law."
    ],
  },
  {
    title: "13. Privacy",
    content: [
      "Your use of AgriVanta is also governed by our Privacy Policy, which explains how personal information is collected, used, stored and shared.",
      "You can read the Privacy Policy at any time."
    ],
  },
  {
    title: "14. Changes to these terms",
    content: [
      "We may update these Terms and Conditions as AgriVanta develops or where legal, operational or security requirements change.",
      "Where an update materially affects users, we will take reasonable steps to communicate the change. Continued use after an updated version takes effect will be subject to the revised terms, where permitted by law."
    ],
  },
  {
    title: "15. Governing law",
    content: [
      "These terms are intended to operate in accordance with the laws of Ghana and other applicable laws. Any dispute will be handled in accordance with the applicable legal requirements."
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F8F6EE] px-4 py-12 text-[#193D2A] sm:py-16">
      <article className="mx-auto max-w-4xl rounded-2xl border border-[#E7E4D9] bg-white p-6 shadow-sm sm:p-10">
        <Link href="/" className="text-sm font-semibold text-[#52745A] hover:underline">
          ← B← Back to AgriVanta
        </Link>

        <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-[#A87925]">
          AgriVanta · Agriculture Connected
        </p>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
          Terms and Conditions
        </h1>
        <p className="mt-3 text-sm text-[#718071]">
          Effective date: 14 November 2026 · Version 1.0
        </p>

        <p className="mt-8 leading-7 text-[#526354]">
          Welcome to AgriVanta. These Terms and Conditions explain the rules
          that apply when you access or use our agricultural connection
          platform. Please read them carefully before creating an account.
        </p>

        <nav className="mt-8 rounded-xl bg-[#F8F6EE] p-5">
          <h2 className="font-bold">Related document</h2>
          <Link href="/privacy" className="mt-2 inline-block text-sm font-semibold text-[#17472D] underline">
            Read our Privacy Policy
          </Link>
        </nav>

        <div className="mt-10 space-y-9">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-bold">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-[#526354]">
                {section.content.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 border-t border-[#E7E4D9] pt-6 text-sm text-[#718071]">
          <p>
            These terms are an initial platform-use draft and should be
            reviewed by a qualified Ghanaian legal professional before
            AgriVanta is launched publicly.
          </p>
          <Link href="/privacy" className="mt-4 inline-block font-semibold text-[#17472D] hover:underline">
            View Privacy Policy
          </Link>
        </div>
      </article>
    </main>
  );
}



