"use client";

import { useState } from "react";
import type { PracticeExercise } from "@/lib/practiceTypes";
import { usePracticeAudio } from "@/hooks/usePracticeAudio";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ExerciseHeader({
  context,
  listenText,
  languageCode
}: {
  context: string;
  listenText: string;
  languageCode: string;
}) {
  const { play, loading, error, stop } = usePracticeAudio(languageCode);

  return (
    <div className="practiceExerciseHeader">
      <p className="practiceContext">{context}</p>
      <div className="practiceListenRow">
        <button
          type="button"
          className="actionButton actionGhost practicePlayBtn"
          onClick={() => play(listenText)}
          disabled={loading}
        >
          {loading ? "Loading…" : "Play sentence"}
        </button>
        <button type="button" className="actionButton actionGhost" onClick={stop}>
          Stop
        </button>
      </div>
      {error ? (
        <p className="practiceAudioError" role="status">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type Props = {
  exercise: PracticeExercise;
  languageCode: string;
  onResult: (correct: boolean) => void;
  onContinue: () => void;
};

export function PracticeExerciseStep({ exercise, languageCode, onResult, onContinue }: Props) {
  const [mcqPick, setMcqPick] = useState<number | null>(null);
  const [gapInput, setGapInput] = useState("");
  const [buildOrder, setBuildOrder] = useState<string[]>([]);
  const [buildPool, setBuildPool] = useState<string[]>(() =>
    exercise.type === "build" ? shuffle(exercise.tokens) : []
  );
  const [pendingLeft, setPendingLeft] = useState<number | null>(null);
  const [assignment, setAssignment] = useState<Record<number, number>>({});
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

  const checkMatch = (ex: Extract<PracticeExercise, { type: "match" }>) => {
    setRevealed(true);
    let ok = true;
    for (let i = 0; i < ex.left.length; i++) {
      if (assignment[i] !== ex.match[i]) {
        ok = false;
        break;
      }
    }
    if (Object.keys(assignment).length !== ex.left.length) ok = false;
    if (!reported) {
      onResult(ok);
      setReported(true);
    }
  };

  const appendWordBank = (word: string) => {
    setGapInput((prev) => (prev ? `${prev.trim()} ${word}` : word));
  };

  if (exercise.type === "mcq") {
    return (
      <div className="practiceExercise">
        <ExerciseHeader
          context={exercise.context}
          listenText={exercise.listenText}
          languageCode={languageCode}
        />
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
    const bank = exercise.wordBank;
    return (
      <div className="practiceExercise">
        <ExerciseHeader
          context={exercise.context}
          listenText={exercise.listenText}
          languageCode={languageCode}
        />
        <p className="practicePrompt practiceGapSentence">
          {exercise.sentence.split("___").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 ? <span className="practiceBlank"> ___ </span> : null}
            </span>
          ))}
        </p>
        {bank && bank.length ? (
          <>
            <p className="practiceSub">Tap a block to add it to your answer</p>
            <div className="practiceChipRow">
              {bank.map((w, i) => (
                <button
                  key={`${w}-${i}`}
                  type="button"
                  className="practiceChip"
                  disabled={revealed}
                  onClick={() => appendWordBank(w)}
                >
                  {w}
                </button>
              ))}
            </div>
          </>
        ) : null}
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

  if (exercise.type === "match") {
    const ex = exercise;
    const n = ex.left.length;
    const assignedRights = new Set(Object.values(assignment));

    return (
      <div className="practiceExercise">
        <ExerciseHeader context={ex.context} listenText={ex.listenText} languageCode={languageCode} />
        <p className="practiceSub">Tap one item on the left, then its match on the right.</p>
        <div className="practiceMatchGrid">
          <div className="practiceMatchCol">
            {ex.left.map((label, i) => {
              const isPaired = assignment[i] !== undefined;
              const isPending = pendingLeft === i;
              return (
                <button
                  key={i}
                  type="button"
                  className={
                    revealed
                      ? assignment[i] === ex.match[i]
                        ? "practiceMatchCell practiceMatchOk"
                        : "practiceMatchCell practiceMatchBad"
                      : isPaired
                        ? "practiceMatchCell practiceMatchPaired"
                        : isPending
                          ? "practiceMatchCell practiceMatchPending"
                          : "practiceMatchCell"
                  }
                  disabled={revealed}
                  onClick={() => setPendingLeft((p) => (p === i ? null : i))}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="practiceMatchCol">
            {ex.right.map((label, j) => {
              const takenBy = Object.entries(assignment).find(([, r]) => r === j)?.[0];
              const isPaired = takenBy !== undefined;
              return (
                <button
                  key={j}
                  type="button"
                  className={
                    revealed && takenBy !== undefined
                      ? assignment[Number(takenBy)] === ex.match[Number(takenBy)]
                        ? "practiceMatchCell practiceMatchOk"
                        : "practiceMatchCell practiceMatchBad"
                      : isPaired
                        ? "practiceMatchCell practiceMatchPaired"
                        : "practiceMatchCell"
                  }
                  disabled={revealed}
                  onClick={() => {
                    if (pendingLeft === null) return;
                    setAssignment((prev) => {
                      const next = { ...prev };
                      const usedLeft = Object.entries(next).find(([, r]) => r === j)?.[0];
                      if (usedLeft !== undefined) delete next[Number(usedLeft)];
                      next[pendingLeft] = j;
                      return next;
                    });
                    setPendingLeft(null);
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        {!revealed ? (
          <button
            type="button"
            className="actionButton actionGhost"
            onClick={() => {
              setAssignment({});
              setPendingLeft(null);
            }}
          >
            Clear pairs
          </button>
        ) : null}
        {revealed ? (
          <p className="practiceExplain">
            {Object.keys(assignment).length === n
              ? "Review your pairs above."
              : "Incomplete matching."}
          </p>
        ) : null}
        <div className="actionRow">
          <button
            type="button"
            className="actionButton actionPrimary"
            disabled={Object.keys(assignment).length !== n || revealed}
            onClick={() => checkMatch(ex)}
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
      <ExerciseHeader
        context={buildEx.context}
        listenText={buildEx.listenText}
        languageCode={languageCode}
      />
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
