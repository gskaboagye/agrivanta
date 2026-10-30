
import { getCurrentUser } from "@/lib/auth";
import OpenAI from "openai";
import { NextResponse } from "next/server";

const MAX_QUESTION_LENGTH = 2000;
const MAX_HISTORY_MESSAGES = 8;

const languageNames: Record<string, string> = {
  en: "English",
  fr: "French",
  tw: "Twi (Akan)",
  ee: "Ewe",
  gaa: "Ga",
  fat: "Fante",
  dag: "Dagbani",
  ada: "Dangme (Adangme)",
  nzi: "Nzema",
  dagaa: "Dagaare",
  hau: "Hausa",
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const AGRI_GUIDE_INSTRUCTIONS = `
You are AgriGuide AI, the agricultural learning assistant for AgriVanta.

Your audience includes smallholder farmers, agricultural students, farm
workers, and agricultural businesses, especially in Ghana and West Africa.

Help with crop production, soil health, fertilizer use, crop pests and diseases,
livestock, irrigation, rainfall planning, harvesting, storage, and farm business.

Rules:
- Answer in the exact requested language specified in the system instructions.
- Use clear, practical language and organize longer answers into steps.
- If you are not confident you can communicate accurately in the requested
  language, say so briefly in that language if possible and offer to answer
  in English or Twi.
- Ask follow-up questions when crop, location, season, or symptoms matter.
- Never pretend you checked live weather, market prices, or official alerts
  unless that information was actually supplied.
- Do not invent research, citations, official guidance, or pesticide doses.
- For crop disease questions, explain possible causes rather than claiming
  certainty.
- For pesticide and fertilizer advice, tell users to follow the product label,
  local regulations, protective equipment guidance, and qualified local advice.
- For serious livestock illness, suspected poisoning, or rapidly spreading crop
  damage, recommend contacting a qualified extension officer or veterinarian.
- Educational guidance does not replace advice from a qualified agricultural
  extension officer.
- When French is selected, use clear, natural French suitable for farmers
  and agricultural learners in West Africa.
- When Twi is selected, use natural Akan/Twi phrasing.
`;

export async function POST(request: Request) {
  try {
    // Authentication and role authorization
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to use AgriGuide." },
        { status: 401 }
      );
    }

    if (user.role !== "farmer" && user.role !== "supplier") {
      return NextResponse.json(
        { error: "You do not have permission to use AgriGuide." },
        { status: 403 }
      );
    }

    // Check OpenAI configuration
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "AgriGuide is not configured. Add OPENAI_API_KEY to .env.local and restart the server.",
        },
        { status: 503 }
      );
    }

    let body: {
      question?: unknown;
      language?: unknown;
      history?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body. Please submit your question again." },
        { status: 400 }
      );
    }

    const question =
      typeof body.question === "string" ? body.question.trim() : "";

    const requestedLanguage =
      typeof body.language === "string" ? body.language : "en";

    const language = languageNames[requestedLanguage] ? requestedLanguage : "en";

    if (!question) {
      return NextResponse.json(
        { error: "Please enter a farming question." },
        { status: 400 }
      );
    }

    if (question.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json(
        {
          error: `Your question must be ${MAX_QUESTION_LENGTH} characters or fewer.`,
        },
        { status: 400 }
      );
    }

    const rawHistory = Array.isArray(body.history) ? body.history : [];

    const history: ChatMessage[] = rawHistory
      .slice(-MAX_HISTORY_MESSAGES)
      .filter((message: unknown): message is ChatMessage => {
        if (!message || typeof message !== "object") {
          return false;
        }

        const candidate = message as Partial<ChatMessage>;

        return (
          (candidate.role === "user" || candidate.role === "assistant") &&
          typeof candidate.content === "string"
        );
      })
      .map((message) => ({
        role: message.role,
        content: message.content.slice(0, MAX_QUESTION_LENGTH),
      }));

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: [
        AGRI_GUIDE_INSTRUCTIONS,
        `Respond in ${languageNames[language]}.`,
        language === "tw"
          ? "For Twi, use natural Akan/Twi phrasing."
          : "",
        language === "fr"
          ? "For French, use natural, grammatically correct French and explain agricultural terms clearly."
          : "",
        "Do not switch to English unless the user requests it or you explain that you cannot confidently answer in the selected language.",
      ]
        .filter(Boolean)
        .join("\n"),
      input: [
        ...history.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        {
          role: "user" as const,
          content: question,
        },
      ],
      max_output_tokens: 800,
    });

    const answer = response.output_text?.trim();

    if (!answer) {
      return NextResponse.json(
        {
          error:
            "AgriGuide could not produce an answer. Please try again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error(
      "AgriGuide API error:",
      error instanceof Error ? error.message : "Unknown error"
    );

    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          {
            error:
              "The OpenAI API key was rejected. Check OPENAI_API_KEY and the project's key permissions.",
          },
          { status: 502 }
        );
      }

      if (error.status === 429) {
        return NextResponse.json(
          {
            error:
              "The AI service returned a usage, quota, or rate-limit error. Check your OpenAI API billing and limits.",
          },
          { status: 429 }
        );
      }

      if (error.status === 400 || error.status === 404) {
        return NextResponse.json(
          {
            error:
              "The AI request was rejected. Check the configured model name and API access.",
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(
      {
        error:
          "AgriGuide could not process your question right now. Check the development terminal for details and try again.",
      },
      { status: 500 }
    );
  }
}
