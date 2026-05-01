"use client";

import { useState } from "react";
import type { PracticeExercise } from "@/lib/practiceTypes";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Props = {
  exercise: PracticeExercise;
  onResult: (correct: boolean) => void;
  onContinue: () => void;
};

export function PracticeExerciseStep({ exercise, onResult, onContinue }: Props) {
  const [mcqPick, setMcqPick] = useState<number | null>(null);
  const [gapInput, setGapInput] = useState("");
  const [buildOrder, setBuildOrder] = useState<string[]>([]);
  const [buildPool, setBuildPool] = useState<string[]>(() =>
    exercise.type === "build" ? shuffle(exercise.tokens) : []
  );
  const [revealed, setRevealed] = useState(false);
  const [reported, setReported] = useState(false);

  const checkMcq = (ex: Extract<PracticeExercise, { type: "mcq" }>) => {
    if (mcqPick === null) return;
    setRevealed(true);
    const ok = mcqPick === ex.answerIndex;
    if (!reported) {
      onResult(ok);
      setReported(true);
    }
  };

  const checkGap = (ex: Extract<PracticeExercise, { type: "gap" }>) => {
    setRevealed(true);
    const ok = gapInput.trim().toLowerCase() === ex.answer.trim().toLowerCase();
    if (!reported) {
      onResult(ok);
      setReported(true);
    }
  };

  const checkBuild = (ex: Extract<PracticeExercise, { type: "build" }>) => {
    setRevealed(true);
    const built = buildOrder.join(" ").trim().toLowerCase();
    const sol = ex.solution.trim().toLowerCase();
    const ok = built === sol;
    if (!reported) {
      onResult(ok);
      setReported(true);
    }
  };

  if (exercise.type === "mcq") {
    return (
      <div className="practiceExercise">
        <p className="practicePrompt">{exercise.prompt}</p>
        <div className="practiceChoices">
          {exercise.choices.map((c, i) => (
            <button
              key={i}
              type="button"
              className={
                revealed
                  ? i === exercise.answerIndex
                    ? "practiceChoice practiceChoiceCorrect"
                    : i === mcqPick
                      ? "practiceChoice practiceChoiceWrong"
                      : "practiceChoice"
                  : mcqPick === i
                    ? "practiceChoice practiceChoiceSelected"
                    : "practiceChoice"
              }
              disabled={revealed}
              onClick={() => setMcqPick(i)}
            >
              {c}
            </button>
          ))}
        </div>
        {revealed ? <p className="practiceExplain">{exercise.explanation}</p> : null}
        <div className="actionRow">
          <button
            type="button"
            className="actionButton actionPrimary"
            disabled={mcqPick === null || revealed}
            onClick={() => checkMcq(exercise)}
          >
            Check
          </button>
          {revealed ? (
            <button type="button" className="actionButton actionGhost" onClick={onContinue}>
              Next
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (exercise.type === "gap") {
    return (
      <div className="practiceExercise">
        <p className="practicePrompt practiceGapSentence">
          {exercise.sentence.split("___").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 ? <span className="practiceBlank"> ___ </span> : null}
            </span>
          ))}
        </p>
        <label className="fieldLabel sectionLabel" htmlFor="gap-ans">
          Your answer
        </label>
        <input
          id="gap-ans"
          className="practiceInput"
          value={gapInput}
          disabled={revealed}
          onChange={(e) => setGapInput(e.target.value)}
          placeholder="Fill the blank"
        />
        {revealed ? (
          <p className="practiceExplain">
            {exercise.explanation} (Answer: {exercise.answer})
          </p>
        ) : null}
        <div className="actionRow">
          <button
            type="button"
            className="actionButton actionPrimary"
            disabled={!gapInput.trim() || revealed}
            onClick={() => checkGap(exercise)}
          >
            Check
          </button>
          {revealed ? (
            <button type="button" className="actionButton actionGhost" onClick={onContinue}>
              Next
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  const buildEx = exercise;

  return (
    <div className="practiceExercise">
      <p className="practicePrompt">{buildEx.instruction}</p>
      <p className="practiceSub">Tap words in order. Your sentence:</p>
      <div className="practiceBuildSentence">
        {buildOrder.length ? buildOrder.join(" ") : "—"}
      </div>
      <div className="practiceChipRow">
        {buildPool.map((w, i) => (
          <button
            key={`${w}-${i}`}
            type="button"
            className="practiceChip"
            disabled={revealed}
            onClick={() => {
              setBuildPool((p) => p.filter((_, j) => j !== i));
              setBuildOrder((o) => [...o, w]);
            }}
          >
            {w}
          </button>
        ))}
      </div>
      {!revealed ? (
        <button
          type="button"
          className="actionButton actionGhost"
          onClick={() => {
            setBuildPool((p) => [...p, ...buildOrder]);
            setBuildOrder([]);
          }}
        >
          Clear sentence
        </button>
      ) : null}
      {revealed ? (
        <p className="practiceExplain">
          {buildEx.explanation?.trim() ? buildEx.explanation : `Solution: ${buildEx.solution}`}
        </p>
      ) : null}
      <div className="actionRow">
        <button
          type="button"
          className="actionButton actionPrimary"
          disabled={buildOrder.length === 0 || revealed}
          onClick={() => checkBuild(buildEx)}
        >
          Check
        </button>
        {revealed ? (
          <button type="button" className="actionButton actionGhost" onClick={onContinue}>
            Next
          </button>
        ) : null}
      </div>
    </div>
  );
}
