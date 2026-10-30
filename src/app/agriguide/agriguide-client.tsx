"use client";

import { FormEvent, useRef, useState } from "react";
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
  LoaderCircle,
  RotateCcw,
} from "lucide-react";

type Language =
  | "en"
  | "tw"
  | "ee"
  | "gaa"
  | "dag"
  | "ada"
  | "fat"
  | "nzi"
  | "dagaa"
  | "hau";

const languageOptions: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "tw", label: "Twi (Akan)" },
  { value: "ee", label: "Ewe" },
  { value: "gaa", label: "Ga" },
  { value: "dag", label: "Dagbani" },
  { value: "ada", label: "Dangme (Adangme)" },
  { value: "fat", label: "Fante" },
  { value: "nzi", label: "Nzema" },
  { value: "dagaa", label: "Dagaare" },
  { value: "hau", label: "Hausa" },
];
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const translations: Record<Language, {
  label: string; title: string; description: string; welcome: string;
  welcomeDescription: string; placeholder: string; send: string; language: string;
  languagePrompt: string; sources: string; sourceDescription: string; note: string;
  suggestions: string[]; thinking: string; newChat: string; back: string;
  assistant: string; error: string; languageHelp: string; footer: string;
}> = {
  en: {
    label: "AGRICULTURAL LEARNING ASSISTANT", title: "Grow your knowledge.",
    description: "Learn better farming practices, explore agricultural information, and build your farming knowledge.",
    welcome: "What would you like to learn today?",
    welcomeDescription: "Ask about crop production, soil health, livestock, pests, or agricultural business.",
    placeholder: "Ask a question about farming...", send: "Send question", language: "Answer language",
    languagePrompt: "Choose the language AgriGuide should use", sources: "Trusted agricultural resources",
    sourceDescription: "Explore these agricultural organizations for additional information and guidance.",
    note: "Educational guidance does not replace advice from a qualified agricultural extension officer.",
    suggestions: ["How do I prepare soil for planting maize?", "How can I improve tomato production?", "What are good poultry management practices?", "How can I prevent post-harvest losses?"],
    thinking: "AgriGuide is preparing your answer...", newChat: "Start a new conversation", back: "Back to AgriVanta",
    assistant: "AgriGuide AI", error: "Something went wrong. Please try again.",
    languageHelp: "The selected language will be sent with your question. Interface text is translated where translations are available.",
    footer: "AgriVanta — Powering Every Link in Agriculture.",
  },
  tw: {
    label: "KUAYƐ HO ADESUA BOAFOƆ", title: "Sua pii fa kuayɛ ho.",
    description: "Sua kuayɛ akwan pa, hwehwɛ kuayɛ ho nsɛm, na ma wo kuayɛ ho nimdeɛ nyɛ kɛse.",
    welcome: "Ɛdeɛn na wopɛ sɛ wusua nnɛ?",
    welcomeDescription: "Bisa nsɛm fa nnɔbaeɛ, dɔteɛ, mmoayɛn, nnɔbaeɛ ho mmoawa, anaa kuayɛ adwuma ho.",
    placeholder: "Bisa asɛm bi fa kuayɛ ho...", send: "Fa asɛm no kɔ", language: "Mmuaeɛ kasa",
    languagePrompt: "Paw kasa a AgriGuide mfa nyɛ adwuma", sources: "Kuayɛ ho nsɛm a wotumi de ho to so",
    sourceDescription: "Hwɛ kuayɛ ho ahyehyɛdeɛ yi mu na woanya nsɛm ne akwankyerɛ foforɔ.",
    note: "Eyi yɛ adesua ho akwankyerɛ. Ɛnsi kuayɛ ho ɔfotufoɔ a ɔfata ananmu.",
    suggestions: ["Mɛyɛ dɛn asiesie dɔteɛ ama mɛdua atoko?", "Mɛyɛ dɛn ama tomato nnɔbaeɛ ayɛ pii?", "Akwan pa bɛn na wɔfa so hwɛ nkokɔ?", "Mɛyɛ dɛn atew nnɔbaeɛ a ɛsɛe wɔ otwa akyi so?"],
    thinking: "AgriGuide resiesie wo mmuaeɛ...", newChat: "Hyɛ nkɔmmɔ foforɔ ase", back: "San kɔ AgriVanta",
    assistant: "AgriGuide AI", error: "Biribi anyɛ yie. San yɛ bio, mesrɛ wo.",
    languageHelp: "Wɔde kasa a woapaw no bɛka wo asɛmmisa ho. Wɔakyerɛ ase wɔ nsɛm a ɛwɔ hɔ no mu.",
    footer: "AgriVanta — Ɛboa kuayɛ nkɔsoɔ.",
  },
  ee: {
    label: "NUKUNYAA ƑE NUSƆSRƆ ƑE KPEƉO", title: "Tsɔ wò nunya ŋu.",
    description: "Srɔ̃ dɔme nyuiewo le agble dɔwɔwɔ me, di agble ŋuti nyawo, eye nàtsɔ wò agble nunya ɖo ŋgɔ.",
    welcome: "Nu ka nèdi be nàsrɔ̃ egbe?",
    welcomeDescription: "Bia nu tso nukuɖeɖe, anyigba, lãwo, lãvɔ̃wo alo agble dɔwɔwɔ ŋuti.",
    placeholder: "Bia biabia aɖe tso agble ŋuti...", send: "Ɖo biabia la ɖa", language: "Gbɔgblɔ si woɖo ŋu",
    languagePrompt: "Tia gbɔgblɔ si AgriGuide nawɔ dɔ kple wo", sources: "Agble ŋuti nyatakakawo siwo dzi woate ŋu aka ɖo",
    sourceDescription: "Kpɔ agble dɔwɔƒewo siawo me be nàxɔ nyatakaka kple mɔfiafia bubuwo.",
    note: "Nusɔsrɔ̃ ƒe mɔfiafia sia meɖea agble dɔwɔla si wɔ nu ŋutɔ ƒe mɔfiafia ɖe te o.",
    suggestions: ["Aleke mawɔ anyigba ɖo ɖi hena agbeli?", "Aleke mate ŋu awɔ be tomato nanye geɖe?", "Nukunuwo kae nye lãkplɔ nyuie?", "Aleke mate ŋu axɔ nukuwo ta le woƒe ɣeɖoɖo megbe?"],
    thinking: "AgriGuide le ŋuɖoɖo wò biabia...", newChat: "Dze nyatakakakplɔɖo yeye gɔme", back: "Trɔ yi AgriVanta gbɔ",
    assistant: "AgriGuide AI", error: "Nu aɖe mesɔ o. Taflatse gáɖe ake.",
    languageHelp: "Wò gbɔgblɔ si nètia la atsɔ akpe ɖe wò biabia ŋu.", footer: "AgriVanta — Ɖo agble dɔwɔwɔ ɖe ŋgɔ.",
  },
  gaa: {
    label: "SHIKPƆMƆŊ NƆŊŊ LƐƐ KƐŊMƆ", title: "Hãa bo nɔŋŋ.",
    description: "Kasemɔ shikpɔmɔŋ nɔŋŋ, kɛ shikpɔmɔŋ hewalɛi, ni bo nɔŋŋ shikpɔmɔŋ hewalɛi.",
    welcome: "Nii bo yɛ ni bo kasemɔ lɛ egbe?",
    welcomeDescription: "Bisa hewalɛi tso shikpɔ, anyigba, tsuɔ, mɔɔ, loo shikpɔmɔŋ nɔŋŋ.",
    placeholder: "Bisa hewalɛi tso shikpɔmɔŋ...", send: "Kɛ hewalɛi lɛ kɔ", language: "Gbɛi lɛ",
    languagePrompt: "Tsɔ gbɛi ni AgriGuide eha bo", sources: "Shikpɔmɔŋ hewalɛi ni bo hewalɛ",
    sourceDescription: "Kɛ shikpɔmɔŋ nɔŋŋ hewalɛi kɛ hewalɛi bɔɔ.",
    note: "Hewalɛi ni eha bo lɛ, ekoŋŋ eba shikpɔmɔŋ hewalɛ ni nɔŋŋ hewalɛ.",
    suggestions: ["Mɛyɛ dɛn asiesie dɔteɛ ama mɛdua atoko?", "Mɛyɛ dɛn ama tomato nnɔbaeɛ ayɛ pii?", "Akwan pa bɛn na wɔfa so hwɛ nkokɔ?", "Mɛyɛ dɛn atew nnɔbaeɛ a ɛsɛe wɔ otwa akyi so?"],
    thinking: "AgriGuide le hewalɛi lɛ yɛ...", newChat: "Hyɛ nkɔmɔ foforɔ ase", back: "San kɔ AgriVanta",
    assistant: "AgriGuide AI", error: "He ni ekoŋŋ. Gáyɛ bio.",
    languageHelp: "Gbɛi ni bo tsɔɔ lɛ, eba kɛ bo hewalɛi lɛ.", footer: "AgriVanta — Shikpɔmɔŋ nɔŋŋ kɛ bo.",
  },
  dag: {
    label: "ZAA NI TIŋSIMI SUŊ KPAŊMA", title: "Pahi a niŋsim nyɛla.",
    description: "Kpahi zaŋsim paɣa, yɛ zaasili niŋsim, ka di zaasili baŋsim pam.",
    welcome: "Bɔ ni a booni ka a karim zaŋsim din?",
    welcomeDescription: "Bɔhim zaŋsim pam zaŋma, soil, animals, pests bee farming business ŋɔ.",
    placeholder: "Bɔhim zaŋsim zaŋma ŋɔ...", send: "Di bɔhim ŋɔ", language: "Bɔhim gbana",
    languagePrompt: "Pahi gbana din AgriGuide ni ti a", sources: "Zaŋsim pam ni ka di tooi yiŋ",
    sourceDescription: "Kpɛri zaŋsim pam ni n-ti zaŋsim bee paɣa.",
    note: "Karim niŋsim ŋɔ ka niŋ nyɛla; o maŋ kpɛri agricultural extension officer ni.",
    suggestions: ["N di soil niŋsim zaŋma ka n dɔ maize?", "N tooi pam tomato niŋsim?", "Bɔ ni nyɛ poultry management pa?", "N tooi zaŋ post-harvest losses?"],
    thinking: "AgriGuide ni yɛ a bɔhim ŋɔ...", newChat: "Dɔ nyɛla bɔhim yini", back: "Kpɛri AgriVanta gbana",
    assistant: "AgriGuide AI", error: "Bɔ ni nyɛla niŋsim. Paɣa ka yɛli.",
    languageHelp: "Gbana din a pahi ni, niŋsim ŋɔ ni ti a bɔhim.", footer: "AgriVanta — Zaŋsim pam niŋsim.",
  },
  ada: {
    label: "KPA NYƐMI KƐ LƐ HƐ", title: "Kpa nyɛmi lɛ.",
    description: "Sumi kpa nyɛmi lɛ, kpa nyɛmi nyɛmi, kɛ kpa nyɛmi hewalɛi.",
    welcome: "Nii lɛ bo yɛ ni bo kpa nyɛmi lɛ?",
    welcomeDescription: "Bisa nyɛmi tso kpa, anyigba, tsuɔ, pests, loo kpa business.",
    placeholder: "Bisa nyɛmi tso kpa...", send: "Kɛ nyɛmi lɛ kɔ", language: "Gbɛi lɛ",
    languagePrompt: "Tsɔ gbɛi ni AgriGuide ni kɛ bo", sources: "Kpa nyɛmi hewalɛi",
    sourceDescription: "Kpɛri kpa nyɛmi hewalɛi yi ni bo nya hewalɛi bɔɔ.",
    note: "Nyɛmi lɛ ekoŋŋ eba kpa extension officer ni hewalɛ.",
    suggestions: ["Mɛyɛ dɛn asiesie dɔteɛ ama mɛdua atoko?", "Mɛyɛ dɛn ama tomato nnɔbaeɛ ayɛ pii?", "Akwan pa bɛn na wɔfa so hwɛ nkokɔ?", "Mɛyɛ dɛn atew nnɔbaeɛ a ɛsɛe wɔ otwa akyi so?"],
    thinking: "AgriGuide yɛ nyɛmi lɛ...", newChat: "Hyɛ nkɔmɔ foforɔ ase", back: "San kɔ AgriVanta",
    assistant: "AgriGuide AI", error: "He ni ekoŋŋ. Gáyɛ bio.",
    languageHelp: "Gbɛi ni bo tsɔɔ lɛ, eba kɛ bo nyɛmi lɛ.", footer: "AgriVanta — Kpa nyɛmi lɛ.",
  },
  fat: {
    label: "KUADWUMA HO ADESUA BOAFOƆ", title: "Sua pii fa kuadwuma ho.",
    description: "Sua kuadwuma akwan pa, hwehwɛ kuadwuma ho nsɛm, na ma wo kuadwuma ho nimdeɛ nyɛ kɛse.",
    welcome: "Dɛn na epɛ dɛ esua ndɛ?",
    welcomeDescription: "Bisa nsɛm fa nnuaba, dɔte, mmoayɛn, nnuaba ho mmoawa, anaa kuadwuma ho.",
    placeholder: "Bisa asɛm bi fa kuadwuma ho...", send: "Fa asɛm no kɔ", language: "Mmuae kasa",
    languagePrompt: "Paw kasa a AgriGuide mfa nyɛ edwuma", sources: "Kuadwuma ho nsɛm a wotum dze ho to do",
    sourceDescription: "Hwɛ kuadwuma ahyehyɛdze yi mu na enya nsɛm na akwankyerɛ fofor.",
    note: "Eyi yɛ adesua akwankyerɛ. Ɛnsi kuadwuma ho ɔfotufo a ɔfata ananmu.",
    suggestions: ["Mɛyɛ dɛn asiesie dɔte ama mɛdua atoko?", "Mɛyɛ dɛn ama tomato nnɔbae ayɛ pii?", "Akwan pa bɛn na wɔfa do hwɛ nkokɔ?", "Mɛyɛ dɛn atew nnuaba a ɛsɛe wɔ otwa ekyir so?"],
    thinking: "AgriGuide resiesie wo mbuae...", newChat: "Hyɛ nkɔmbɔ fofor ase", back: "San kɔ AgriVanta",
    assistant: "AgriGuide AI", error: "Biribi anyɛ yie. San yɛ bio, mesrɛ wo.",
    languageHelp: "Wɔdze kasa a epaw no bɛka wo asɛmbisa ho.", footer: "AgriVanta — Boa kuadwuma nkɔdo.",
  },
  nzi: {
    label: "ƐKƐKƐLƐ ƐKƐLƐ ƐKƐKƐLƐ", title: "Kɔlɛ ɛnyɛ nwo.",
    description: "Kɔlɛ ɛkɛlɛ ɛkɛlɛ, kɔlɛ ɛkɛlɛ nyɛ, ɛkɛlɛ ɛkɛlɛ nwo.",
    welcome: "Ɛhɛ nwo kɔlɛ ɛkɛlɛ ɛnyɛ?",
    welcomeDescription: "Bisa nwo kɔlɛ, anyigba, mmoa, mmoawa, anaa kɔlɛ adwuma.",
    placeholder: "Bisa nwo kɔlɛ ɛkɛlɛ...", send: "Kɔ nwo asɛm", language: "Kasa",
    languagePrompt: "Paw kasa a AgriGuide mfa nyɛ adwuma", sources: "Kɔlɛ nwo nsɛm",
    sourceDescription: "Hwɛ ahyehyɛde yi mu na enya nwo nsɛm ne akwankyerɛ.",
    note: "Eyi yɛ adesua ho akwankyerɛ; ɛnsi kuayɛ ho ɔfotufo a ɔfata ananmu.",
    suggestions: ["Mɛyɛ dɛn asiesie dɔteɛ ama mɛdua atoko?", "Mɛyɛ dɛn ama tomato nnɔbaeɛ ayɛ pii?", "Akwan pa bɛn na wɔfa so hwɛ nkokɔ?", "Mɛyɛ dɛn atew nnɔbaeɛ a ɛsɛe wɔ otwa akyi so?"],
    thinking: "AgriGuide resiesie wo mmuaeɛ...", newChat: "Hyɛ nkɔmmɔ foforɔ ase", back: "San kɔ AgriVanta",
    assistant: "AgriGuide AI", error: "Biribi anyɛ yie. San yɛ bio.",
    languageHelp: "Kasa a epaw no bɛka wo asɛmmisa ho.", footer: "AgriVanta — Boa kuayɛ nkɔsoɔ.",
  },
  dagaa: {
    label: "TƐƐNƐ SƐRƐƐ KƆƆRƐ", title: "Kɔɔrɛ zɔŋŋ.",
    description: "Kɔɔrɛ sɛrɛɛ la, zɔŋŋ kɔɔrɛ nyɛɛ, ka kɔɔrɛ baŋŋ.",
    welcome: "Bɛɛ la a baŋŋ kɔɔrɛ?",
    welcomeDescription: "Sɔɔrɛ kɔɔrɛ la, tɛŋ, nɔɔrɛ, pests, bee kɔɔrɛ business.",
    placeholder: "Sɔɔrɛ kɔɔrɛ la...", send: "Kɔ sɔɔrɛ la", language: "Kasa",
    languagePrompt: "Pɔɔ kasa la AgriGuide nɛ kɔɔrɛ", sources: "Kɔɔrɛ sɔɔrɛ la",
    sourceDescription: "Kpɛɛ kɔɔrɛ organizations la na a nya sɔɔrɛ bɔɔ.",
    note: "Sɔɔrɛ la eŋma kɔɔrɛ extension officer la anɛ.",
    suggestions: ["Mɛyɛ dɛn asiesie dɔteɛ ama mɛdua atoko?", "Mɛyɛ dɛn ama tomato nnɔbaeɛ ayɛ pii?", "Akwan pa bɛn na wɔfa so hwɛ nkokɔ?", "Mɛyɛ dɛn atew nnɔbaeɛ a ɛsɛe wɔ otwa akyi so?"],
    thinking: "AgriGuide nɛ sɔɔrɛ la...", newChat: "Kɔɔrɛ bɔɔ la", back: "Kɔ AgriVanta",
    assistant: "AgriGuide AI", error: "Bɛɛ la eŋma. Kɔɔrɛ bɔɔ.",
    languageHelp: "Kasa la a pɔɔ, la kɔɔrɛ sɔɔrɛ la.", footer: "AgriVanta — Kɔɔrɛ la kɔɔrɛ.",
  },
  hau: {
    label: "MATAIMAKIN KOYON NOMA", title: "Ƙara iliminka.",
    description: "Koyi ingantattun hanyoyin noma, binciki bayanan aikin gona, kuma ƙara iliminka game da noma.",
    welcome: "Me kake son koya a yau?",
    welcomeDescription: "Tambayi game da amfanin gona, lafiyar ƙasa, kiwon dabbobi, kwari, ko kasuwancin noma.",
    placeholder: "Yi tambaya game da noma...", send: "Aika tambaya", language: "Harshen amsa",
    languagePrompt: "Zaɓi harshen da AgriGuide zai yi amfani da shi", sources: "Amintattun bayanan aikin gona",
    sourceDescription: "Duba waɗannan ƙungiyoyin aikin gona don ƙarin bayani da jagora.",
    note: "Wannan jagorar ilimi ba ta maye gurbin shawarar ƙwararren jami'in bunƙasa aikin gona ba.",
    suggestions: ["Ta yaya zan shirya ƙasa don shuka masara?", "Ta yaya zan inganta noman tumatir?", "Waɗanne hanyoyi ne masu kyau na kiwon kaji?", "Ta yaya zan rage asarar amfanin gona bayan girbi?"],
    thinking: "AgriGuide yana shirya amsarka...", newChat: "Fara sabon tattaunawa", back: "Koma AgriVanta",
    assistant: "AgriGuide AI", error: "Wani abu ya faru. Da fatan za a sake gwadawa.",
    languageHelp: "Za a aika harshen da ka zaɓa tare da tambayarka.", footer: "AgriVanta — Ƙarfafa kowane ɓangare na noma.",
  },
};

