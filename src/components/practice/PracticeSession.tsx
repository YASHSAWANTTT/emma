"use client";

import { useCallback, useMemo, useSyncExternalStore, useState } from "react";
import { languageOptions } from "@/lib/languages";
import { type PracticeExercise } from "@/lib/practiceTypes";
import { PracticeExerciseStep } from "@/components/practice/PracticeExerciseStep";
import { PracticeRoadmap } from "@/components/practice/PracticeRoadmap";
import {
  getStableRoadmapProgress,
  markLessonComplete,
  subscribeRoadmapProgress,
  type RoadmapNode
} from "@/lib/practiceRoadmap";

const serverRoadmapSnapshot = { unlockedIndex: 0, completedIds: [] as string[] };

const STORAGE_KEY = "emma-practice-prefs";

type Prefs = {
  language: string;
  bestStreak: number;
};

function loadPrefs(): Prefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<Prefs>;
    if (typeof p.language !== "string" || !p.language) return null;
    return {
      language: p.language,
      bestStreak: typeof p.bestStreak === "number" ? p.bestStreak : 0
    };
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

export function PracticeSession() {
  const practiceLangs = useMemo(
    () => languageOptions.filter((l) => l.code !== "auto"),
    []
  );

  const initial = loadPrefs();
  const initialLang = initial?.language ?? "es";

  const [language, setLanguage] = useState(initialLang);
  const [bestStreak, setBestStreak] = useState(() => initial?.bestStreak ?? 0);
  const roadmapProgress = useSyncExternalStore(
    subscribeRoadmapProgress,
    () => getStableRoadmapProgress(language),
    () => serverRoadmapSnapshot
  );

  const [phase, setPhase] = useState<"roadmap" | "loading" | "run" | "summary">("roadmap");
  const [activeLesson, setActiveLesson] = useState<{ node: RoadmapNode; index: number } | null>(
    null
  );
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
        bestStreak: next.bestStreak ?? bestStreak
      };
      savePrefs(merged);
    },
    [language, bestStreak]
  );

  const current = exercises[index];

  async function startLesson(node: RoadmapNode, nodeIndex: number) {
    setError("");
    setPhase("loading");
    setActiveLesson({ node, index: nodeIndex });
    try {
      const res = await fetch("/api/practice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          languageCode: language,
          level: node.level,
          count: 6,
          lessonKey: node.id,
          nodeIndex
        })
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
      persist({ language });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("roadmap");
      setActiveLesson(null);
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
      if (activeLesson) {
        markLessonComplete(language, activeLesson.node.id, activeLesson.index);
      }
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
            Follow the path lesson by lesson. Streak: {streak} · Best: {bestStreak}
          </p>
        </header>

        {phase === "roadmap" && (
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
            </div>
            {error ? (
              <p className="errorText" role="alert">
                {error}
              </p>
            ) : null}
            <PracticeRoadmap
              progress={roadmapProgress}
              onSelectNode={(node, nodeIndex) => {
                void startLesson(node, nodeIndex);
              }}
            />
          </>
        )}

        {phase === "loading" && <p className="liveStatus">Cooking up your exercises…</p>}

        {phase === "run" && current && (
          <>
            <div className="practiceProgressBar" aria-hidden>
              <div className="practiceProgressFill" style={{ width: `${progress}%` }} />
            </div>
            <p className="practiceMeta">
              {activeLesson ? (
                <>
                  {activeLesson.node.title} · {index + 1} / {exercises.length} · Score {score}
                </>
              ) : (
                <>
                  {index + 1} / {exercises.length} · Score {score}
                </>
              )}
            </p>

            <PracticeExerciseStep
              key={index}
              exercise={current}
              languageCode={language}
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
                  setPhase("roadmap");
                  setExercises([]);
                  setActiveLesson(null);
                }}
              >
                Back to roadmap
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
