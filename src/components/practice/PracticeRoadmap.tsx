"use client";

import { PRACTICE_ROADMAP, type RoadmapNode, type RoadmapProgress } from "@/lib/practiceRoadmap";
import { levelLabels } from "@/lib/practiceTypes";

type Props = {
  progress: RoadmapProgress;
  onSelectNode: (node: RoadmapNode, index: number) => void;
};

export function PracticeRoadmap({ progress, onSelectNode }: Props) {
  return (
    <div className="roadmapWrap">
      <p className="roadmapHint">Complete each step to unlock the next.</p>
      <ol className="roadmapList">
        {PRACTICE_ROADMAP.map((node, index) => {
          const locked = index > progress.unlockedIndex;
          const done = progress.completedIds.includes(node.id);
          return (
            <li key={node.id} className="roadmapItem">
              <button
                type="button"
                className={
                  locked
                    ? "roadmapNode roadmapNodeLocked"
                    : done
                      ? "roadmapNode roadmapNodeDone"
                      : "roadmapNode roadmapNodeActive"
                }
                disabled={locked}
                onClick={() => onSelectNode(node, index)}
              >
                <span className="roadmapNodeTop">
                  <span className="roadmapNodeTitle">{node.title}</span>
                  <span className="roadmapNodeBadges">
                    {done ? <span className="roadmapBadge">Done</span> : null}
                    {locked ? <span className="roadmapBadge">Locked</span> : null}
                  </span>
                </span>
                <span className="roadmapNodeMeta">{levelLabels[node.level]}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
