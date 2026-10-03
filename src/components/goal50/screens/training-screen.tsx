"use client";

import { PlayerTraining } from "@/components/player/player-training";
import { buildPlayerTrainingFixture } from "@/lib/player/training";

export default function TrainingScreen() {
  return <PlayerTraining fixture={buildPlayerTrainingFixture()} />;
}
