import { PcRail } from "@/components/screens/pc-rail";
import CashinScreen from "@/components/screens/cashin-screen";

export const metadata = { title: "Cash In · GOAL50 PC" };

export default function Page() {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#111310]">
      <PcRail active="cashin" />
      <main className="min-w-0 flex-1">
        <CashinScreen />
      </main>
    </div>
  );
}
