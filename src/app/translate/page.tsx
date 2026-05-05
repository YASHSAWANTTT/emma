import { TranslatorPanel } from "@/components/TranslatorPanel";
import HeroWave from "@/components/ui/dynamic-wave-canvas-background";

export default function TranslatePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <HeroWave />
      <div className="relative z-10">
        <TranslatorPanel />
      </div>
    </div>
  );
}
