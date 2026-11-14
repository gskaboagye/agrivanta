import Link from "next/link";

const sections = [
  {
    title: "1. Introduction",
    content: [
      "AgriVanta | Agriculture Connected respects your privacy. This Privacy Policy explains how we collect, use, store and share personal information when you use our platform.",
      "By registering for or using AgriVanta, you acknowledge that your information will be handled as described in this policy. Please also read our Terms and Conditions."
    ],
  },
  {
    title: "2. Information we collect",
    content: [
      "Account information: When you register, we may collect your name, email address, phone number, account role and authentication information.",
      "Profile information: We may collect information you add to your profile, including your agricultural role, contact preferences, phone visibility, WhatsApp preferences and other profile details.",
      "Marketplace information: When you create a listing, we may collect its title, category, description, price, location, availability, photographs, videos and other information you provide.",
      "Communications: We may collect inquiries, messages, feedback, reports, support requests and other communications sent through AgriVanta.",
      "AI interactions: When you use AgriGuide or other AI-assisted features, we may process your questions, conversation history and any images you submit.",
      "Technical information: We may process information needed to authenticate users, maintain sessions, protect platform security and troubleshoot technical problems."
    ],
  },
  {
    title: "3. How we use your information",
    content: [
      "We use information to create and manage accounts, authenticate users and provide access to platform features.",
      "We use listing and profile information to display relevant agricultural products, services, suppliers, workers and other marketplace content.",
      "We process inquiries and messages to help users communicate and respond to requests.",
      "We use information to provide notifications, improve platform functionality, investigate reports, prevent misuse and maintain security.",
      "We may use relevant information to provide AI-assisted agricultural information and respond to questions submitted through AgriGuide.",
      "We may also process information where necessary to comply with applicable legal obligations."
    ],
  },
  {
    title: "4. Information visibility and sharing between users",
    content: [
      "Some information you provide is displayed to other AgriVanta users so they can discover listings and communicate with you.",
      "Your name, account role, listing information and other profile details may be visible as part of your use of the platform.",
      "Your email address may be shared with another user where necessary for an inquiry or communication through the platform.",
      "Your phone number may be displayed according to your phone visibility settings. WhatsApp contact preferences may also affect how other users can contact you.",
      "You can manage available contact visibility and notification preferences through your account settings. Information that has already been viewed, copied or saved by another user may not be recoverable."
    ],
  },
  {
    title: "5. AI-assisted features and AgriGuide",
    content: [
      "AgriVanta provides AI-assisted features, including AgriGuide, to help users access agricultural information and general guidance.",
      "When you use AgriGuide, your questions and relevant conversation information may be sent to OpenAI for processing and generation of responses.",
      "If you submit an image for analysis, the image and accompanying question may also be processed by the AI service.",
      "AgriGuide conversations and related information may be stored by AgriVanta to provide conversation history and operate the service.",
      "AI-generated responses may be incomplete or inaccurate. Do not treat them as a substitute for advice from a qualified agricultural extension officer, veterinarian or other appropriate professional.",
      "Avoid submitting passwords, financial account details or other sensitive personal information in AI conversations."
    ],
  },
  {
    title: "6. Third-party service providers",
    content: [
      "AgriVanta uses external service providers to support its operations. These providers may process information on our behalf when providing their services.",
      "MongoDB is used to store platform information, including account, listing, inquiry, conversation and notification records. Related uploaded AgriGuide images may be stored using MongoDB GridFS.",
      "Cloudinary is used to host and manage marketplace images and videos uploaded by users.",
      "OpenAI processes questions and relevant images submitted through AgriGuide to generate AI-assisted responses.",
      "Resend is integrated for certain email communications.",
      "Arkesel is integrated for SMS messaging. SMS sending is subject to service configuration, availability and the user's applicable consent and preferences.",
      "These providers operate under their own terms and privacy practices. Information may be processed using infrastructure located outside Ghana."
    ],
  },
  {
    title: "7. Email, platform and SMS notifications",
    content: [
      "We may use your email address to communicate about account activity, inquiries, reports, security and other platform-related matters.",
      "AgriVanta may also display notifications within your account.",
      "SMS notifications may be offered for selected service updates where the messaging service is enabled and you have provided the required consent.",
      "Where SMS consent is required, you must have a verified phone number and enable the relevant preference. You can manage available notification preferences through your account.",
      "Message delivery may depend on telecommunications networks and third-party service availability. We cannot guarantee that every message will be delivered."
    ],
  },
  {
    title: "8. Data storage and retention",
    content: [
      "AgriVanta stores information using its database and supporting third-party services to operate the platform.",
      "We retain information for as long as reasonably necessary for the purposes described in this policy, including providing services, maintaining records, protecting platform security, resolving disputes and meeting legal obligations.",
      "Closing an account does not necessarily result in the immediate deletion of every associated record or copy held by a service provider.",
      "Retention periods may vary depending on the type of information, the purpose for which it was collected and applicable legal requirements."
    ],
  },
  {
    title: "9. Data security",
    content: [
      "We take reasonable technical and organisational measures intended to protect information against unauthorised access, loss, misuse, alteration or disclosure.",
      "No online platform or method of electronic storage can be guaranteed to be completely secure.",
      "You are responsible for keeping your password confidential, using a secure device and notifying us if you suspect unauthorised access to your account."
    ],
  },
  {
    title: "10. Your choices and privacy rights",
    content: [
      "You can review and update available profile information and contact visibility preferences through your account.",
      "Where available, you can manage SMS notification preferences and other communication settings.",
      "Subject to applicable law, you may request access to personal information, correction of inaccurate information, deletion where appropriate or other available privacy rights.",
      "Some information may need to be retained where required by law or for legitimate security, operational or dispute-resolution purposes.",
      "To make a privacy-related request, contact the AgriVanta platform support team through the available support channel."
    ],
  },
  {
    title: "11. Cookies and session technologies",
    content: [
      "AgriVanta may use cookies or similar technologies where necessary to support authentication, maintain user sessions, protect accounts and provide essential platform functionality.",
      "Disabling essential browser storage or session technologies may affect your ability to log in or use certain features."
    ],
  },
  {
    title: "12. Children's privacy",
    content: [
      "AgriVanta is intended for people who are legally able to use the platform under applicable law.",
      "If you are under 18, you should not register without the involvement and consent of a parent or legal guardian.",
      "If we become aware that personal information has been submitted in circumstances that violate applicable requirements, we may take appropriate steps."
    ],
  },
  {
    title: "13. Changes to this Privacy Policy",
    content: [
      "We may update this policy when our services, technology, legal obligations or data practices change.",
      "Where a change materially affects users, we will take reasonable steps to communicate the update.",
      "The effective date and version displayed at the top of this page indicate the current published version."
    ],
  },
  {
    title: "14. Contact and applicable law",
    content: [
      "For questions or requests concerning this Privacy Policy or your personal information, contact the AgriVanta platform support team through the support channels made available on the platform.",
      "This policy is intended to operate in accordance with the laws of Ghana, including applicable data protection requirements, and other applicable laws."
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F8F6EE] px-4 py-12 text-[#193D2A] sm:py-16">
      <article className="mx-auto max-w-4xl rounded-2xl border border-[#E7E4D9] bg-white p-6 shadow-sm sm:p-10">
        <Link href="/" className="text-sm font-semibold text-[#52745A] hover:underline">
          ← Back to AgriVanta
        </Link>

        <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-[#A87925]">
          AgriVanta · Agriculture Connected
        </p>

        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
          Privacy Policy
        </h1>

        <p className="mt-3 text-sm text-[#718071]">
          Effective date: 14 November 2026 · Version 1.0
        </p>

        <p className="mt-8 leading-7 text-[#526354]">
          Your privacy matters to us. This policy explains what information
          AgriVanta collects, why we use it, how it may be shared and the
          choices available to you when using our platform.
        </p>

        <nav className="mt-8 rounded-xl bg-[#F8F6EE] p-5">
          <h2 className="font-bold">Related document</h2>
          <Link href="/terms" className="mt-2 inline-block text-sm font-semibold text-[#17472D] underline">
            Read our Terms and Conditions
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
            This is an initial privacy policy draft based on the current
            platform implementation. It should be reviewed by a qualified
            Ghanaian data protection and legal professional before public
            launch.
          </p>
          <Link href="/terms" className="mt-4 inline-block font-semibold text-[#17472D] hover:underline">
            View Terms and Conditions
          </Link>
        </div>
      </article>
    </main>
  );
}
