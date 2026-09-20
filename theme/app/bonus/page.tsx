import { PcRail } from "@/components/screens/pc-rail";
import BonusScreen from "@/components/screens/bonus-screen";

export const metadata = { title: "Upcoming bonus · GOAL50 PC" };

export default function Page() {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#111310]">
      <PcRail active="bonus" />
      <main className="min-w-0 flex-1">
        <BonusScreen />
      </main>
    </div>
  );
}
