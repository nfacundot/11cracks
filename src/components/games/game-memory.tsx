"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { recordGameScore, recordMemoryLevel } from "@/actions/game";

export type MemoryPair = { id: string; emoji: string; text: string };
export type MemoryCard = { pairId: string; emoji: string; text: string };

export const MEMORY_PAIRS: MemoryPair[] = [
  { id: "p1", emoji: "⚽", text: "Balón" },
  { id: "p2", emoji: "🥅", text: "Portería" },
  { id: "p3", emoji: "👟", text: "Tacos" },
  { id: "p4", emoji: "🟨", text: "Amarilla" },
  { id: "p5", emoji: "🟥", text: "Roja" },
  { id: "p6", emoji: "🏆", text: "Copa" },
  { id: "p7", emoji: "🧤", text: "Guantes" },
  { id: "p8", emoji: "🚩", text: "Córner" },
];

const LEVELS = [
  { id: 1, name: "Fácil", pairs: 4, emoji: "🌱", gradient: "from-green-400 to-emerald-600" },
  { id: 2, name: "Medio", pairs: 6, emoji: "⚡", gradient: "from-amber-400 to-orange-500" },
  { id: 3, name: "Difícil", pairs: 8, emoji: "🔥", gradient: "from-red-400 to-rose-600" },
] as const;

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function GameMemory({
  pairs = MEMORY_PAIRS,
  maxLevel = 0,
}: {
  pairs?: MemoryPair[];
  maxLevel?: number;
}) {
  const [screen, setScreen] = useState<"intro" | "play" | "levelComplete" | "complete">("intro");
  const [level, setLevel] = useState(1);
  const [unlocked, setUnlocked] = useState(Math.min(3, Math.max(1, maxLevel)));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [tries, setTries] = useState(0);
  const [resultXp, setResultXp] = useState(0);
  const [bonusXp, setBonusXp] = useState(0);
  const [saving, setSaving] = useState(false);

  const lvl = LEVELS.find((l) => l.id === level) ?? LEVELS[0];

  const cards = useMemo<MemoryCard[]>(
    () => {
      const chosen = shuffle(pairs).slice(0, lvl.pairs);
      return shuffle(
        [...chosen, ...chosen].map((p) => ({ pairId: p.id, emoji: p.emoji, text: p.text }))
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [level]
  );

  const startLevel = (lv: number) => {
    setLevel(lv);
    setFlipped([]);
    setMatched([]);
    setTries(0);
    setResultXp(0);
    setBonusXp(0);
    setScreen("play");
  };

  const winLevel = async () => {
    if (saving) return;
    setSaving(true);
    const score = lvl.pairs * 25;
    const [res, prog] = await Promise.all([
      recordGameScore("MEMORY_MATCH", score),
      recordMemoryLevel(lvl.id),
    ]);
    setResultXp(res.ok ? res.xpGained : 0);
    setBonusXp(prog.ok ? prog.bonusXp ?? 0 : 0);
    setUnlocked((u) => Math.max(u, lvl.id));
    setSaving(false);
    setScreen(lvl.id === 3 ? "complete" : "levelComplete");
  };

  const clickCard = (index: number) => {
    if (saving) return;
    if (flipped.length === 2) return;
    if (flipped.includes(index)) return;
    if (matched.includes(cards[index].pairId)) return;

    const next = [...flipped, index];
    setFlipped(next);

    if (next.length === 2) {
      setTries((t) => t + 1);
      const [a, b] = next;
      if (cards[a].pairId === cards[b].pairId) {
        const newMatched = [...matched, cards[a].pairId];
        setTimeout(() => {
          setMatched(newMatched);
          setFlipped([]);
          if (newMatched.length === lvl.pairs) {
            void winLevel();
          }
        }, 350);
      } else {
        setTimeout(() => setFlipped([]), 700);
      }
    }
  };

  if (screen === "intro") {
    return (
      <div className="flex flex-col items-center gap-6 pt-8 text-center">
        <div className="animate-pop rounded-full bg-white p-8 text-7xl shadow-lg shadow-green-100 dark:bg-emerald-900 dark:shadow-green-950">
          🧠
        </div>
        <div>
          <h1 className="text-2xl font-black">Memoria Táctica</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Encuentra las parejas de fútbol · 3 niveles · 25 XP por pareja
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {LEVELS.map((lv) => (
            <span
              key={lv.id}
              className={`flex h-2.5 w-8 rounded-full transition ${
                unlocked >= lv.id
                  ? lv.id === 3
                    ? "bg-red-400"
                    : lv.id === 2
                      ? "bg-amber-400"
                      : "bg-green-400"
                  : "bg-zinc-200 dark:bg-zinc-700"
              }`}
            />
          ))}
          <span className="ml-2 text-[11px] font-black text-zinc-400">
            {Math.max(0, unlocked - 1)}/3 completados
          </span>
        </div>

        <div className="flex w-full flex-col gap-3">
          {LEVELS.map((lv) => {
            const isUnlocked = unlocked >= lv.id;
            const hasPairs = pairs.length >= lv.pairs;
            const enabled = isUnlocked && hasPairs;
            const cleared = unlocked > lv.id;
            return (
              <button
                key={lv.id}
                type="button"
                disabled={!enabled}
                onClick={() => startLevel(lv.id)}
                className={`flex items-center gap-4 rounded-3xl bg-gradient-to-r ${lv.gradient} p-4 text-left shadow-lg transition ${
                  enabled ? "hover:brightness-110 active:scale-95" : "opacity-50 grayscale"
                }`}
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/90 text-3xl shadow-sm">
                  {enabled ? lv.emoji : "🔒"}
                </span>
                <div className="min-w-0 flex-1 text-white">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/70">
                    {lv.pairs} parejas
                    {cleared ? " · Completado" : ""}
                  </p>
                  <h3 className="text-xl font-black">{lv.name}</h3>
                  <p className="text-xs font-bold text-white/80">
                    {!isUnlocked
                      ? "Completá el nivel anterior para desbloquear"
                      : !hasPairs
                        ? `Se necesitan ${lv.pairs} parejas (agregalas en el panel de juegos)`
                        : "Ganás el nivel y pasás al siguiente"}
                  </p>
                </div>
                {enabled && <span className="text-xl text-white/90">▶</span>}
              </button>
            );
          })}
        </div>

        <Link
          href="/games"
          className="w-full rounded-2xl border-2 border-green-200 py-3 text-center text-sm font-black text-green-700 transition hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/40"
        >
          Más juegos
        </Link>
      </div>
    );
  }

  if (screen === "levelComplete") {
    return (
      <div className="flex flex-col items-center gap-6 pt-8 text-center">
        <div className="animate-pop text-7xl">🎉</div>
        <div>
          <h1 className="text-2xl font-black">¡Nivel {lvl.name} superado!</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Encontraste las {lvl.pairs} parejas en {tries} intentos.
          </p>
        </div>
        <div className="flex w-full gap-3">
          <div className="flex flex-1 flex-col items-center rounded-2xl bg-green-50 p-4 dark:bg-green-950/40">
            <span className="text-3xl font-black text-green-600 dark:text-green-400">
              {lvl.pairs}✕25
            </span>
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Puntos</span>
          </div>
          <div className="flex flex-1 flex-col items-center rounded-2xl bg-orange-50 p-4 dark:bg-orange-950/40">
            <span className="text-3xl font-black text-orange-500">+{resultXp}</span>
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">XP</span>
          </div>
          {bonusXp > 0 && (
            <div className="flex flex-1 flex-col items-center rounded-2xl bg-purple-50 p-4 dark:bg-purple-950/40">
              <span className="text-3xl font-black text-purple-500">+{bonusXp}</span>
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">XP bonus</span>
            </div>
          )}
        </div>
        <div className="flex w-full flex-col gap-3">
          {lvl.id < 3 && (
            <button
              onClick={() => startLevel(lvl.id + 1)}
              className="w-full rounded-2xl bg-green-500 py-4 text-lg font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95"
            >
              Siguiente: {LEVELS.find((l) => l.id === lvl.id + 1)?.name}{" "}
              {LEVELS.find((l) => l.id === lvl.id + 1)?.emoji}
            </button>
          )}
          <button
            onClick={() => startLevel(lvl.id)}
            className="w-full rounded-2xl border-2 border-green-200 py-3 text-sm font-black text-green-700 transition hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/40"
          >
            Jugar de nuevo
          </button>
          <button
            onClick={() => setScreen("intro")}
            className="w-full rounded-2xl border-2 border-green-200 py-3 text-sm font-black text-green-700 transition hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/40"
          >
            Elegir nivel
          </button>
        </div>
      </div>
    );
  }

  if (screen === "complete") {
    return (
      <div className="flex flex-col items-center gap-6 pt-8 text-center">
        <div className="animate-pop text-7xl">🏆</div>
        <div>
          <h1 className="text-2xl font-black">¡Memoria Táctica completada!</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Ganaste los 3 niveles de dificultad.
          </p>
        </div>
        <div className="flex w-full gap-3">
          <div className="flex flex-1 flex-col items-center rounded-2xl bg-green-50 p-4 dark:bg-green-950/40">
            <span className="text-3xl font-black text-green-600 dark:text-green-400">
              +{resultXp}
            </span>
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">XP</span>
          </div>
          {bonusXp > 0 && (
            <div className="flex flex-1 flex-col items-center rounded-2xl bg-purple-50 p-4 dark:bg-purple-950/40">
              <span className="text-3xl font-black text-purple-500">+{bonusXp}</span>
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">XP bonus</span>
            </div>
          )}
        </div>
        <div className="flex w-full flex-col gap-3">
          <button
            onClick={() => startLevel(1)}
            className="w-full rounded-2xl bg-green-500 py-4 text-lg font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95"
          >
            Jugar de nuevo
          </button>
          <Link
            href="/games"
            className="w-full rounded-2xl border-2 border-green-200 py-3 text-center font-bold text-green-700 transition hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/40"
          >
            Más juegos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
        <span
          className={`rounded-full bg-gradient-to-r ${lvl.gradient} px-2.5 py-1 font-black text-white shadow-sm`}
        >
          {lvl.emoji} Nivel {lvl.name} · {lvl.pairs} parejas
        </span>
        <span>
          Parejas: {matched.length}/{lvl.pairs}
        </span>
        <span>Intentos: {tries}</span>
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        {cards.map((card, index) => {
          const isFlipped = flipped.includes(index) || matched.includes(card.pairId);
          return (
            <button
              key={index}
              onClick={() => clickCard(index)}
              className={`flex aspect-square items-center justify-center rounded-2xl border-2 text-2xl transition-all duration-300 active:scale-95 ${
                isFlipped
                  ? "border-green-300 bg-white dark:border-green-600 dark:bg-emerald-900"
                  : "border-emerald-800 bg-emerald-600 hover:bg-emerald-500"
              }`}
            >
              {isFlipped ? card.emoji : "❓"}
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs font-bold text-zinc-400 dark:text-zinc-500">
        Encuentra las parejas del fútbol
      </p>
    </div>
  );
}
