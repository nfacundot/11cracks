import { requireUser } from "@/lib/auth";
import { PlayerProgress } from "@/components/player/player-progress";
import { getPlayerProgress } from "@/lib/player/progress-data";

export const metadata = { title: "Mi Progreso" };

export default async function ProgressPage() {
  const user = await requireUser();
  const { fixture, racha } = await getPlayerProgress(user.id, user.currentStreak, user.bestStreak);

  return <PlayerProgress fixture={fixture} racha={racha} />;
}
