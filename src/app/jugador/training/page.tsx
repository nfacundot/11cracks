import { requireUser } from "@/lib/auth";
import { buildPlayerTrainingFixture } from "@/lib/player/training";
import { PlayerTraining } from "@/components/player/player-training";

export const metadata = { title: "Entrenamiento · 11Cracks" };

export default async function TrainingPage() {
  await requireUser();
  const fixture = buildPlayerTrainingFixture();
  return <PlayerTraining fixture={fixture} />;
}