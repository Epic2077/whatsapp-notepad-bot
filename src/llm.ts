import OpenAI from "openai";
import { config } from "./config";
import { getCategories } from "./categories";

export interface CategorizedNote {
  category: string;
  summary: string;
  details: NoteDetails;
}

export interface NoteDetails {
  need: string | null;
  description: string | null;
  username: string | null;
  phone_number: string | null;
  attributes: Record<string, string | number | boolean | null>;
}

const client = new OpenAI({
  apiKey: config.llmApiKey,
  baseURL: config.llmBaseUrl,
});

function buildSystemPrompt(categories: string[]): string {
  return `You categorize and extract facts from personal notes and forwarded WhatsApp messages.
Reply with ONLY a JSON object in this exact shape:
{"category": "<one of: ${categories.join(", ")}>", "summary": "<3-5 word summary>", "details": {"need": "<what is wanted or offered, or null>", "description": "<concise factual description, or null>", "username": "<person's username, or null>", "phone_number": "<person's phone number, or null>", "attributes": {"<fact name>": "<fact value>"}}}
Extract only facts explicitly present in the message. Use null for unavailable need, description, username, or phone_number. Put domain-specific facts such as brand, model, price, currency, color, year, mileage, location, and condition in attributes. Keep the original value and do not invent details.
No markdown, no explanation.`;
}

async function parseResponse(raw: string): Promise<CategorizedNote> {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
  const parsed = JSON.parse(cleaned) as {
    category?: string;
    summary?: string;
    details?: Partial<NoteDetails>;
  };

  const categories = await getCategories();
  const category = categories.includes(parsed.category ?? "")
    ? (parsed.category as string)
    : "Other";

  return {
    category,
    summary: (parsed.summary ?? "").slice(0, 100) || "Untitled note",
    details: {
      need: parsed.details?.need ?? null,
      description: parsed.details?.description ?? null,
      username: parsed.details?.username ?? null,
      phone_number: parsed.details?.phone_number ?? null,
      attributes: parsed.details?.attributes ?? {},
    },
  };
}

export async function categorizeNote(
  content: string,
): Promise<CategorizedNote> {
  const categories = await getCategories();
  const response = await client.chat.completions.create({
    model: config.llmModel,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildSystemPrompt(categories) },
      { role: "user", content },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("LLM returned an empty response");
  }
  return parseResponse(raw);
}