export default function AgriGuidePage() {
  const [language, setLanguage] = useState<Language>("en");
  const [question, setQuestion] = useState("");
  const [notice, setNotice] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const t = translations[language];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedQuestion = question.trim();

    if (!submittedQuestion || isSending) return;

    const previousMessages = messages;
    setMessages((current) => [
      ...current,
      { role: "user", content: submittedQuestion },
    ]);
    setQuestion("");
    setNotice("");
    setIsSending(true);

    try {
      const response = await fetch("/api/agriguide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: submittedQuestion,
          language,
          history: previousMessages.slice(-8),
        }),
      });

      const data: { answer?: string; error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.error);
      }

      if (!data.answer?.trim()) {
        throw new Error(t.error);
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.answer!.trim() },
      ]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t.error);
    } finally {
      setIsSending(false);
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      });
    }
  }

  function startNewConversation() {
    if (isSending) return;
    setMessages([]);
    setQuestion("");
    setNotice("");
  }

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    setNotice("");
  }

  return (
    <main className="min-h-screen bg-[#F8F6EE] text-[#183D2A]">
      <header className="border-b border-[#E2E7DD] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-2xl font-extrabold" aria-label="AgriVanta home">
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
            <p className="mt-2 text-sm leading-6 text-white/75">{t.label}</p>
          </section>

          <section className="rounded-2xl border border-[#E0E5DA] bg-white p-5">
            <div className="flex items-center gap-2">
              <Languages size={19} />
              <h2 className="font-bold">{t.language}</h2>
            </div>
            <div className="mt-4">
              <label htmlFor="answer-language" className="mb-2 block text-sm text-[#657468]">
                {t.languagePrompt}
              </label>
              <select
                id="answer-language"
                value={language}
                onChange={(event) => changeLanguage(event.target.value as Language)}
                className="w-full rounded-xl border border-[#D8DFD4] bg-white px-3 py-3 text-sm font-semibold text-[#183D2A] outline-none focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs leading-5 text-[#788478]">
                {t.languageHelp}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E0E5DA] bg-white p-5">
            <div className="flex items-center gap-2">
              <BookOpen size={19} />
              <h2 className="font-bold">{t.sources}</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#657468]">{t.sourceDescription}</p>
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
                CSIR Ghana <ExternalLink size={15} className="shrink-0" />
              </a>
              <a
                href="https://www.fao.org/ghana/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-2 text-[#17472D] hover:underline"
              >
                FAO Ghana <ExternalLink size={15} className="shrink-0" />
              </a>
            </div>
          </section>
        </aside>

        <section className="flex min-h-[680px] flex-col overflow-hidden rounded-2xl border border-[#E0E5DA] bg-white shadow-sm">
          <div className="border-b border-[#E8ECE4] px-5 py-6 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-widest text-[#987526]">{t.label}</p>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">{t.title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#657468] sm:text-base">
              {t.description}
            </p>
          </div>

          <div className="flex flex-1 flex-col px-5 py-8 sm:px-8">
            <div className="mx-auto w-full max-w-2xl flex-1">
              {messages.length === 0 ? (
                <div className="my-auto">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF0E6]">
                    <MessageCircle size={28} className="text-[#17472D]" />
                  </div>
                  <h3 className="mt-5 text-center text-xl font-bold">{t.welcome}</h3>
                  <p className="mx-auto mt-2 max-w-lg text-center text-sm leading-6 text-[#657468]">
                    {t.welcomeDescription}
                  </p>
                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {t.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        disabled={isSending}
                        onClick={() => {
                          setQuestion(suggestion);
                          setNotice("");
                        }}
                        className="rounded-xl border border-[#E0E5DA] p-4 text-left text-sm leading-6 transition hover:border-[#17472D] hover:bg-[#F8FAF5] disabled:opacity-50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {messages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[90%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-7 ${
                          message.role === "user"
                            ? "bg-[#17472D] text-white"
                            : "border border-[#E0E5DA] bg-[#F8FAF5] text-[#183D2A]"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#987526]">
                            {t.assistant}
                          </p>
                        )}
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {isSending && (
                    <div role="status" className="flex items-center gap-2 rounded-xl bg-[#F8FAF5] p-4 text-sm text-[#657468]">
                      <LoaderCircle size={17} className="animate-spin" />
                      {t.thinking}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                  {!isSending && (
                    <button
                      type="button"
                      onClick={startNewConversation}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#17472D] underline underline-offset-4"
                    >
                      <RotateCcw size={15} />
                      {t.newChat}
                    </button>
                  )}
                </div>
              )}

              {notice && (
                <p
                  role="alert"
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
                    disabled={isSending}
                    className="max-h-36 min-h-12 flex-1 resize-y bg-transparent px-2 py-2 text-sm outline-none disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!question.trim() || isSending}
                    aria-label={t.send}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#17472D] text-white transition hover:bg-[#103620] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isSending ? <LoaderCircle size={20} className="animate-spin" /> : <ArrowUp size={21} />}
                  </button>
                </div>
              </form>
              <p className="mt-3 text-center text-xs leading-5 text-[#788478]">{t.note}</p>
            </div>
          </div>
        </section>
      </div>

      <footer className="border-t border-[#E0E5DA] bg-white px-5 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 text-xs text-[#657468]">
          <span>{t.footer}</span>
          <span>AgriGuide AI</span>
        </div>
      </footer>
    </main>
  );
}
