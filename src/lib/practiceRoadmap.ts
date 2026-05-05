import type { PracticeLevel } from "@/lib/practiceTypes";

export type RoadmapNode = {
  id: string;
  title: string;
  level: PracticeLevel;
};

/** Linear Duolingo-style path: difficulty ramps through three bands. */
export const PRACTICE_ROADMAP: RoadmapNode[] = [
  { id: "r0", title: "Warm up", level: "beginner" },
  { id: "r1", title: "Core phrases", level: "beginner" },
  { id: "r2", title: "Quick quiz", level: "beginner" },
  { id: "r3", title: "Step up", level: "intermediate" },
  { id: "r4", title: "Real situations", level: "intermediate" },
  { id: "r5", title: "Stretch", level: "intermediate" },
  { id: "r6", title: "Challenge", level: "advanced" },
  { id: "r7", title: "Boss level", level: "advanced" }
];

export type RoadmapProgress = {
  unlockedIndex: number;
  completedIds: string[];
};

const roadmapListeners = new Set<() => void>();

let roadmapSnapshotCache: { lang: string; json: string; progress: RoadmapProgress } | null = null;

/** Subscribe to roadmap writes (localStorage) for the same tab / hook updates. */
export function subscribeRoadmapProgress(listener: () => void) {
  roadmapListeners.add(listener);
  return () => roadmapListeners.delete(listener);
}

function emitRoadmapProgress() {
  roadmapSnapshotCache = null;
  roadmapListeners.forEach((l) => l());
}

const storageKey = (languageCode: string) => `emma-roadmap-${languageCode}`;

export function loadRoadmapProgress(languageCode: string): RoadmapProgress {
  if (typeof window === "undefined") {
    return { unlockedIndex: 0, completedIds: [] };
  }
  try {
    const raw = localStorage.getItem(storageKey(languageCode));
    if (!raw) return { unlockedIndex: 0, completedIds: [] };
    const p = JSON.parse(raw) as RoadmapProgress;
    const unlockedIndex =
      typeof p.unlockedIndex === "number" && p.unlockedIndex >= 0 && p.unlockedIndex <= PRACTICE_ROADMAP.length
        ? p.unlockedIndex
        : 0;
    const completedIds = Array.isArray(p.completedIds)
      ? p.completedIds.filter((id): id is string => typeof id === "string")
      : [];
    return { unlockedIndex, completedIds };
  } catch {
    return { unlockedIndex: 0, completedIds: [] };
  }
}

/** Same data as `loadRoadmapProgress`, but returns a stable reference when nothing changed (for `useSyncExternalStore`). */
export function getStableRoadmapProgress(languageCode: string): RoadmapProgress {
  const loaded = loadRoadmapProgress(languageCode);
  const json = JSON.stringify(loaded);
  if (roadmapSnapshotCache?.lang === languageCode && roadmapSnapshotCache.json === json) {
    return roadmapSnapshotCache.progress;
  }
  roadmapSnapshotCache = { lang: languageCode, json, progress: loaded };
  return loaded;
}

export function saveRoadmapProgress(languageCode: string, progress: RoadmapProgress) {
  try {
    localStorage.setItem(storageKey(languageCode), JSON.stringify(progress));
    emitRoadmapProgress();
  } catch {
    /* ignore */
  }
}

export function markLessonComplete(
  languageCode: string,
  nodeId: string,
  nodeIndex: number
): RoadmapProgress {
  const prev = loadRoadmapProgress(languageCode);
  const completedIds = prev.completedIds.includes(nodeId)
    ? prev.completedIds
    : [...prev.completedIds, nodeId];
  const unlockedIndex = Math.max(prev.unlockedIndex, nodeIndex + 1);
  const next = { unlockedIndex, completedIds };
  saveRoadmapProgress(languageCode, next);
  return next;
}
