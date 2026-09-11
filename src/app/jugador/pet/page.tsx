import { requireUser } from "@/lib/auth";
import { getPlayerPetView } from "@/lib/player/domain-view";
import { PlayerPetSection } from "@/components/player/player-domain-readonly";

export const metadata = { title: "Mi PET" };

export default async function PlayerPetPage() {
  const user = await requireUser();
  const view = await getPlayerPetView(user);
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <PlayerPetSection view={view} />
    </main>
  );
}