export const practiceLevels = ["beginner", "intermediate", "advanced"] as const;
export type PracticeLevel = (typeof practiceLevels)[number];

export function isPracticeLevel(value: string): value is PracticeLevel {
  return practiceLevels.includes(value as PracticeLevel);
}

export type McqExercise = {
  type: "mcq";
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
};

export type GapExercise = {
  type: "gap";
  sentence: string;
  answer: string;
  explanation: string;
};

export type BuildExercise = {
  type: "build";
  instruction: string;
  tokens: string[];
  solution: string;
  explanation?: string;
};

export type PracticeExercise = McqExercise | GapExercise | BuildExercise;

export function isValidExercise(raw: unknown): raw is PracticeExercise {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as Record<string, unknown>;
  const t = o.type;
  if (t === "mcq") {
    return (
      typeof o.prompt === "string" &&
      Array.isArray(o.choices) &&
      o.choices.length >= 2 &&
      o.choices.every((c) => typeof c === "string") &&
      typeof o.answerIndex === "number" &&
      o.answerIndex >= 0 &&
      o.answerIndex < o.choices.length &&
      typeof o.explanation === "string"
    );
  }
  if (t === "gap") {
    return (
      typeof o.sentence === "string" &&
      o.sentence.includes("___") &&
      typeof o.answer === "string" &&
      typeof o.explanation === "string"
    );
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
  return false;
}
