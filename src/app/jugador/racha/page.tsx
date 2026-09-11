import { requireUser } from "@/lib/auth";
import { getPlayerStreakView } from "@/lib/player/domain-view";
import { PlayerStreakSection } from "@/components/player/player-domain-readonly";

export const metadata = { title: "Mi Racha" };

export default async function PlayerStreakPage() {
  const user = await requireUser();
  const view = await getPlayerStreakView(user);
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <PlayerStreakSection view={view} />
    </main>
  );
}