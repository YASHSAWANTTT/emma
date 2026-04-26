import { NextRequest, NextResponse } from "next/server";
import { languageCodes } from "@/lib/languages";
import { getOpenAIClient } from "@/lib/openai";

const MAX_TEXT_LENGTH = 1200;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 25;

const requestLog = new Map<string, number[]>();

type TranslateRequest = {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
};

function isValidLanguageCode(code: string): boolean {
  return languageCodes.has(code);
}

function checkRateLimit(ipKey: string): boolean {
  const now = Date.now();
  const existing = requestLog.get(ipKey) ?? [];
  const recent = existing.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  requestLog.set(ipKey, recent);
  return recent.length <= RATE_LIMIT_MAX_REQUESTS;
}

export async function POST(request: NextRequest) {
  const ipKey = request.headers.get("x-forwarded-for") ?? "local";
  if (!checkRateLimit(ipKey)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait and retry." },
      { status: 429 }
    );
  }

  let body: TranslateRequest;
  try {
    body = (await request.json()) as TranslateRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const text = body.text?.trim();
  const sourceLanguage = body.sourceLanguage;
  const targetLanguage = body.targetLanguage;

  if (!text) {
    return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `Text must be ${MAX_TEXT_LENGTH} characters or less.` },
      { status: 400 }
    );
  }
  if (!isValidLanguageCode(sourceLanguage) || !isValidLanguageCode(targetLanguage)) {
    return NextResponse.json({ error: "Invalid language selection." }, { status: 400 });
  }
  if (targetLanguage === "auto") {
    return NextResponse.json(
      { error: "Target language cannot be auto detect." },
      { status: 400 }
    );
  }

  try {
    const client = getOpenAIClient();
    const sourceLabel =
      sourceLanguage === "auto" ? "auto-detected language" : sourceLanguage;

    const response = await client.responses.create({
      model: "gpt-4.1-nano",
      temperature: 0,
      input: [
        {
          role: "system",
          content:
            "You are a translation engine. Return only translated text, no extra commentary."
        },
        {
          role: "user",
          content: `Translate the following text from ${sourceLabel} to ${targetLanguage}:\n\n${text}`
        }
      ]
    });

    const translatedText = response.output_text?.trim();

    if (!translatedText) {
      return NextResponse.json(
        { error: "Translation model returned empty output." },
        { status: 502 }
      );
    }

    return NextResponse.json({ translatedText });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected translation error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
