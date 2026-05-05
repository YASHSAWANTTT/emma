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
const DEFAULT_COUNT = 6;

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
  lessonKey?: string;
  nodeIndex?: number;
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
  const lessonKey = body.lessonKey?.trim() ?? "";
  const nodeIndex =
    typeof body.nodeIndex === "number" && Number.isFinite(body.nodeIndex)
      ? body.nodeIndex
      : null;

  if (!languageCode || !allowed.has(languageCode)) {
    return NextResponse.json({ error: "Invalid practice language." }, { status: 400 });
  }
  if (!level || !isPracticeLevel(level)) {
    return NextResponse.json(
      { error: "Invalid level. Use beginner, intermediate, or advanced." },
      { status: 400 }
    );
  }

  const lessonHint =
    lessonKey || nodeIndex !== null
      ? `This is roadmap step ${lessonKey || `node-${nodeIndex}`} (node index ${nodeIndex ?? "n/a"}). Vary topics slightly from generic drills.`
    : "";

  const systemPrompt = `You output ONLY valid JSON: an array of exactly ${count} objects. No markdown, no prose outside JSON.

Every object MUST include:
- "context": string (1-3 sentences in English: scenario — what situation, what goal, what sentence they are forming or fixing)
- "listenText": string (a natural phrase or sentence entirely in the TARGET language ${languageCode} for text-to-speech; should match what the learner should hear for this item)

Use exactly FOUR exercise shapes, varied across the batch:

1) MCQ: {"type":"mcq","context":"...","listenText":"...","prompt":"...","choices":["a","b","c","d"],"answerIndex":0,"explanation":"..."}
   - exactly 4 choices; answerIndex 0-3; prompt can mix English instructions with target language where appropriate.

2) GAP (fill blank): {"type":"gap","context":"...","listenText":"...","sentence":"... ___ ...","answer":"word or short phrase","explanation":"...","wordBank": optional array of 4-8 distractor+correct words in random order for tap-to-fill}
   - sentence MUST contain ___ exactly once.

3) BUILD: {"type":"build","context":"...","listenText":"...","instruction":"...","tokens":["..."],"solution":"full sentence in target language","explanation":"optional"}
   - tokens: 4-8 words shuffled, all needed for solution.

4) MATCH: {"type":"match","context":"...","listenText":"...","left":["w1","w2",...],"right":["m1","m2",...],"match":[...]}
   - left and right SAME length n (n 3-5). match is length n: match[i] is the index in right that pairs with left[i]. It MUST be a permutation of 0..n-1 (each right index used once).

Difficulty: ${levelGuidance[level] ?? levelGuidance.beginner}
Target language code: ${languageCode}.
${lessonHint}`;

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
