import Image from "next/image";
import type { ReactNode } from "react";

export type EmoteState = "question" | "correct" | "wrong" | "timeout";

const EMOTES: Record<EmoteState, string> = {
  question: "/img/emotes/question.png",
  correct: "/img/emotes/emote_succ.png",
  wrong: "/img/emotes/emote_wrong.png",
  timeout: "/img/emotes/emote_outime.png",
};

const BUBBLE: Record<EmoteState, string> = {
  question: "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-emerald-900",
  correct: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/60",
  wrong: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/60",
  timeout: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/60",
};

const TAIL: Record<EmoteState, string> = {
  question: "bg-white dark:bg-emerald-900",
  correct: "bg-green-50 dark:bg-green-950/60",
  wrong: "bg-red-50 dark:bg-red-950/60",
  timeout: "bg-red-50 dark:bg-red-950/60",
};

export function EmoteMascot({
  state,
  text,
  explanation,
  children,
}: {
  state: EmoteState;
  text: ReactNode;
  explanation?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-24 shrink-0">
          <Image
            key={state}
            src={EMOTES[state]}
            alt="Personaje"
            width={128}
            height={160}
            className="animate-pop h-auto w-full object-contain"
            priority
          />
        </div>

        <div className={`relative min-w-0 flex-1 rounded-2xl border-2 px-4 py-3 ${BUBBLE[state]}`}>
          <span
            className={`absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 ${TAIL[state]}`}
          />
          <div className="text-base font-black leading-snug">{text}</div>
          {explanation && (
            <p className="mt-1 text-sm font-normal text-zinc-600 dark:text-zinc-300">
              {explanation}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}
