import { NextRequest, NextResponse } from "next/server";
import { languageCodes } from "@/lib/languages";
import { getOpenAIClient } from "@/lib/openai";
import {
  isPracticeLevel,
  isValidExercise,
  type PracticeExercise
} from "@/lib/practiceTypes";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 12;
const MIN_COUNT = 3;
const MAX_COUNT = 10;
const DEFAULT_COUNT = 5;

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

type GenerateBody = {
  languageCode: string;
  level: string;
  count?: number;
};

const levelGuidance: Record<string, string> = {
  beginner: "A1–A2: very short sentences, basic vocabulary, common phrases.",
  intermediate: "B1–B2: everyday topics, some compound sentences, wider vocabulary.",
  advanced: "C1-ish: nuanced wording, idioms sparingly, longer prompts."
};

export async function POST(request: NextRequest) {
  const ipKey = request.headers.get("x-forwarded-for") ?? "local";
  if (!checkRateLimit(ipKey)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait and retry." },
      { status: 429 }
    );
  }

  let body: GenerateBody;
  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const allowed = practiceLanguageCodes();
  const languageCode = body.languageCode?.trim();
  const level = body.level?.trim().toLowerCase();
  const count = Math.min(
    MAX_COUNT,
    Math.max(MIN_COUNT, Number(body.count) || DEFAULT_COUNT)
  );

  if (!languageCode || !allowed.has(languageCode)) {
    return NextResponse.json({ error: "Invalid practice language." }, { status: 400 });
  }
  if (!level || !isPracticeLevel(level)) {
    return NextResponse.json(
      { error: "Invalid level. Use beginner, intermediate, or advanced." },
      { status: 400 }
    );
  }

  const systemPrompt = `You output ONLY valid JSON: an array of exactly ${count} objects. No markdown, no prose outside JSON.
Each object is one of three shapes (vary types across the batch):
1) {"type":"mcq","prompt":"...","choices":["a","b","c","d"],"answerIndex":0,"explanation":"..."}
   - prompt asks about the TARGET language (${languageCode}). Use English for instructions unless the exercise is "translate this word".
   - exactly 4 choices, answerIndex 0-3.
2) {"type":"gap","sentence":"... ___ ...","answer":"one word or short phrase","explanation":"..."}
   - sentence must contain ___ exactly once as the blank. Target language content around the blank.
3) {"type":"build","instruction":"Build this sentence in the target language.","tokens":["word1","word2",...],"solution":"correct full sentence","explanation":"optional short hint"}
   - tokens: 4-8 words in RANDOM order (shuffle), all needed for solution; solution is the correct sentence in target language.

Difficulty: ${levelGuidance[level] ?? levelGuidance.beginner}
Target language code: ${languageCode}.`;

  try {
    const client = getOpenAIClient();
    const response = await client.responses.create({
      model: "gpt-4.1-nano",
      temperature: 0.4,
      input: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Generate the JSON array now for level ${level} and language ${languageCode}.`
        }
      ]
    });

    const raw = response.output_text?.trim();
    if (!raw) {
      return NextResponse.json(
        { error: "Model returned empty output." },
        { status: 502 }
      );
    }

    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const start = cleaned.indexOf("[");
      const end = cleaned.lastIndexOf("]");
      if (start >= 0 && end > start) {
        parsed = JSON.parse(cleaned.slice(start, end + 1));
      } else {
        throw new Error("Invalid JSON from model.");
      }
    }

    if (!Array.isArray(parsed)) {
      return NextResponse.json({ error: "Invalid exercise payload shape." }, { status: 502 });
    }

    const exercises: PracticeExercise[] = [];
    for (const item of parsed) {
      if (isValidExercise(item)) {
        exercises.push(item);
      }
    }

    if (exercises.length < MIN_COUNT) {
      return NextResponse.json(
        { error: "Could not parse enough valid exercises. Try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ exercises: exercises.slice(0, count) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected practice generation error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
