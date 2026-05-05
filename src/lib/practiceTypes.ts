export const practiceLevels = ["beginner", "intermediate", "advanced"] as const;
export type PracticeLevel = (typeof practiceLevels)[number];

export const levelLabels: Record<PracticeLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced"
};

export function isPracticeLevel(value: string): value is PracticeLevel {
  return practiceLevels.includes(value as PracticeLevel);
}

/** Every exercise includes scenario + phrase to play in target language (TTS). */
export type McqExercise = {
  type: "mcq";
  context: string;
  listenText: string;
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
};

export type GapExercise = {
  type: "gap";
  context: string;
  listenText: string;
  sentence: string;
  answer: string;
  explanation: string;
  /** Optional word bank for “blocks” style tap-to-fill */
  wordBank?: string[];
};

export type BuildExercise = {
  type: "build";
  context: string;
  listenText: string;
  instruction: string;
  tokens: string[];
  solution: string;
  explanation?: string;
};

/** match[i] = index in `right` that pairs with left[i]. Same length as left/right; permutation of 0..n-1. */
export type MatchExercise = {
  type: "match";
  context: string;
  listenText: string;
  left: string[];
  right: string[];
  match: number[];
};

export type PracticeExercise = McqExercise | GapExercise | BuildExercise | MatchExercise;

function isPermutationMatch(match: number[], n: number): boolean {
  if (!Array.isArray(match) || match.length !== n) return false;
  const seen = new Set<number>();
  for (const v of match) {
    if (typeof v !== "number" || v < 0 || v >= n || seen.has(v)) return false;
    seen.add(v);
  }
  return seen.size === n;
}

export function isValidExercise(raw: unknown): raw is PracticeExercise {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as Record<string, unknown>;
  const t = o.type;

  if (typeof o.context !== "string" || o.context.length < 1) return false;
  if (typeof o.listenText !== "string" || o.listenText.length < 1) return false;

  if (t === "mcq") {
    return (
      typeof o.prompt === "string" &&
      Array.isArray(o.choices) &&
      o.choices.length === 4 &&
      o.choices.every((c) => typeof c === "string") &&
      typeof o.answerIndex === "number" &&
      o.answerIndex >= 0 &&
      o.answerIndex < 4 &&
      typeof o.explanation === "string"
    );
  }
  if (t === "gap") {
    const ok =
      typeof o.sentence === "string" &&
      o.sentence.includes("___") &&
      typeof o.answer === "string" &&
      typeof o.explanation === "string";
    if (!ok) return false;
    if (o.wordBank !== undefined) {
      if (!Array.isArray(o.wordBank) || o.wordBank.length < 2) return false;
      if (!o.wordBank.every((w) => typeof w === "string")) return false;
    }
    return true;
  }
  if (t === "build") {
    return (
      typeof o.instruction === "string" &&
      Array.isArray(o.tokens) &&
      o.tokens.length >= 2 &&
      o.tokens.every((x) => typeof x === "string") &&
      typeof o.solution === "string"
    );
  }
  if (t === "match") {
    if (!Array.isArray(o.left) || !Array.isArray(o.right) || !Array.isArray(o.match)) return false;
    if (o.left.length < 2 || o.left.length !== o.right.length) return false;
    if (!o.left.every((x) => typeof x === "string")) return false;
    if (!o.right.every((x) => typeof x === "string")) return false;
    return isPermutationMatch(o.match as number[], o.left.length);
  }
  return false;
}
