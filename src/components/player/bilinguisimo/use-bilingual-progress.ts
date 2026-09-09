"use client";

import { useCallback, useEffect, useState } from "react";
import type { BilingualJourneyProgress } from "@/lib/bilingual/game-contracts";
import { readDemoBilingualProgress, resetDemoBilingualProgress, resetDemoGameSession, setDemoBilingualLanguage, writeDemoBilingualProgress } from "@/lib/bilingual/demo-progress-store";
import type { BilingualSessionConfig, TargetLanguage } from "@/lib/bilingual/game-contracts";
import { saveBilingualProgress } from "@/app/actions/bilingual";

export function useBilingualProgress(playerId: string) {
  const [journey, setJourney] = useState<BilingualJourneyProgress | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setJourney(readDemoBilingualProgress(playerId)));
    return () => window.cancelAnimationFrame(frame);
  }, [playerId]);

  const saveJourney = useCallback(async (next: BilingualJourneyProgress) => {
    setJourney(next);
    writeDemoBilingualProgress(next);
    await saveBilingualProgress(next);
  }, []);

  const resetGame = useCallback((session: BilingualSessionConfig) => {
    const next = resetDemoGameSession(playerId, session);
    setJourney(next);
  }, [playerId]);

  const resetAll = useCallback(() => {
    const next = resetDemoBilingualProgress(playerId);
    setJourney(next);
  }, [playerId]);

  const setLanguage = useCallback((targetLanguage: TargetLanguage) => {
    const next = setDemoBilingualLanguage(playerId, targetLanguage);
    setJourney(next);
  }, [playerId]);

  return { journey, saveJourney, resetGame, resetAll, setLanguage };
}
