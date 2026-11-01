"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUp,
  BookOpen,
  ExternalLink,
  Plus,
  MessageSquare,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  Pencil,
  Check,
  X,
  Languages,
  MessageCircle,
  Sprout,
  LoaderCircle,
  ImagePlus,
  Download,
  FileText,
  Printer,
  XCircle,
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
  createdAt?: string | Date;
  image?: { id: string; filename: string; contentType: string; url: string };
};

type Conversation = {
  id: string;
  title: string;
  language: Language;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

const translations: Record<
  Language,
  {
    label: string;
    title: string;
    description: string;
    welcome: string;
    welcomeDescription: string;
    placeholder: string;
    send: string;
    language: string;
    languagePrompt: string;
    sources: string;
    sourceDescription: string;
    note: string;
    suggestions: string[];
    thinking: string;
    newChat: string;
    back: string;
    assistant: string;
    error: string;
    languageHelp: string;
    footer: string;
  }
> = {
  en: {
    label: "AGRICULTURAL LEARNING ASSISTANT",
    title: "Grow your knowledge.",
    description:
      "Learn better farming practices, explore agricultural information, and build your farming knowledge.",
    welcome: "What would you like to learn today?",
    welcomeDescription:
      "Ask about crop production, soil health, livestock, pests, or agricultural business.",
    placeholder: "Ask a question about farming...",
    send: "Send question",
    language: "Answer language",
    languagePrompt: "Choose the language AgriGuide should use",
    sources: "Trusted agricultural resources",
    sourceDescription:
      "Explore these agricultural organizations for additional information and guidance.",
    note:
      "Educational guidance does not replace advice from a qualified agricultural extension officer.",
    suggestions: [
      "How do I prepare soil for planting maize?",
      "How can I improve tomato production?",
      "What are good poultry management practices?",
      "How can I prevent post-harvest losses?",
    ],
    thinking: "AgriGuide is preparing your answer...",
    newChat: "Start a new conversation",
    back: "Back to AgriVanta",
    assistant: "AgriGuide AI",
    error: "Something went wrong. Please try again.",
    languageHelp:
      "The selected language will be sent with your question. Interface text is translated where translations are available.",
    footer: "AgriVanta — Powering Every Link in Agriculture.",
  },

  tw: {
    label: "KUAYƐ HO ADESUA BOAFOƆ",
    title: "Sua pii fa kuayɛ ho.",
    description:
      "Sua kuayɛ akwan pa, hwehwɛ kuayɛ ho nsɛm, na ma wo kuayɛ ho nimdeɛ nyɛ kɛse.",
    welcome: "Ɛdeɛn na wopɛ sɛ wusua nnɛ?",
    welcomeDescription:
      "Bisa nsɛm fa nnɔbaeɛ, dɔteɛ, mmoayɛn, nnɔbaeɛ ho mmoawa, anaa kuayɛ adwuma ho.",
    placeholder: "Bisa asɛm bi fa kuayɛ ho...",
    send: "Fa asɛm no kɔ",
    language: "Mmuaeɛ kasa",
    languagePrompt: "Paw kasa a AgriGuide mfa nyɛ adwuma",
    sources: "Kuayɛ ho nsɛm a wotumi de ho to so",
    sourceDescription:
      "Hwɛ kuayɛ ho ahyehyɛdeɛ yi mu na woanya nsɛm ne akwankyerɛ foforɔ.",
    note:
      "Eyi yɛ adesua ho akwankyerɛ. Ɛnsi kuayɛ ho ɔfotufoɔ a ɔfata ananmu.",
    suggestions: [
      "Mɛyɛ dɛn asiesie dɔteɛ ama mɛdua atoko?",
      "Mɛyɛ dɛn ama tomato nnɔbaeɛ ayɛ pii?",
      "Akwan pa bɛn na wɔfa so hwɛ nkokɔ?",
      "Mɛyɛ dɛn atew nnɔbaeɛ a ɛsɛe wɔ otwa akyi so?",
    ],
    thinking: "AgriGuide resiesie wo mmuaeɛ...",
    newChat: "Hyɛ nkɔmmɔ foforɔ ase",
    back: "San kɔ AgriVanta",
    assistant: "AgriGuide AI",
    error: "Biribi anyɛ yie. San yɛ bio, mesrɛ wo.",
    languageHelp:
      "Wɔde kasa a woapaw no bɛka wo asɛmmisa ho. Wɔakyerɛ ase wɔ nsɛm a ɛwɔ hɔ no mu.",
    footer: "AgriVanta — Ɛboa kuayɛ nkɔsoɔ.",
  },

  ee: {
    label: "NUKUNYAA ƑE NUSƆSRƆ ƑE KPEƉO",
    title: "Tsɔ wò nunya ŋu.",
    description:
      "Srɔ̃ dɔme nyuiewo le agble dɔwɔwɔ me, di agble ŋuti nyawo, eye nàtsɔ wò agble nunya ɖo ŋgɔ.",
    welcome: "Nu ka nèdi be nàsrɔ̃ egbe?",
    welcomeDescription:
      "Bia nu tso nukuɖeɖe, anyigba, lãwo, lãvɔ̃wo alo agble dɔwɔwɔ ŋuti.",
    placeholder: "Bia biabia aɖe tso agble ŋuti...",
    send: "Ɖo biabia la ɖa",
    language: "Gbɔgblɔ si woɖo ŋu",
    languagePrompt: "Tia gbɔgblɔ si AgriGuide nawɔ dɔ kple wo",
    sources: "Agble ŋuti nyatakakawo siwo dzi woate ŋu aka ɖo",
    sourceDescription:
      "Kpɔ agble dɔwɔƒewo siawo me be nàxɔ nyatakaka kple mɔfiafia bubuwo.",
    note:
      "Nusɔsrɔ̃ ƒe mɔfiafia sia meɖea agble dɔwɔla si wɔ nu ŋutɔ ƒe mɔfiafia ɖe te o.",
    suggestions: [
      "Aleke mawɔ anyigba ɖo ɖi hena agbeli?",
      "Aleke mate ŋu awɔ be tomato nanye geɖe?",
      "Nukunuwo kae nye lãkplɔ nyuie?",
      "Aleke mate ŋu axɔ nukuwo ta le woƒe ɣeɖoɖo megbe?",
    ],
    thinking: "AgriGuide le ŋuɖoɖo wò biabia...",
    newChat: "Dze nyatakakakplɔɖo yeye gɔme",
    back: "Trɔ yi AgriVanta gbɔ",
    assistant: "AgriGuide AI",
    error: "Nu aɖe mesɔ o. Taflatse gáɖe ake.",
    languageHelp: "Wò gbɔgblɔ si nètia la atsɔ akpe ɖe wò biabia ŋu.",
    footer: "AgriVanta — Ɖo agble dɔwɔwɔ ɖe ŋgɔ.",
  },

  gaa: {
    label: "SHIKPƆMƆŊ NƆŊŊ LƐƐ KƐŊMƆ",
    title: "Hãa bo nɔŋŋ.",
    description:
      "Kasemɔ shikpɔmɔŋ nɔŋŋ, kɛ shikpɔmɔŋ hewalɛi, ni bo nɔŋŋ shikpɔmɔŋ hewalɛi.",
    welcome: "Nii bo yɛ ni bo kasemɔ lɛ egbe?",
    welcomeDescription:
      "Bisa hewalɛi tso shikpɔ, anyigba, tsuɔ, mɔɔ, loo shikpɔmɔŋ nɔŋŋ.",
    placeholder: "Bisa hewalɛi tso shikpɔmɔŋ...",
    send: "Kɛ hewalɛi lɛ kɔ",
    language: "Gbɛi lɛ",
    languagePrompt: "Tsɔ gbɛi ni AgriGuide eha bo",
    sources: "Shikpɔmɔŋ hewalɛi ni bo hewalɛ",
    sourceDescription: "Kɛ shikpɔmɔŋ nɔŋŋ hewalɛi kɛ hewalɛi bɔɔ.",
    note:
      "Hewalɛi ni eha bo lɛ, ekoŋŋ eba shikpɔmɔŋ hewalɛ ni nɔŋŋ hewalɛ.",
    suggestions: [
      "Mɛyɛ dɛn asiesie dɔteɛ ama mɛdua atoko?",
      "Mɛyɛ dɛn ama tomato nnɔbaeɛ ayɛ pii?",
      "Akwan pa bɛn na wɔfa so hwɛ nkokɔ?",
      "Mɛyɛ dɛn atew nnɔbaeɛ a ɛsɛe wɔ otwa akyi so?",
    ],
    thinking: "AgriGuide le hewalɛi lɛ yɛ...",
    newChat: "Hyɛ nkɔmɔ foforɔ ase",
    back: "San kɔ AgriVanta",
    assistant: "AgriGuide AI",
    error: "He ni ekoŋŋ. Gáyɛ bio.",
    languageHelp: "Gbɛi ni bo tsɔɔ lɛ, eba kɛ bo hewalɛi lɛ.",
    footer: "AgriVanta — Shikpɔmɔŋ nɔŋŋ kɛ bo.",
  },

  dag: {
    label: "ZAA NI TIŋSIMI SUŊ KPAŊMA",
    title: "Pahi a niŋsim nyɛla.",
    description:
      "Kpahi zaŋsim paɣa, yɛ zaasili niŋsim, ka di zaasili baŋsim pam.",
    welcome: "Bɔ ni a booni ka a karim zaŋsim din?",
    welcomeDescription:
      "Bɔhim zaŋsim pam zaŋma, soil, animals, pests bee farming business ŋɔ.",
    placeholder: "Bɔhim zaŋsim zaŋma ŋɔ...",
    send: "Di bɔhim ŋɔ",
    language: "Bɔhim gbana",
    languagePrompt: "Pahi gbana din AgriGuide ni ti a",
    sources: "Zaŋsim pam ni ka di tooi yiŋ",
    sourceDescription: "Kpɛri zaŋsim pam ni n-ti zaŋsim bee paɣa.",
    note:
      "Karim niŋsim ŋɔ ka niŋ nyɛla; o maŋ kpɛri agricultural extension officer ni.",
    suggestions: [
      "N di soil niŋsim zaŋma ka n dɔ maize?",
      "N tooi pam tomato niŋsim?",
      "Bɔ ni nyɛ poultry management pa?",
      "N tooi zaŋ post-harvest losses?",
    ],
    thinking: "AgriGuide ni yɛ a bɔhim ŋɔ...",
    newChat: "Dɔ nyɛla bɔhim yini",
    back: "Kpɛri AgriVanta gbana",
    assistant: "AgriGuide AI",
    error: "Bɔ ni nyɛla niŋsim. Paɣa ka yɛli.",
    languageHelp: "Gbana din a pahi ni, niŋsim ŋɔ ni ti a bɔhim.",
    footer: "AgriVanta — Zaŋsim pam niŋsim.",
  },

  ada: {
    label: "KPA NYƐMI KƐ LƐ HƐ",
    title: "Kpa nyɛmi lɛ.",
    description:
      "Sumi kpa nyɛmi lɛ, kpa nyɛmi nyɛmi, kɛ kpa nyɛmi hewalɛi.",
    welcome: "Nii lɛ bo yɛ ni bo kpa nyɛmi lɛ?",
    welcomeDescription:
      "Bisa nyɛmi tso kpa, anyigba, tsuɔ, pests, loo kpa business.",
    placeholder: "Bisa nyɛmi tso kpa...",
    send: "Kɛ nyɛmi lɛ kɔ",
    language: "Gbɛi lɛ",
    languagePrompt: "Tsɔ gbɛi ni AgriGuide ni kɛ bo",
    sources: "Kpa nyɛmi hewalɛi",
    sourceDescription:
      "Kpɛri kpa nyɛmi hewalɛi yi ni bo nya hewalɛi bɔɔ.",
    note: "Nyɛmi lɛ ekoŋŋ eba kpa extension officer ni hewalɛ.",
    suggestions: [
      "Mɛyɛ dɛn asiesie dɔteɛ ama mɛdua atoko?",
      "Mɛyɛ dɛn ama tomato nnɔbaeɛ ayɛ pii?",
      "Akwan pa bɛn na wɔfa so hwɛ nkokɔ?",
      "Mɛyɛ dɛn atew nnɔbaeɛ a ɛsɛe wɔ otwa akyi so?",
    ],
    thinking: "AgriGuide yɛ nyɛmi lɛ...",
    newChat: "Hyɛ nkɔmɔ foforɔ ase",
    back: "San kɔ AgriVanta",
    assistant: "AgriGuide AI",
    error: "He ni ekoŋŋ. Gáyɛ bio.",
    languageHelp: "Gbɛi ni bo tsɔɔ lɛ, eba kɛ bo nyɛmi lɛ.",
    footer: "AgriVanta — Kpa nyɛmi lɛ.",
  },

  fat: {
    label: "KUADWUMA HO ADESUA BOAFOƆ",
    title: "Sua pii fa kuadwuma ho.",
    description:
      "Sua kuadwuma akwan pa, hwehwɛ kuadwuma ho nsɛm, na ma wo kuadwuma ho nimdeɛ nyɛ kɛse.",
    welcome: "Dɛn na epɛ dɛ esua ndɛ?",
    welcomeDescription:
      "Bisa nsɛm fa nnuaba, dɔte, mmoayɛn, nnuaba ho mmoawa, anaa kuadwuma ho.",
    placeholder: "Bisa asɛm bi fa kuadwuma ho...",
    send: "Fa asɛm no kɔ",
    language: "Mmuae kasa",
    languagePrompt: "Paw kasa a AgriGuide mfa nyɛ edwuma",
    sources: "Kuadwuma ho nsɛm a wotum dze ho to do",
    sourceDescription:
      "Hwɛ kuadwuma ahyehyɛdze yi mu na enya nsɛm na akwankyerɛ fofor.",
    note:
      "Eyi yɛ adesua akwankyerɛ. Ɛnsi kuadwuma ho ɔfotufo a ɔfata ananmu.",
    suggestions: [
      "Mɛyɛ dɛn asiesie dɔte ama mɛdua atoko?",
      "Mɛyɛ dɛn ama tomato nnɔbae ayɛ pii?",
      "Akwan pa bɛn na wɔfado hwɛ nkokɔ?",
      "Mɛyɛ dɛn atew nnuaba a ɛsɛe wɔ otwa ekyir so?",
    ],
    thinking: "AgriGuide resiesie wo mbuae...",
    newChat: "Hyɛ nkɔmbɔ fofor ase",
    back: "San kɔ AgriVanta",
    assistant: "AgriGuide AI",
    error: "Biribi anyɛ yie. San yɛ bio, mesrɛ wo.",
    languageHelp: "Wɔdze kasa a epaw no bɛka wo asɛmbisa ho.",
    footer: "AgriVanta — Boa kuadwuma nkɔdo.",
  },

  nzi: {
    label: "ƐKƐKƐLƐ ƐKƐLƐ ƐKƐKƐLƐ",
    title: "Kɔlɛ ɛnyɛ nwo.",
    description:
      "Kɔlɛ ɛkɛlɛ ɛkɛlɛ, kɔlɛ ɛkɛlɛ nyɛ, ɛkɛlɛ ɛkɛlɛ nwo.",
    welcome: "Ɛhɛ nwo kɔlɛ ɛkɛlɛ ɛnyɛ?",
    welcomeDescription:
      "Bisa nwo kɔlɛ, anyigba, mmoa, mmoawa, anaa kɔlɛ adwuma.",
    placeholder: "Bisa nwo kɔlɛ ɛkɛlɛ...",
    send: "Kɔ nwo asɛm",
    language: "Kasa",
    languagePrompt: "Paw kasa a AgriGuide mfa nyɛ adwuma",
    sources: "Kɔlɛ nwo nsɛm",
    sourceDescription:
      "Hwɛ ahyehyɛde yi mu na enya nwo nsɛm ne akwankyerɛ.",
    note:
      "Eyi yɛ adesua ho akwankyerɛ; ɛnsi kuayɛ ho ɔfotufo a ɔfata ananmu.",
    suggestions: [
      "Mɛyɛ dɛn asiesie dɔteɛ ama mɛdua atoko?",
      "Mɛyɛ dɛn ama tomato nnɔbaeɛ ayɛ pii?",
      "Akwan pa bɛn na wɔfa so hwɛ nkokɔ?",
      "Mɛyɛ dɛn atew nnɔbaeɛ a ɛsɛe wɔ otwa akyi so?",
    ],
    thinking: "AgriGuide resiesie wo mmuaeɛ...",
    newChat: "Hyɛ nkɔmmɔ foforɔ ase",
    back: "San kɔ AgriVanta",
    assistant: "AgriGuide AI",
    error: "Biribi anyɛ yie. San yɛ bio.",
    languageHelp: "Kasa a epaw no bɛka wo asɛmmisa ho.",
    footer: "AgriVanta — Boa kuayɛ nkɔsoɔ.",
  },

  dagaa: {
    label: "TƐƐNƐ SƐRƐƐ KƆƆRƐ",
    title: "Kɔɔrɛ zɔŋŋ.",
    description:
      "Kɔɔrɛ sɛrɛɛ la, zɔŋŋ kɔɔrɛ nyɛɛ, ka kɔɔrɛ baŋŋ.",
    welcome: "Bɛɛ la a baŋŋ kɔɔrɛ?",
    welcomeDescription:
      "Sɔɔrɛ kɔɔrɛ la, tɛŋ, nɔɔrɛ, pests, bee kɔɔrɛ business.",
    placeholder: "Sɔɔrɛ kɔɔrɛ la...",
    send: "Kɔ sɔɔrɛ la",
    language: "Kasa",
    languagePrompt: "Pɔɔ kasa la AgriGuide nɛ kɔɔrɛ",
    sources: "Kɔɔrɛ sɔɔrɛ la",
    sourceDescription:
      "Kpɛɛ kɔɔrɛ organizations la na a nya sɔɔrɛ bɔɔ.",
    note: "Sɔɔrɛ la eŋma kɔɔrɛ extension officer la anɛ.",
    suggestions: [
      "Mɛyɛ dɛn asiesie dɔteɛ ama mɛdua atoko?",
      "Mɛyɛ dɛn ama tomato nnɔbaeɛ ayɛ pii?",
      "Akwan pa bɛn na wɔfa so hwɛ nkokɔ?",
      "Mɛyɛ dɛn atew nnɔbaeɛ a ɛsɛe wɔ otwa akyi so?",
    ],
    thinking: "AgriGuide nɛ sɔɔrɛ la...",
    newChat: "Kɔɔrɛ bɔɔ la",
    back: "Kɔ AgriVanta",
    assistant: "AgriGuide AI",
    error: "Bɛɛ la eŋma. Kɔɔrɛ bɔɔ.",
    languageHelp: "Kasa la a pɔɔ, la kɔɔrɛ sɔɔrɛ la.",
    footer: "AgriVanta — Kɔɔrɛ la kɔɔrɛ.",
  },

  hau: {
    label: "MATAIMAKIN KOYON NOMA",
    title: "Ƙara iliminka.",
    description:
      "Koyi ingantattun hanyoyin noma, binciki bayanan aikin gona, kuma ƙara iliminka game da noma.",
    welcome: "Me kake son koya a yau?",
    welcomeDescription:
      "Tambayi game da amfanin gona, lafiyar ƙasa, kiwon dabbobi, kwari, ko kasuwancin noma.",
    placeholder: "Yi tambaya game da noma...",
    send: "Aika tambaya",
    language: "Harshen amsa",
    languagePrompt: "Zaɓi harshen da AgriGuide zai yi amfani da shi",
    sources: "Amintattun bayanan aikin gona",
    sourceDescription:
      "Duba waɗannan ƙungiyoyin aikin gona don ƙarin bayani da jagora.",
    note:
      "Wannan jagorar ilimi ba ta maye gurbin shawarar ƙwararren jami'in bunƙasa aikin gona ba.",
    suggestions: [
      "Ta yaya zan shirya ƙasa don shuka masara?",
      "Ta yaya zan inganta noman tumatir?",
      "Waɗanne hanyoyi nemasu kyau na kiwon kaji?",
      "Ta yaya zan rage asarar amfanin gona bayan girbi?",
    ],
    thinking: "AgriGuide yana shirya amsarka...",
    newChat: "Fara sabon tattaunawa",
    back: "Koma AgriVanta",
    assistant: "AgriGuide AI",
    error: "Wani abu ya faru. Da fatan za a sake gwadawa.",
    languageHelp: "Za a aika harshen da ka zaɓa tare da tambayarka.",
    footer: "AgriVanta — Ƙarfafa kowane ɓangare na noma.",
  },
};

type ConversationGroup = "Today" | "Yesterday" | "Previous 7 Days" | "Older";

function getConversationGroup(updatedAt: string): ConversationGroup {
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return "Older";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";
  if (date >= sevenDaysAgo) return "Previous 7 Days";
  return "Older";
}

export default function AgriGuidePage() {
  const [language, setLanguage] = useState<Language>("en");
  const [question, setQuestion] = useState("");
  const [notice, setNotice] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationSearch, setConversationSearch] = useState("");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isOpeningConversation, setIsOpeningConversation] = useState(false);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const t = translations[language];

  // Load the user's saved conversations
  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/agriguide/conversations", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load conversation history.");
      }

      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Conversation history error:", error);
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to load conversation history."
      );
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Automatically scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isSending]);

  // Start a new conversation
  function startNewConversation() {
    if (isSending || isOpeningConversation) return;

    setActiveConversationId(null);
    setMessages([]);
    setQuestion("");
    setSelectedImage(null);
    setSelectedImagePreview(null);
    setNotice("");
  }

  // Open a saved conversation
  async function openConversation(conversationId: string) {
    if (isSending || isOpeningConversation) return;

    if (conversationId === activeConversationId) return;

    setIsOpeningConversation(true);
    setNotice("");

    try {
      const response = await fetch(
        `/api/agriguide/conversations/${conversationId}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to open this conversation.");
      }

      const conversation = data.conversation;

      setActiveConversationId(conversation.id);
      setMessages(conversation.messages || []);
      setQuestion("");

      if (languageOptions.some((option) => option.value === conversation.language)) {
        setLanguage(conversation.language);
      }
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to open this conversation."
      );
    } finally {
      setIsOpeningConversation(false);
    }
  }

  // Begin editing a conversation title
  function beginRename(conversation: Conversation) {
    if (isSending || isOpeningConversation || isSavingTitle) return;
    setEditingConversationId(conversation.id);
    setEditingTitle(conversation.title);
    setNotice("");
  }

  // Cancel title editing
  function cancelRename() {
    if (isSavingTitle) return;
    setEditingConversationId(null);
    setEditingTitle("");
  }

  // Save a renamed conversation
  async function saveConversationTitle(conversationId: string) {
    const title = editingTitle.trim();

    if (!title) {
      setNotice("Please enter a conversation title.");
      return;
    }

    if (title.length > 60) {
      setNotice("Conversation titles must be 60 characters or fewer.");
      return;
    }

    setIsSavingTitle(true);
    setNotice("");

    try {
      const response = await fetch(
        `/api/agriguide/conversations/${conversationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        }
      );

      const data: { title?: string; error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to rename this conversation.");
      }

      const savedTitle = data.title || title;

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, title: savedTitle }
            : conversation
        )
      );

      setEditingConversationId(null);
      setEditingTitle("");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to rename this conversation."
      );
    } finally {
      setIsSavingTitle(false);
    }
  }

  // Delete a conversation after confirmation
  async function deleteConversation(conversation: Conversation) {
    if (isSending || deletingConversationId) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${conversation.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingConversationId(conversation.id);
    setNotice("");

    try {
      const response = await fetch(
        `/api/agriguide/conversations/${conversation.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete this conversation.");
      }

      setConversations((current) =>
        current.filter((item) => item.id !== conversation.id)
      );

      if (activeConversationId === conversation.id) {
        startNewConversation();
      }
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to delete this conversation."
      );
    } finally {
      setDeletingConversationId(null);
    }
  }

  // Send text and an optional crop image to AgriGuide.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedQuestion = question.trim();
    if ((!submittedQuestion && !selectedImage) || isSending || isOpeningConversation) return;
    if (selectedImage && selectedImage.size > 8 * 1024 * 1024) {
      setNotice("Please choose an image smaller than 8 MB.");
      return;
    }
    const imageFileToSend = selectedImage;
    const localImageUrl = imageFileToSend ? URL.createObjectURL(imageFileToSend) : undefined;
    setMessages((current) => [...current, {
      role: "user", content: submittedQuestion || "Please analyse this agricultural image.",
      ...(localImageUrl ? { image: { id: "local-preview", filename: imageFileToSend!.name, contentType: imageFileToSend!.type, url: localImageUrl } } : {}),
    }]);
    setQuestion("");
    setSelectedImage(null);
    setSelectedImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    setNotice("");
    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append("question", submittedQuestion || "Please analyse this agricultural image.");
      formData.append("language", language);
      if (activeConversationId) formData.append("conversationId", activeConversationId);
      if (imageFileToSend) formData.append("image", imageFileToSend);
      const response = await fetch("/api/agriguide", { method: "POST", body: formData });
      const data: { answer?: string; error?: string; conversationId?: string | null; title?: string; image?: ChatMessage["image"] | null } = await response.json();
      if (data.conversationId) setActiveConversationId(data.conversationId);
      if (!response.ok) {
        setNotice(data.error || t.error);
        if (data.conversationId) {
          const saved = await fetch(`/api/agriguide/conversations/${data.conversationId}`, { cache: "no-store" });
          if (saved.ok) { const savedData = await saved.json(); setMessages(savedData.conversation?.messages || []); }
        }
        await loadConversations(); return;
      }
      if (!data.answer?.trim() || !data.conversationId) throw new Error(t.error);
      if (data.image) {
        setMessages((current) => current.map((message, index) =>
          index === current.length - 1 && message.role === "user"
            ? { ...message, image: data.image! }
            : message
        ));
      }
      setMessages((current) => [...current, { role: "assistant", content: data.answer!.trim() }]);
      await loadConversations();
    } catch (error) { setNotice(error instanceof Error ? error.message : t.error); }
    finally { setIsSending(false); }
  }

  function handleImageSelection(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setNotice("Choose a JPG, PNG, or WebP image."); return; }
    if (file.size > 8 * 1024 * 1024) { setNotice("Please choose an image smaller than 8 MB."); return; }
    setSelectedImage(file);
    setSelectedImagePreview(URL.createObjectURL(file));
    setNotice("");
  }

  function exportConversationText() {
    if (!messages.length) return;
    const content = messages.map((message) => `${message.role === "user" ? "You" : "AgriGuide"}: ${message.content}${message.image ? `\nImage: ${message.image.filename} (${message.image.url})` : ""}`).join("\n\n");
    const blob = new Blob([`AgriGuide Conversation\n\n${content}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "agriguide-conversation.txt"; anchor.click(); URL.revokeObjectURL(url);
  }

  function printConversation() { window.print(); }

  // Retry the last unanswered question without saving it twice.
  async function retryLastAnswer() {
    if (!activeConversationId || isSending || isOpeningConversation) return;
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") return;

    setNotice("");
    setIsSending(true);

    try {
      const retryForm = new FormData();
      retryForm.append("conversationId", activeConversationId);
      retryForm.append("language", language);
      retryForm.append("retryLast", "true");
      const response = await fetch("/api/agriguide", { method: "POST", body: retryForm });

      const data: {
        answer?: string;
        error?: string;
        conversationId?: string | null;
      } = await response.json();

      if (data.conversationId) setActiveConversationId(data.conversationId);

      if (!response.ok) {
        setNotice(data.error || t.error);
        const saved = await fetch(`/api/agriguide/conversations/${activeConversationId}`, { cache: "no-store" });
        if (saved.ok) { const savedData = await saved.json(); setMessages(savedData.conversation?.messages || []); }
        await loadConversations();
        return;
      }

      if (!data.answer?.trim()) throw new Error(t.error);

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.answer!.trim() },
      ]);
      await loadConversations();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t.error);
    } finally {
      setIsSending(false);
    }
  }

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    setNotice("");
  }

  const filteredConversations = conversations.filter((conversation) =>
    conversation.title.toLowerCase().includes(conversationSearch.trim().toLowerCase())
  );

  const conversationGroups: { title: ConversationGroup; items: Conversation[] }[] = [
    "Today",
    "Yesterday",
    "Previous 7 Days",
    "Older",
  ].map((groupTitle) => ({
    title: groupTitle as ConversationGroup,
    items: filteredConversations.filter(
      (conversation) => getConversationGroup(conversation.updatedAt) === groupTitle
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <main className="min-h-screen bg-[#F8F6EE] text-[#183D2A] print:bg-white">
      <header className="border-b border-[#E2E7DD] bg-white">
  <div className="mx-auto flex max-w-[1600px] items-center px-5 py-3">
    <button
      type="button"
      onClick={() => setIsSidebarOpen((current) => !current)}
      aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
      aria-expanded={isSidebarOpen}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E0E5DA] text-[#17472D] transition hover:bg-[#F8FAF5]"
    >
      {isSidebarOpen ? (
        <PanelLeftClose size={19} />
      ) : (
        <PanelLeftOpen size={19} />
      )}
    </button>
  </div>
</header>

      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-6 sm:px-5 lg:py-8">
        {/* Conversation sidebar */}
        {isSidebarOpen && (
          <aside className="w-full shrink-0 space-y-5 lg:w-[280px]">
            <section className="rounded-2xl bg-[#17472D] p-5 text-white">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                <Sprout size={28} className="text-[#E8C66F]" />
              </div>

              <p className="text-xs font-semibold uppercase tracking-widest text-[#E8C66F]">
                AgriVanta
              </p>

              <h1 className="mt-2 text-2xl font-bold">AgriGuide AI</h1>

              <p className="mt-2 text-sm leading-6 text-white/75">
                {t.label}
              </p>
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#E0E5DA] bg-white">
              <div className="border-b border-[#E8ECE4] p-4">
                <button
                  type="button"
                  onClick={startNewConversation}
                  disabled={isSending || isOpeningConversation}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#17472D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#103620] disabled:opacity-50"
                >
                  <Plus size={18} />
                  {t.newChat}
                </button>
              </div>

              <div className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-bold">Recent conversations</h2>

                  <MessageSquare size={17} className="text-[#657468]" />
                </div>

                <div className="relative mb-4">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#788478]" />
                  <input
                    type="search"
                    value={conversationSearch}
                    onChange={(event) => setConversationSearch(event.target.value)}
                    placeholder="Search conversations..."
                    aria-label="Search conversations"
                    className="w-full rounded-xl border border-[#D8DFD4] bg-white py-2.5 pl-9 pr-3 text-sm text-[#183D2A] outline-none placeholder:text-[#9AA397] focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
                  />
                </div>

                {isLoadingHistory ? (
                  <div className="flex items-center gap-2 py-5 text-sm text-[#657468]">
                    <LoaderCircle size={16} className="animate-spin" />
                    Loading conversations...
                  </div>
                ) : conversations.length === 0 ? (
                  <p className="py-5 text-center text-sm leading-6 text-[#788478]">
                    No saved conversations yet. Start a new chat to begin.
                  </p>
                ) : filteredConversations.length === 0 ? (
                  <p className="py-5 text-center text-sm leading-6 text-[#788478]">
                    No conversations match your search.
                  </p>
                ) : (
                  <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
                    {conversationGroups.map((group) => (
                      <div key={group.title}>
                        <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-[#8A9588]">
                          {group.title}
                        </h3>
                        <div className="space-y-2">
                          {group.items.map((conversation) => (
                            <div
                              key={conversation.id}
                              className={`group rounded-xl border transition ${
                                activeConversationId === conversation.id
                                  ? "border-[#17472D] bg-[#F0F5EC]"
                                  : "border-transparent hover:border-[#E0E5DA] hover:bg-[#F8FAF5]"
                              }`}
                            >
                              {editingConversationId === conversation.id ? (
                                <form
                                  onSubmit={(event) => {
                                    event.preventDefault();
                                    saveConversationTitle(conversation.id);
                                  }}
                                  className="flex items-center gap-1 p-2"
                                >
                                  <input
                                    autoFocus
                                    type="text"
                                    value={editingTitle}
                                    onChange={(event) => setEditingTitle(event.target.value)}
                                    maxLength={60}
                                    aria-label="Conversation title"
                                    className="min-w-0 flex-1 rounded-lg border border-[#D8DFD4] bg-white px-2 py-2 text-sm text-[#183D2A] outline-none focus:border-[#17472D]"
                                  />
                                  <button
                                    type="submit"
                                    disabled={!editingTitle.trim() || isSavingTitle}
                                    aria-label="Save conversation title"
                                    title="Save title"
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#17472D] hover:bg-[#EAF0E6] disabled:opacity-40"
                                  >
                                    {isSavingTitle ? (
                                      <LoaderCircle size={15} className="animate-spin" />
                                    ) : (
                                      <Check size={16} />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelRename}
                                    disabled={isSavingTitle}
                                    aria-label="Cancel renaming"
                                    title="Cancel"
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#788478] hover:bg-[#F0F2ED] disabled:opacity-40"
                                  >
                                    <X size={16} />
                                  </button>
                                </form>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openConversation(conversation.id)}
                                    disabled={isSending || isOpeningConversation || isSavingTitle}
                                    className="min-w-0 flex-1 px-3 py-3 text-left disabled:opacity-50"
                                  >
                                    <span className="block truncate text-sm font-semibold text-[#183D2A]">
                                      {conversation.title}
                                    </span>
                                    <span className="mt-1 block text-xs text-[#788478]">
                                      {conversation.messageCount} messages
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => beginRename(conversation)}
                                    disabled={isSending || isOpeningConversation || isSavingTitle}
                                    aria-label={`Rename ${conversation.title}`}
                                    title="Rename conversation"
                                    className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#657468] opacity-100 transition hover:bg-[#EAF0E6] hover:text-[#17472D] disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100"
                                  >
                                    <Pencil size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteConversation(conversation)}
                                    disabled={
                                      deletingConversationId === conversation.id ||
                                      isSending ||
                                      isSavingTitle
                                    }
                                    aria-label={`Delete ${conversation.title}`}
                                    title="Delete conversation"
                                    className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#9A6258] opacity-100 transition hover:bg-[#FBEDEC] hover:text-red-700 disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100"
                                  >
                                    {deletingConversationId === conversation.id ? (
                                      <LoaderCircle size={16} className="animate-spin" />
                                    ) : (
                                      <Trash2 size={16} />
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Language selection */}
            <section className="rounded-2xl border border-[#E0E5DA] bg-white p-5">
              <div className="flex items-center gap-2">
                <Languages size={19} />
                <h2 className="font-bold">{t.language}</h2>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="answer-language"
                  className="mb-2 block text-sm text-[#657468]"
                >
                  {t.languagePrompt}
                </label>

                <select
                  id="answer-language"
                  value={language}
                  onChange={(event) =>
                    changeLanguage(event.target.value as Language)
                  }
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

            {/* Trusted resources */}
            <section className="rounded-2xl border border-[#E0E5DA] bg-white p-5">
              <div className="flex items-center gap-2">
                <BookOpen size={19} />
                <h2 className="font-bold">{t.sources}</h2>
              </div>

              <p className="mt-3 text-sm leading-6 text-[#657468]">
                {t.sourceDescription}
              </p>

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
                  CSIR Ghana
                  <ExternalLink size={15} className="shrink-0" />
                </a>

                <a
                  href="https://www.fao.org/ghana/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-2 text-[#17472D] hover:underline"
                >
                  FAO Ghana
                  <ExternalLink size={15} className="shrink-0" />
                </a>
              </div>
            </section>
          </aside>
        )}

        {/* Main chat area */}
        <section className="flex min-h-[750px] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#E0E5DA] bg-white shadow-sm">
          <div className="border-b border-[#E8ECE4] px-5 py-6 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#987526]">
                  {t.label}
                </p>

                <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                  {t.title}
                </h2>
              </div>

              {activeConversationId && (
                <span className="rounded-full bg-[#EAF0E6] px-3 py-2 text-xs font-semibold text-[#17472D]">
                  Saved conversation
                </span>
              )}
            </div>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#657468] sm:text-base">
              {t.description}
            </p>
          </div>

          <div className="flex flex-1 flex-col px-5 py-8 sm:px-8">
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
              {isOpeningConversation ? (
                <div className="flex flex-1 items-center justify-center gap-3 text-sm text-[#657468]">
                  <LoaderCircle size={20} className="animate-spin" />
                  Opening conversation...
                </div>
              ) : messages.length === 0 ? (
                <div className="my-auto">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF0E6]">
                    <MessageCircle size={28} className="text-[#17472D]" />
                  </div>

                  <h3 className="mt-5 text-center text-xl font-bold">
                    {t.welcome}
                  </h3>

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
                  <div className="flex flex-wrap justify-end gap-2 print:hidden">
                    <button type="button" onClick={exportConversationText} className="inline-flex items-center gap-2 rounded-lg border border-[#D8DFD4] px-3 py-2 text-xs font-semibold text-[#17472D] hover:bg-[#F8FAF5]"><FileText size={15} /> Export TXT</button>
                    <button type="button" onClick={printConversation} className="inline-flex items-center gap-2 rounded-lg border border-[#D8DFD4] px-3 py-2 text-xs font-semibold text-[#17472D] hover:bg-[#F8FAF5]"><Printer size={15} /> Print / Save PDF</button>
                  </div>
                  {messages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
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
                        {message.image && (
                          <div className="mt-3 space-y-2">
                            <img src={message.image.url} alt={message.image.filename || "Agricultural image"} className="max-h-72 w-full rounded-xl object-contain" />
                            {message.image.id !== "local-preview" && (
                              <a href={message.image.url} download={message.image.filename} className="inline-flex items-center gap-2 text-xs font-semibold underline">
                                <Download size={14} /> Download image
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isSending && (
                    <div
                      role="status"
                      className="flex items-center gap-2 rounded-xl bg-[#F8FAF5] p-4 text-sm text-[#657468]"
                    >
                      <LoaderCircle size={17} className="animate-spin" />
                      {t.thinking}
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}

              {notice && (
                <div className="mt-5 space-y-3">
                  <p
                    role="alert"
                    className="rounded-lg border border-[#E9D8A9] bg-[#FFF9E9] p-3 text-sm leading-6 text-[#72551A]"
                  >
                    {notice}
                  </p>

                  {activeConversationId &&
                    messages[messages.length - 1]?.role === "user" && (
                      <button
                        type="button"
                        onClick={retryLastAnswer}
                        disabled={isSending || isOpeningConversation}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#17472D] px-4 py-2.5 text-sm font-semibold text-[#17472D] transition hover:bg-[#F0F5EC] disabled:opacity-50"
                      >
                        {isSending ? (
                          <LoaderCircle size={16} className="animate-spin" />
                        ) : (
                          <RefreshCw size={16} />
                        )}
                        Retry answer
                      </button>
                    )}
                </div>
              )}
            </div>

            {/* Question composer */}
            <div className="mx-auto mt-10 w-full max-w-3xl">
              <form onSubmit={handleSubmit}>
                <label htmlFor="agri-question" className="sr-only">
                  {t.placeholder}
                </label>

                {selectedImagePreview && (
                  <div className="mb-3 flex items-center gap-3 rounded-xl border border-[#D8DFD4] bg-[#F8FAF5] p-3">
                    <img src={selectedImagePreview} alt="Selected crop preview" className="h-16 w-16 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{selectedImage?.name}</p><p className="text-xs text-[#788478]">Ready to send for analysis</p></div>
                    <button type="button" onClick={() => { setSelectedImage(null); setSelectedImagePreview(null); if (imageInputRef.current) imageInputRef.current.value = ""; }} aria-label="Remove selected image" className="rounded-lg p-2 text-[#657468] hover:bg-white"><XCircle size={18} /></button>
                  </div>
                )}
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
                    disabled={isSending || isOpeningConversation}
                    className="max-h-36 min-h-12 flex-1 resize-y bg-transparent px-2 py-2 text-sm outline-none disabled:opacity-60"
                  />

                  <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => handleImageSelection(event.target.files?.[0])} />
                  <button type="button" onClick={() => imageInputRef.current?.click()} disabled={isSending || isOpeningConversation} aria-label="Attach crop image" title="Upload crop image" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#D8DFD4] text-[#17472D] hover:bg-[#F0F5EC] disabled:opacity-40"><ImagePlus size={20} /></button>
                  <button
                    type="submit"
                    disabled={
                      (!question.trim() && !selectedImage) || isSending || isOpeningConversation
                    }
                    aria-label={t.send}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#17472D] text-white transition hover:bg-[#103620] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isSending ? (
                      <LoaderCircle size={20} className="animate-spin" />
                    ) : (
                      <ArrowUp size={21} />
                    )}
                  </button>
                </div>
              </form>

              <p className="mt-2 text-center text-xs leading-5 text-[#788478]">JPG, PNG, or WebP · Maximum 8 MB. Include a question for better crop diagnosis.</p>
              <p className="mt-3 text-center text-xs leading-5 text-[#788478]">
                {t.note}
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer className="border-t border-[#E0E5DA] bg-white px-5 py-5">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 text-xs text-[#657468]">
          <span>{t.footer}</span>
          <span>AgriGuide AI</span>
        </div>
      </footer>
    </main>
  );
}

