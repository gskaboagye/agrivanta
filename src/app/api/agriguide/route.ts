import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { ObjectId, GridFSBucket } from "mongodb";

const MAX_QUESTION_LENGTH = 2000;
const MAX_HISTORY_MESSAGES = 8;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const COLLECTION_NAME = "agriguide_conversations";
const IMAGE_BUCKET = "agriguide_images";

const languageNames: Record<string, string> = {
  en: "English",
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

type ImageReference = {
  id: string;
  filename: string;
  contentType: string;
  url: string;
};

type StoredMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  image?: ImageReference;
};

const INSTRUCTIONS = `
You are AgriGuide AI, an agricultural learning assistant serving farmers in Ghana
and across West Africa. Help with crop production, soil health, plant diseases,
pests, livestock, irrigation, harvesting, post-harvest handling, and farm business.

GENERAL RESPONSE RULES
- Respond in the language requested by the user. Use clear, practical language
  suitable for farmers. Explain technical terms in simple words.
- Prioritise safe, affordable, locally practical recommendations. When relevant,
  account for Ghanaian and West African farming conditions, but do not assume the
  user's exact region, crop variety, season, or farm conditions.
- Do not invent local product availability, government programmes, research
  findings, pesticide registrations, prices, or contact details.
- Ask focused follow-up questions when important information is missing. Do not
  withhold basic safe guidance while asking those questions.
- Distinguish what is directly visible or stated from what is only a possibility.
- Educational guidance does not replace advice from a qualified agricultural
  extension officer, plant health specialist, or veterinarian.

IMAGE-BASED CROP, LEAF, FRUIT, OR PEST ASSESSMENT
When the user attaches an agricultural image, use this structure where relevant:

1. POSSIBLE DIAGNOSIS
   - Name the most plausible disease, pest, nutrient issue, or other condition.
   - If the image does not support a reliable identification, say so clearly and
     provide a short list of reasonable possibilities rather than guessing.
   - Never describe a visual assessment as a confirmed laboratory diagnosis.

2. WHAT I CAN SEE
   - Describe only visible signs, such as spots, holes, yellowing, wilting,
     lesions, mould-like growth, discolouration, or insect presence.
   - Do not claim to see details that are unclear, hidden, or outside the image.

3. CONFIDENCE
   - Use High, Moderate, or Low confidence and explain briefly why.
   - Confidence describes the image-based assessment, not a guaranteed diagnosis.
   - Use Low when the image is blurry, distant, poorly lit, incomplete, or lacks
     enough distinguishing symptoms.

4. POSSIBLE CAUSES
   - Explain likely causes and relevant conditions that could contribute.
   - Distinguish infectious causes (fungi, bacteria, viruses, or pests) from
     abiotic causes (water stress, nutrient imbalance, chemical injury, heat,
     or other environmental factors) when the evidence allows.

5. RECOMMENDED ACTIONS
   - Give prioritised steps the farmer can take now, starting with low-risk
     actions such as isolating affected plants when appropriate, removing badly
     affected material safely, improving drainage or watering practices, and
     monitoring nearby plants.
   - Recommend chemical control only when justified. Do not invent pesticide
     names, application rates, mixing instructions, waiting periods, or doses.
     Tell the user to use only products registered and labelled for the crop and
     target problem in their country, and to follow the product label and local
     extension guidance. Mention appropriate protective equipment and pre-harvest
     intervals where relevant; never guess those intervals.
   - Do not recommend mixing pesticides or using household chemicals as remedies.

6. PREVENTION
   - Give practical prevention measures relevant to the likely problem, such as
     field sanitation, crop rotation, resistant varieties, spacing, clean
     planting materials, balanced soil nutrition, irrigation management, and
     pest monitoring, but only where applicable.

7. WHEN TO GET EXPERT HELP
   - Recommend contacting a qualified agricultural extension officer or plant
     health specialist if symptoms spread rapidly, many plants are affected,
     the crop is valuable, the diagnosis is uncertain, or treatment could have
     significant safety or financial consequences.

Ask for useful missing details when they would improve the assessment, such as:
- Crop and variety, if known.
- Location (district or region in Ghana), not a precise home address.
- Plant age or growth stage.
- When symptoms first appeared and whether they are spreading.
- Recent rainfall, watering, fertiliser, or pesticide use.
- Whether the problem affects one plant, a few plants, or the whole field.

Do not force all seven headings into every response. Keep the answer concise when
the issue is simple, and expand the assessment when the image or risk warrants it.
If the attachment is not an agricultural image or cannot be inspected, explain
that limitation and ask the user to describe the issue or upload a clearer image.
`;

