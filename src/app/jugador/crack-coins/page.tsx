import { requireUser } from "@/lib/auth";
import { getPlayerCoinsView } from "@/lib/player/domain-view";
import { PlayerCoinsSection } from "@/components/player/player-domain-readonly";

export const metadata = { title: "Mis Crack Coins" };

export default async function PlayerCoinsPage() {
  const user = await requireUser();
  const view = await getPlayerCoinsView(user);
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <PlayerCoinsSection view={view} />
    </main>
  );
}