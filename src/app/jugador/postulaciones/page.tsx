import { requireUser } from "@/lib/auth";
import { PlayerPostulations } from "@/components/player/player-postulations";

export const metadata = { title: "Postulaciones · 11Cracks" };

export default async function PostulacionesPage() {
  await requireUser();
  return <PlayerPostulations />;
}