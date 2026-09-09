import { requireUser } from "@/lib/auth";
import { PlayerCamino } from "@/components/player/player-camino";

export const metadata = { title: "El Camino · 11Cracks" };

export default async function CaminoPage() {
  await requireUser();
  return <PlayerCamino />;
}