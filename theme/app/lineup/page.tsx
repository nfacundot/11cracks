import { PcRail } from "@/components/screens/pc-rail";
import LineupScreen from "@/components/screens/lineup-screen";

export const metadata = { title: "Alineación · GOAL50 PC" };

export default function Page() {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#111310]">
      <PcRail active="alineacion" />
      <main className="min-w-0 flex-1">
        <LineupScreen />
      </main>
    </div>
  );
}
