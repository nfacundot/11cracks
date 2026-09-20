import { PcRail } from "@/components/screens/pc-rail";
import AnalysisScreen from "@/components/screens/analysis-screen";

export const metadata = { title: "AI Analysis · GOAL50 PC" };

export default function Page() {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#111310]">
      <PcRail active="ai" />
      <main className="min-w-0 flex-1">
        <AnalysisScreen />
      </main>
    </div>
  );
}
