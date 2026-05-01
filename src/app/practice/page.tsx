import { PracticeSession } from "@/components/practice/PracticeSession";
import HeroWave from "@/components/ui/dynamic-wave-canvas-background";

export default function PracticePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <HeroWave />
      <div className="relative z-10">
        <PracticeSession />
      </div>
    </div>
  );
}
