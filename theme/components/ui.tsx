import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { IconArrowRight } from "./icons";

/* ---------- Team / league badges drawn in pure CSS ---------- */

const TEAMS = {
  mun: {
    bg: "radial-gradient(circle at 35% 30%, #e0332a, #8f150c)",
    ring: "#f3c96b",
    label: "MU",
    fg: "#ffe9c8",
  },
  bm: {
    bg: "radial-gradient(circle at 35% 30%, #1e6fd0, #0a3d8f)",
    ring: "#e8edf2",
    label: "BM",
    fg: "#ffffff",
  },
  bvb: {
    bg: "radial-gradient(circle at 35% 30%, #ffe81a, #e5c400)",
    ring: "#111111",
    label: "BVB",
    fg: "#111111",
  },
  fcb: {
    bg: "repeating-linear-gradient(90deg, #a50044 0 4px, #004d98 4px 8px)",
    ring: "#edbb00",
    label: "FCB",
    fg: "#f7d546",
  },
  acm: {
    bg: "repeating-linear-gradient(90deg, #fb090b 0 4px, #14100c 4px 8px)",
    ring: "#f4f4f4",
    label: "ACM",
    fg: "#ffffff",
  },
  psg: {
    bg: "radial-gradient(circle at 35% 30%, #123067, #0a1a3c)",
    ring: "#da291c",
    label: "PSG",
    fg: "#ffffff",
  },
  cin: {
    bg: "radial-gradient(circle at 35% 30%, #ff8a2a, #e04e00)",
    ring: "#111111",
    label: "B",
    fg: "#ffffff",
  },
  car: {
    bg: "radial-gradient(circle at 35% 30%, #333333, #0c0c0c)",
    ring: "#0085ca",
    label: "C",
    fg: "#6cc4ea",
  },
  uefa: {
    bg: "radial-gradient(circle at 35% 30%, #24407c, #0c1a3e)",
    ring: "#c6f232",
    label: "UEFA",
    fg: "#ffffff",
  },
  pl: {
    bg: "radial-gradient(circle at 35% 30%, #55215f, #2c0f36)",
    ring: "#e8dff5",
    label: "PL",
    fg: "#e9dcff",
  },
  efl: {
    bg: "radial-gradient(circle at 35% 30%, #2a5cdf, #0c2a86)",
    ring: "#f4f4f4",
    label: "EFL",
    fg: "#ffffff",
  },
} as const;

export type TeamKey = keyof typeof TEAMS;

export function Badge({
  t,
  size = 36,
  className = "",
}: {
  t: TeamKey;
  size?: number;
  className?: string;
}) {
  const tm = TEAMS[t];
  const label = tm.label;
  const fontScale = label.length >= 4 ? 0.2 : label.length === 3 ? 0.26 : 0.32;
  return (
    <span
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-display font-semibold ${className}`}
      style={{
        width: size,
        height: size,
        background: tm.bg,
        color: tm.fg,
        fontSize: Math.max(7, size * fontScale),
        letterSpacing: "0.02em",
        textShadow: "0 1px 2px rgba(0,0,0,0.55)",
        boxShadow: `0 0 0 3px #171b0d, inset 0 0 0 ${Math.max(1.5, size * 0.055)}px ${tm.ring}, 0 4px 10px rgba(0,0,0,0.35)`,
      }}
    >
      {label}
    </span>
  );
}

/* ---------- Shared atoms ---------- */

type LinkHref = ComponentProps<typeof Link>["href"];

export function IconCircle({
  children,
  className = "",
  href,
  onClick,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  href?: LinkHref;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const cls = `relative inline-flex items-center justify-center rounded-full bg-panel text-white/90 transition hover:bg-panel2 ${className}`;
  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" aria-label={ariaLabel} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function LiveCam({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`${className} text-[#ff4438]`}>
      <rect x="2" y="6.5" width="13" height="11" rx="3" fill="currentColor" />
      <path d="M15.5 10.9 22 7.3v9.4l-6.5-3.6z" fill="currentColor" />
    </svg>
  );
}

export function SectionHeader({
  emoji,
  title,
  href,
}: {
  emoji?: string;
  title: string;
  href?: LinkHref;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 font-display text-[19px] font-semibold uppercase tracking-[0.04em]">
        {emoji ? <span className="text-[16px]">{emoji}</span> : null}
        {title}
      </h2>
      <IconCircle className="size-9" href={href} ariaLabel={`Open ${title}`}>
        <IconArrowRight className="size-4" />
      </IconCircle>
    </div>
  );
}

const AVATAR_GRADIENTS = [
  "from-rose-400 to-orange-300",
  "from-amber-300 to-lime-300",
  "from-sky-400 to-indigo-400",
  "from-fuchsia-400 to-purple-400",
  "from-emerald-300 to-teal-500",
];

export function AvatarStack({ count }: { count: string }) {
  return (
    <div className="flex -space-x-2.5">
      {AVATAR_GRADIENTS.map((g, i) => (
        <span
          key={g}
          className={`size-6 rounded-full bg-gradient-to-br ring-2 ring-panel ${g} ${i % 2 ? "translate-y-0.5" : ""}`}
        />
      ))}
      <span className="z-10 flex size-6 translate-y-0.5 items-center justify-center rounded-full bg-lime text-[9px] font-bold text-black ring-2 ring-panel">
        {count}
      </span>
    </div>
  );
}
