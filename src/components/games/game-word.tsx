"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { recordGameScore } from "@/actions/game";
import { BallIcon } from "@/components/icons";
import type { CSSProperties } from "react";

export type WordEntry = {
  word: string;
  theme: string;
  lang?: string;
};

const DEMO_WORDS: WordEntry[] = [
  { word: "GOL", theme: "⚽" },
  { word: "CAMPO", theme: "🏟️" },
  { word: "BALÓN", theme: "⚽" },
  { word: "EQUIPO", theme: "👥" },
  { word: "PORTERO", theme: "🧤" },
];

const MAX_LIVES = 3;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function scramble(word: string): (string | null)[] {
  const letters = [...word];
  let s = shuffle(letters);
  if (s.join("") === word && s.length > 1) {
    s = shuffle(letters);
  }
  return s;
}

function speak(text: string, lang = "es-ES") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.85;
    u.pitch = 1;
    u.volume = 1;
    u.onerror = () => {};
    synth.speak(u);
  } catch {
    // sin soporte de voz
  }
}

export function GameWord({ words = DEMO_WORDS }: { words?: WordEntry[] }) {
  const [showIntro, setShowIntro] = useState(true);
  const [finished, setFinished] = useState(false);
  const [resultXp, setResultXp] = useState(0);

  const [entry, setEntry] = useState<WordEntry>(words[0]);
  const [letters, setLetters] = useState<(string | null)[]>(() =>
    scramble(words[0].word)
  );
  const [answer, setAnswer] = useState<string[]>([]);
  const [lives, setLives] = useState(MAX_LIVES);
  const [goals, setGoals] = useState(0);
  const [round, setRound] = useState(1);
  const [result, setResult] = useState<"goal" | "miss" | null>(null);
  const [shake, setShake] = useState(false);
  const [kickX, setKickX] = useState("0px");
  const [diveX, setDiveX] = useState("70px");

  const poolRef = useRef<WordEntry[]>(shuffle(words));
  const idxRef = useRef(0);
  const busyRef = useRef(false);
  const finishedRef = useRef(false);
  const goalsRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
  };

  const pickNext = (): WordEntry => {
    if (idxRef.current >= poolRef.current.length) {
      poolRef.current = shuffle(words);
      idxRef.current = 0;
    }
    const e = poolRef.current[idxRef.current];
    idxRef.current += 1;
    return e;
  };

  const setupRound = (e: WordEntry, nextRoundNum: number) => {
    setEntry(e);
    setLetters(scramble(e.word));
    setAnswer([]);
    setResult(null);
    setShake(false);
    setRound(nextRoundNum);
    speak(e.word.toLowerCase(), e.lang ?? "es-ES");
  };

  const startGame = () => {
    busyRef.current = false;
    finishedRef.current = false;
    goalsRef.current = 0;
    poolRef.current = shuffle(words);
    idxRef.current = 0;
    setShowIntro(false);
    setFinished(false);
    setResultXp(0);
    setLives(MAX_LIVES);
    setGoals(0);
    setupRound(pickNext(), 1);
  };

  const finish = (finalGoals: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    recordGameScore("WORD_GOAL", finalGoals).then((res) => {
      if (res.ok) setResultXp(res.xpGained);
      setFinished(true);
    });
  };

  const pickLetter = (i: number) => {
    if (busyRef.current || result) return;
    if (letters[i] === null) return;
    const next = [...letters];
    const ch = next[i] as string;
    next[i] = null;
    setLetters(next);
    setAnswer((a) => [...a, ch]);
  };

  const removeAnswer = (i: number) => {
    if (busyRef.current || result) return;
    const ch = answer[i];
    if (ch === undefined) return;
    const nextAnswer = [...answer];
    nextAnswer.splice(i, 1);
    const nextLetters = [...letters];
    const emptyIdx = nextLetters.indexOf(null);
    if (emptyIdx !== -1) nextLetters[emptyIdx] = ch;
    setAnswer(nextAnswer);
    setLetters(nextLetters);
  };

  const clearLast = () => removeAnswer(answer.length - 1);

  const submit = () => {
    if (busyRef.current || result) return;
    const built = answer.join("");
    if (built === "") return;
    const correct = built === entry.word;
    busyRef.current = true;

    if (correct) {
      const newGoals = goalsRef.current + 1;
      goalsRef.current = newGoals;
      setGoals(newGoals);
      setResult("goal");
      const right = Math.random() > 0.5;
      setKickX(right ? "70px" : "-70px");
      setDiveX(right ? "-80px" : "80px");
      later(() => {
        busyRef.current = false;
        setupRound(pickNext(), round + 1);
      }, 1400);
    } else {
      const newLives = lives - 1;
      setResult("miss");
      setShake(true);
      setKickX("0px");
      setDiveX("0px");
      later(() => {
        if (newLives <= 0) {
          finish(goalsRef.current);
        } else {
          setLives(newLives);
          busyRef.current = false;
          setupRound(pickNext(), round + 1);
        }
      }, 1600);
    }
  };

  if (showIntro) {
    return (
      <div className="flex flex-col items-center gap-6 pt-8 text-center">
        <div className="animate-pop rounded-full bg-white p-8 text-7xl shadow-lg shadow-green-100 dark:bg-emerald-900 dark:shadow-green-950">
          ⚽
        </div>
        <div>
          <h1 className="text-2xl font-black">Palabra a Gol</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Escucha cómo se pronuncia y ordena las letras desordenadas para armar la palabra.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {words.slice(0, 5).map((w) => (
            <span
              key={w.word}
              className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:ring-emerald-800"
            >
              {w.theme} {w.word}
            </span>
          ))}
        </div>

        <div className="flex w-full flex-col gap-2 rounded-2xl bg-white/55 p-4 text-sm font-bold text-zinc-600 shadow-xl ring-2 ring-white/70 dark:bg-emerald-950/55 dark:text-zinc-300 dark:ring-emerald-800">
          <p className="flex items-center gap-2">
            <span>❤️</span> Tenés 3 vidas
          </p>
          <p className="flex items-center gap-2">
            <span>⚽</span> Cada palabra armada es un gol
          </p>
          <p className="flex items-center gap-2">
            <span>❌</span> Si fallas, no hay gol y pierdes una vida
          </p>
          <p className="flex items-center gap-2">
            <span>🔁</span> Las rondas se repiten hasta quedarte sin vidas
          </p>
        </div>

        <button
          onClick={startGame}
          className="w-full rounded-2xl bg-green-500 py-4 text-lg font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95"
        >
          ¡Comenzar!
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-6 pt-8 text-center">
        <div className="animate-pop text-7xl">
          {goals >= 5 ? "🏆" : goals > 0 ? "⚽" : "🥅"}
        </div>
        <div>
          <h1 className="text-2xl font-black">¡Fin del partido!</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Anotaste {goals} {goals === 1 ? "gol" : "goles"} antes de quedarte sin vidas.
          </p>
        </div>
        <div className="flex w-full gap-3">
          <div className="flex flex-1 flex-col items-center rounded-2xl bg-green-50 p-4 dark:bg-green-950/40">
            <span className="text-3xl font-black text-green-600 dark:text-green-400">
              {goals}
            </span>
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Goles</span>
          </div>
          <div className="flex flex-1 flex-col items-center rounded-2xl bg-orange-50 p-4 dark:bg-orange-950/40">
            <span className="text-3xl font-black text-orange-500">+{resultXp}</span>
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">XP</span>
          </div>
        </div>
        <div className="flex w-full flex-col gap-3">
          <button
            onClick={startGame}
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

  const kickStyle = result ? ({ "--kick-x": kickX } as CSSProperties) : undefined;
  const diveStyle = result ? ({ "--dive-x": diveX } as CSSProperties) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
        <span className="text-base leading-none">
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <span key={i} className={i < lives ? "" : "opacity-25 grayscale"}>
              {i < lives ? "❤️" : "🖤"}
            </span>
          ))}
        </span>
        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <BallIcon className="h-4 w-4" />
          {goals} {goals === 1 ? "gol" : "goles"}
        </span>
        <span>Palabra {round}</span>
      </div>

      <div className="relative h-40 overflow-hidden rounded-3xl bg-gradient-to-b from-green-700 via-green-800 to-emerald-950 shadow-inner ring-1 ring-green-100 dark:ring-green-900">
        <div
          className={`absolute left-1/2 top-3 h-20 w-40 -translate-x-1/2 overflow-hidden rounded-b-2xl border-2 border-white/80 bg-white/10 dark:bg-white/5 ${
            result === "goal" ? "animate-net-shake" : ""
          }`}
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.22) 1px, transparent 1px)",
            backgroundSize: "10px 10px",
          }}
        >
          {result === "goal" && (
            <div className="animate-pop flex h-full items-center justify-center text-2xl font-black text-green-300 drop-shadow">
              ¡GOOOL!
            </div>
          )}
          {result === "miss" && (
            <div className="animate-pop flex h-full items-center justify-center text-3xl">
              🧤
            </div>
          )}
        </div>

        <div
          className={`absolute left-1/2 top-[62px] -translate-x-1/2 ${
            result === "goal" ? "animate-keeper-dive" : ""
          }`}
          style={diveStyle}
        >
          <div className="flex flex-col items-center">
            <div className="h-4 w-4 rounded-full bg-amber-200" />
            <div className="h-9 w-10 rounded-t-2xl bg-yellow-400 shadow-md" />
            <div className="flex w-14 justify-between">
              <div className="h-3 w-3 rounded-full bg-white shadow" />
              <div className="h-3 w-3 rounded-full bg-white shadow" />
            </div>
          </div>
        </div>

        <div
          className={`absolute bottom-2 left-1/2 -translate-x-1/2 text-4xl drop-shadow-lg ${
            result ? "animate-kick-ball" : ""
          }`}
          style={kickStyle}
        >
          ⚽
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <p className="text-sm font-black text-zinc-500 dark:text-zinc-300">
          {entry.theme} Escuchá la palabra:
        </p>
        <button
          type="button"
          onClick={() => speak(entry.word.toLowerCase(), entry.lang ?? "es-ES")}
          aria-label="Reproducir pronunciación"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-lg ring-1 ring-emerald-200 transition hover:bg-emerald-100 active:scale-90 dark:bg-emerald-900 dark:ring-emerald-800 dark:hover:bg-emerald-800"
        >
          🔊
        </button>
      </div>

      <div
        className={`flex flex-wrap justify-center gap-2 ${
          shake ? "animate-shake" : ""
        }`}
      >
        {Array.from({ length: entry.word.length }).map((_, i) => {
          const ch = answer[i];
          return (
            <button
              key={i}
              type="button"
              onClick={() => removeAnswer(i)}
              disabled={ch === undefined || !!result}
              className={`flex h-12 w-9 items-center justify-center rounded-xl border-2 text-xl font-black uppercase transition active:scale-95 ${
                ch
                  ? result === "goal"
                    ? "border-green-500 bg-green-100 text-emerald-950 dark:bg-green-900 dark:text-white"
                    : result === "miss"
                      ? "border-red-400 bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-300"
                      : "border-green-400 bg-white text-emerald-950 dark:border-green-500 dark:bg-emerald-900 dark:text-white"
                  : "border-dashed border-zinc-300 text-zinc-300 dark:border-zinc-700 dark:text-zinc-600"
              }`}
            >
              {ch ?? "·"}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {letters.map((ch, i) =>
          ch === null ? (
            <span key={i} className="h-12 w-11" />
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => pickLetter(i)}
              disabled={!!result}
              className="flex h-12 w-11 items-center justify-center rounded-xl border-2 border-zinc-200 bg-white text-xl font-black uppercase text-zinc-700 transition hover:border-green-300 hover:bg-green-50 active:scale-95 disabled:opacity-60 dark:border-zinc-700 dark:bg-emerald-900 dark:text-zinc-100 dark:hover:border-green-600 dark:hover:bg-green-950/50"
            >
              {ch}
            </button>
          )
        )}
      </div>

      {result === "miss" && (
        <p className="animate-pop text-center text-sm font-black text-red-500">
          ¡Fallaste! La palabra era {entry.word}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={clearLast}
          disabled={answer.length === 0 || !!result}
          className="flex-1 rounded-2xl border-2 border-zinc-200 py-3 text-base font-black text-zinc-600 transition hover:bg-zinc-50 active:scale-95 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/40"
        >
          Borrar
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={answer.length === 0 || !!result}
          className="flex-1 rounded-2xl bg-green-500 py-3 text-base font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95 disabled:opacity-50"
        >
          Comprobar
        </button>
      </div>
    </div>
  );
}
