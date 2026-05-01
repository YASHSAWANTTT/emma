"use client";

import { useCallback, useMemo, useState } from "react";
import { languageOptions } from "@/lib/languages";
import { practiceLevels, type PracticeExercise, type PracticeLevel } from "@/lib/practiceTypes";
import { PracticeExerciseStep } from "@/components/practice/PracticeExerciseStep";

const STORAGE_KEY = "emma-practice-prefs";

type Prefs = {
  language: string;
  level: PracticeLevel;
  bestStreak: number;
};

function loadPrefs(): Prefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Prefs;
    if (!p.language || !practiceLevels.includes(p.level)) return null;
    return p;
  } catch {
    return null;
  }
}

function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

const levelLabels: Record<PracticeLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced"
};

export function PracticeSession() {
  const practiceLangs = useMemo(
    () => languageOptions.filter((l) => l.code !== "auto"),
    []
  );

  const initial = loadPrefs();

  const [language, setLanguage] = useState(() => initial?.language ?? "es");
  const [level, setLevel] = useState<PracticeLevel>(() => initial?.level ?? "beginner");
  const [bestStreak, setBestStreak] = useState(() => initial?.bestStreak ?? 0);

  const [phase, setPhase] = useState<"pick" | "loading" | "run" | "summary">("pick");
  const [exercises, setExercises] = useState<PracticeExercise[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreakRun, setMaxStreakRun] = useState(0);
  const [error, setError] = useState("");

  const persist = useCallback(
    (next: Partial<Prefs>) => {
      const merged: Prefs = {
        language: next.language ?? language,
        level: next.level ?? level,
        bestStreak: next.bestStreak ?? bestStreak
      };
      savePrefs(merged);
    },
    [language, level, bestStreak]
  );

  const current = exercises[index];

  async function startSession() {
    setError("");
    setPhase("loading");
    try {
      const res = await fetch("/api/practice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ languageCode: language, level, count: 5 })
      });
      const data = (await res.json()) as { exercises?: PracticeExercise[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to generate lesson.");
      if (!data.exercises?.length) throw new Error("No exercises returned.");
      setExercises(data.exercises);
      setIndex(0);
      setScore(0);
      setStreak(0);
      setMaxStreakRun(0);
      setPhase("run");
      persist({ language, level });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("pick");
    }
  }

  function recordCorrect() {
    setScore((s) => s + 1);
    setStreak((st) => {
      const next = st + 1;
      setMaxStreakRun((m) => Math.max(m, next));
      if (next > bestStreak) {
        setBestStreak(next);
        persist({ bestStreak: next });
      }
      return next;
    });
  }

  function recordWrong() {
    setStreak(0);
  }

  function nextExercise() {
    if (index + 1 >= exercises.length) {
      setPhase("summary");
      return;
    }
    setIndex((i) => i + 1);
  }

  const progress = exercises.length ? (index / exercises.length) * 100 : 0;

  return (
    <main className="pageShell">
      <div className="textureLayer" />
      <section className="translatorCard practiceCard">
        <header className="cardHeader">
          <p className="eyebrow">Interactive lessons</p>
          <h1>Practice</h1>
          <p className="contextLine">
            Duolingo-style drills for the language you choose. Streak: {streak} · Best: {bestStreak}
          </p>
        </header>

        {phase === "pick" && (
          <>
            <div className="languageGrid">
              <label className="fieldLabel">
                Language
                <select
                  className="selectInput"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {practiceLangs.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="fieldLabel">
                Level
                <select
                  className="selectInput"
                  value={level}
                  onChange={(e) => setLevel(e.target.value as PracticeLevel)}
                >
                  {practiceLevels.map((lv) => (
                    <option key={lv} value={lv}>
                      {levelLabels[lv]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {error ? (
              <p className="errorText" role="alert">
                {error}
              </p>
            ) : null}
            <div className="actionRow">
              <button type="button" className="actionButton actionPrimary" onClick={startSession}>
                Start lesson
              </button>
            </div>
          </>
        )}

        {phase === "loading" && <p className="liveStatus">Cooking up your exercises…</p>}

        {phase === "run" && current && (
          <>
            <div className="practiceProgressBar" aria-hidden>
              <div className="practiceProgressFill" style={{ width: `${progress}%` }} />
            </div>
            <p className="practiceMeta">
              {index + 1} / {exercises.length} · Score {score}
            </p>

            <PracticeExerciseStep
              key={index}
              exercise={current}
              onResult={(ok) => (ok ? recordCorrect() : recordWrong())}
              onContinue={nextExercise}
            />
          </>
        )}

        {phase === "summary" && (
          <div className="practiceSummary">
            <h2 className="practiceSummaryTitle">Lesson complete</h2>
            <p className="practiceSummaryScore">
              You got {score} / {exercises.length} correct.
            </p>
            <p className="practiceSummaryScore">Best streak this run: {maxStreakRun}</p>
            <div className="actionRow">
              <button
                type="button"
                className="actionButton actionPrimary"
                onClick={() => {
                  setPhase("pick");
                  setExercises([]);
                }}
              >
                New lesson
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
