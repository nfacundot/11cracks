"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { recordGameScore } from "@/actions/game";

export const MEMORY_PAIRS = [
  { id: "p1", emoji: "⚽", text: "Balón" },
  { id: "p2", emoji: "🥅", text: "Portería" },
  { id: "p3", emoji: "👟", text: "Tacos" },
  { id: "p4", emoji: "🟨", text: "Amarilla" },
  { id: "p5", emoji: "🟥", text: "Roja" },
  { id: "p6", emoji: "🏆", text: "Copa" },
];

export type MemoryCard = { pairId: string; emoji: string; text: string };

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function GameMemory({ pairs = MEMORY_PAIRS }: { pairs?: typeof MEMORY_PAIRS }) {
  const cards = useMemo<MemoryCard[]>(
    () => shuffle([...pairs, ...pairs].map((p) => ({ pairId: p.id, emoji: p.emoji, text: p.text }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [tries, setTries] = useState(0);
  const [finished, setFinished] = useState(false);
  const [resultXp, setResultXp] = useState(0);
  const [showIntro, setShowIntro] = useState(true);

  const pairsFound = matched.length / 2;

  const clickCard = (index: number) => {
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
          if (newMatched.length === pairs.length * 2) {
            const score = pairs.length * 25;
            recordGameScore("MEMORY_MATCH", score).then((res) => {
              if (res.ok) setResultXp(res.xpGained);
              setFinished(true);
            });
          }
        }, 350);
      } else {
        setTimeout(() => setFlipped([]), 700);
      }
    }
  };

  if (showIntro) {
    return (
      <div className="flex flex-col items-center gap-6 pt-8 text-center">
        <div className="animate-pop rounded-full bg-white p-8 text-7xl shadow-lg shadow-green-100">🧠</div>
        <div>
          <h1 className="text-2xl font-black">Memoria Táctica</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Encuentra las {pairs.length} parejas de fútbol · 25 XP por pareja
          </p>
        </div>
        <button
          onClick={() => setShowIntro(false)}
          className="w-full rounded-2xl bg-green-500 py-4 text-lg font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95"
        >
          ¡A jugar!
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-6 pt-8 text-center">
        <div className="animate-pop text-7xl">🎉</div>
        <div>
          <h1 className="text-2xl font-black">¡Memoria completada!</h1>
          <p className="mt-2 text-sm text-zinc-500">
            {pairs.length} parejas en {tries} intentos
          </p>
        </div>
        <div className="flex w-full gap-3">
          <div className="flex flex-1 flex-col items-center rounded-2xl bg-green-50 p-4">
            <span className="text-3xl font-black text-green-600">{pairsFound}✕25</span>
            <span className="text-xs font-bold text-zinc-500">Puntos</span>
          </div>
          <div className="flex flex-1 flex-col items-center rounded-2xl bg-orange-50 p-4">
            <span className="text-3xl font-black text-orange-500">+{resultXp}</span>
            <span className="text-xs font-bold text-zinc-500">XP</span>
          </div>
        </div>
        <Link
          href="/games"
          className="w-full rounded-2xl bg-green-500 py-4 text-center text-lg font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95"
        >
          Más juegos
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
        <span>
          Parejas: {pairsFound}/{pairs.length}
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
                  ? "border-green-300 bg-white"
                  : "border-emerald-800 bg-emerald-600 hover:bg-emerald-500"
              }`}
            >
              {isFlipped ? card.emoji : "❓"}
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs font-bold text-zinc-400">
        Encuentra las parejas del fútbol
      </p>
    </div>
  );
}