function titleFrom(question: string) {
  const cleaned = question.trim().replace(/\s+/g, " ");
  return cleaned.length <= 60
    ? cleaned
    : `${cleaned.slice(0, 57).trim()}...`;
}

function errorResponse(error: string, status: number, id: ObjectId | null) {
  return NextResponse.json(
    {
      error,
      conversationId: id?.toString() ?? null,
      questionSaved: id !== null,
    },
    { status }
  );
}

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    stream.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

export async function POST(request: Request) {
  let conversationId: ObjectId | null = null;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("Please log in to use AgriGuide.", 401, null);
    }

    if (user.role !== "farmer" && user.role !== "supplier") {
      return errorResponse(
        "You do not have permission to use AgriGuide.",
        403,
        null
      );
    }

    const form = await request.formData();
    const question = String(form.get("question") ?? "").trim();
    const languageRaw = String(form.get("language") ?? "en");
    const language = languageNames[languageRaw] ? languageRaw : "en";
    const conversationRaw = form.get("conversationId");
    const imageFile = form.get("image");
    const retryLast = form.get("retryLast") === "true";

    if (
      !retryLast &&
      !question &&
      !(imageFile instanceof File)
    ) {
      return errorResponse(
        "Please enter a question or attach an image.",
        400,
        null
      );
    }

    if (question.length > MAX_QUESTION_LENGTH) {
      return errorResponse(
        `Your question must be ${MAX_QUESTION_LENGTH} characters or fewer.`,
        400,
        null
      );
    }

    if (
      conversationRaw &&
      (typeof conversationRaw !== "string" ||
        !ObjectId.isValid(conversationRaw))
    ) {
      return errorResponse("Invalid conversation ID.", 400, null);
    }

    if (retryLast && !conversationRaw) {
      return errorResponse(
        "A conversation is required to retry an answer.",
        400,
        null
      );
    }

    let imageBuffer: Buffer | null = null;
    let imageType = "";
    let imageName = "";
    let imageRef: ImageReference | undefined;

    if (imageFile instanceof File) {
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(imageFile.type)
      ) {
        return errorResponse(
          "Only JPG, PNG, and WebP images are supported.",
          400,
          null
        );
      }

      if (imageFile.size <= 0 || imageFile.size > MAX_IMAGE_BYTES) {
        return errorResponse(
          "Image must be smaller than 8 MB.",
          413,
          null
        );
      }

      imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      imageType = imageFile.type;
      imageName = imageFile.name.slice(0, 150) || "crop-image";
    }

    const db = await getDatabase();
    const conversations = db.collection(COLLECTION_NAME);
    const bucket = new GridFSBucket(db, { bucketName: IMAGE_BUCKET });
    const now = new Date();

    let history: StoredMessage[] = [];
    let retryImage: ImageReference | undefined;
    let retryMessage: StoredMessage | undefined;
    let title = titleFrom(question || "Crop image analysis");

    if (conversationRaw) {
      conversationId = new ObjectId(conversationRaw as string);

      const conversation = await conversations.findOne({
        _id: conversationId,
        userId: user.id,
      });

      if (!conversation) {
        return errorResponse("Conversation not found.", 404, null);
      }

      title =
        typeof conversation.title === "string"
          ? conversation.title
          : title;

      const existing = Array.isArray(conversation.messages)
        ? (conversation.messages as StoredMessage[])
        : [];

      if (retryLast) {
        const last = existing.at(-1);

        if (!last || last.role !== "user") {
          return errorResponse(
            "There is no unanswered question to retry.",
            400,
            conversationId
          );
        }

        retryMessage = last;
        history = existing.slice(0, -1).slice(-MAX_HISTORY_MESSAGES);
        retryImage = last.image;
      } else {
        history = existing.slice(-MAX_HISTORY_MESSAGES);
      }
    } else if (retryLast) {
      return errorResponse(
        "A conversation is required to retry an answer.",
        400,
        null
      );
    }

    // Save the user's question and image before calling the AI service.
    if (!retryLast) {
      if (imageBuffer) {
        const upload = bucket.openUploadStream(imageName, {
          metadata: {
            userId: user.id,
            uploadedAt: now,
            contentType: imageType,
          },
        });

        const uploadFinished = new Promise<void>((resolve, reject) => {
          upload.on("finish", resolve);
          upload.on("error", reject);
        });

        upload.end(imageBuffer);
        await uploadFinished;

        imageRef = {
          id: upload.id.toString(),
          filename: imageName,
          contentType: imageType,
          url: `/api/agriguide/images/${upload.id.toString()}`,
        };
      }

      const message: StoredMessage = {
        role: "user",
        content: question || "Please analyse this agricultural image.",
        createdAt: now,
        ...(imageRef ? { image: imageRef } : {}),
      };

      if (conversationId) {
        await conversations.updateOne(
          { _id: conversationId, userId: user.id },
          {
            $push: { messages: message } as never,
            $set: { language, updatedAt: now },
          }
        );
      } else {
        const inserted = await conversations.insertOne({
          userId: user.id,
          title,
          language,
          messages: [message],
          createdAt: now,
          updatedAt: now,
        });

        conversationId = inserted.insertedId;
      }
    } // This closing brace was missing in the user's pasted file.

    if (!process.env.OPENAI_API_KEY) {
      return errorResponse(
        "Your question has been saved, but AgriGuide AI is not configured yet. You can retry when the AI service is available.",
        503,
        conversationId
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const input: Array<{
      role: "user" | "assistant";
      content: string | Array<Record<string, unknown>>;
    }> = history.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const currentContent: Array<Record<string, unknown>> = [
      {
        type: "input_text",
        text: retryLast
          ? retryMessage?.content ?? "Please analyse this agricultural image."
          : question || "Please analyse this agricultural image.",
      },
    ];

    const visionReference = retryLast ? retryImage : imageRef;

    if (visionReference?.id && ObjectId.isValid(visionReference.id)) {
      const fileId = new ObjectId(visionReference.id);
      const files = await bucket
        .find({ _id: fileId, "metadata.userId": user.id })
        .toArray();

      if (!files.length) {
        return errorResponse(
          "The attached image could not be found. Please upload it again.",
          404,
          conversationId
        );
      }

      const buffer = await streamToBuffer(bucket.openDownloadStream(fileId));
      const mime =
        files[0].metadata?.contentType || visionReference.contentType;

      currentContent.push({
        type: "input_image",
        image_url: `data:${mime};base64,${buffer.toString("base64")}`,
      });
    }

    input.push({ role: "user", content: currentContent });

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: `${INSTRUCTIONS}\nRespond in ${languageNames[language]}.`,
      input: input as never,
      max_output_tokens: 1000,
    });

    const answer = response.output_text?.trim();

    if (!answer) {
      return errorResponse(
        "Your question has been saved, but AgriGuide could not produce an answer. Please try again.",
        502,
        conversationId
      );
    }

    if (!conversationId) {
      throw new Error("Conversation ID was not created.");
    }

    await conversations.updateOne(
      { _id: conversationId, userId: user.id },
      {
        $push: {
          messages: {
            role: "assistant",
            content: answer,
            createdAt: new Date(),
          },
        } as never,
        $set: { updatedAt: new Date() },
      }
    );

    return NextResponse.json({
      answer,
      conversationId: conversationId.toString(),
      title,
      image: imageRef ?? null,
      questionSaved: true,
    });
  } catch (error) {
    console.error(
      "AgriGuide API error:",
      error instanceof Error ? error.message : "Unknown error"
    );

    if (error instanceof OpenAI.APIError && error.status === 401) {
      return errorResponse(
        "Your question has been saved, but the OpenAI API key was rejected. Check your API key and project permissions.",
        502,
        conversationId
      );
    }

    if (error instanceof OpenAI.APIError && error.status === 429) {
      return errorResponse(
        "Your question has been saved, but the AI service returned a usage, quota, or rate-limit error. You can retry when your API billing and limits are ready.",
        429,
        conversationId
      );
    }

    return errorResponse(
      "Your question has been saved, but AgriGuide could not process it right now. Please try again later.",
      500,
      conversationId
    );
  }
}
