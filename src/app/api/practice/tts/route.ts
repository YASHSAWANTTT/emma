import { NextRequest, NextResponse } from "next/server";
import { languageCodes } from "@/lib/languages";
import { getOpenAIClient } from "@/lib/openai";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const MAX_INPUT = 2500;

const requestLog = new Map<string, number[]>();

function practiceLanguageCodes(): Set<string> {
  const s = new Set(languageCodes);
  s.delete("auto");
  return s;
}

function checkRateLimit(ipKey: string): boolean {
  const now = Date.now();
  const existing = requestLog.get(ipKey) ?? [];
  const recent = existing.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  requestLog.set(ipKey, recent);
  return recent.length <= RATE_LIMIT_MAX_REQUESTS;
}

type TtsBody = {
  text: string;
  languageCode: string;
};

export async function POST(request: NextRequest) {
  const ipKey = request.headers.get("x-forwarded-for") ?? "local";
  if (!checkRateLimit(ipKey)) {
    return NextResponse.json(
      { error: "Too many TTS requests. Please wait and retry." },
      { status: 429 }
    );
  }

  let body: TtsBody;
  try {
    body = (await request.json()) as TtsBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const allowed = practiceLanguageCodes();
  const languageCode = body.languageCode?.trim();
  const text = body.text?.trim() ?? "";

  if (!languageCode || !allowed.has(languageCode)) {
    return NextResponse.json({ error: "Invalid language code." }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }
  if (text.length > MAX_INPUT) {
    return NextResponse.json(
      { error: `Text must be ${MAX_INPUT} characters or less.` },
      { status: 400 }
    );
  }

  try {
    const client = getOpenAIClient();
    const speech = await client.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
      response_format: "mp3"
    });

    const buffer = await speech.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "TTS failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
