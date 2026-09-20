"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { IconArrowLeft } from "../icons";
import { LogoMark } from "./logo-mark";

export function AuthHeader({ title, subtitle }: { title: ReactNode; subtitle: string }) {
  return (
    <>
      <div className="flex items-center justify-between px-6 pt-[max(2.25rem,env(safe-area-inset-top))]">
        <Link
          href="/landing"
          aria-label="Back"
          className="flex size-10 items-center justify-center rounded-full bg-panel text-white/85 transition hover:bg-panel2"
        >
          <IconArrowLeft className="size-4.5" />
        </Link>
        <span className="flex items-center gap-2">
          <LogoMark className="size-7" />
          <span className="font-display text-[13px] font-bold tracking-[0.18em]">
            GOAL<span className="text-lime">50</span>
          </span>
        </span>
      </div>

      <div className="px-7">
        <h1 className="mt-8 font-display text-[34px] font-semibold leading-[1.1]">
          {title}
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-white/50">{subtitle}</p>
      </div>
    </>
  );
}

export function Field({
  label,
  type = "text",
  placeholder,
  autoComplete,
}: {
  label: string;
  type?: string;
  placeholder: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
        {label}
      </span>
      <input
        type={type}
        required
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-2 h-[52px] w-full rounded-2xl border border-white/10 bg-panel px-4 text-[14px] text-white placeholder:text-white/25 outline-none transition focus:border-lime/60 focus:bg-panel2"
      />
    </label>
  );
}

export function PrimaryCta({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex h-[54px] items-center justify-center rounded-full bg-lime font-display text-[15px] font-semibold uppercase tracking-[0.14em] text-black shadow-[0_10px_30px_rgba(198,242,50,0.3)] transition hover:brightness-110"
    >
      {children}
    </Link>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/30">
      <span className="h-px flex-1 bg-white/10" />
      or continue with
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

const SOCIALS = [
  {
    name: "Google",
    node: (
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
        <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.42-1.7 4.16-5.5 4.16A6.26 6.26 0 0 1 12 5.74c1.6 0 2.68.68 3.3 1.26l2.6-2.5C16.2 2.93 14.3 2.1 12 2.1A9.9 9.9 0 1 0 12 21.9c5.73 0 9.5-4.03 9.5-9.7 0-.65-.07-1.15-.16-1.65H12Z" transform="scale(0.92) translate(1 1)" />
      </svg>
    ),
  },
  {
    name: "Apple",
    node: (
      <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
        <path d="M16.6 12.9c0-2.4 2-3.6 2.1-3.66-1.14-1.66-2.9-1.9-3.52-1.92-1.5-.15-2.93.88-3.7.88-.76 0-1.94-.86-3.18-.84-1.64.03-3.15.95-4 2.42-1.7 2.96-.43 7.34 1.23 9.74.82 1.18 1.8 2.5 3.08 2.45 1.24-.05 1.7-.8 3.2-.8 1.5 0 1.9.8 3.2.78 1.32-.02 2.16-1.2 2.97-2.4.93-1.36 1.31-2.68 1.33-2.75-.03-.01-2.57-.98-2.6-3.9ZM14.2 5.6c.67-.82 1.13-1.95 1-3.1-.97.04-2.15.65-2.85 1.46-.62.72-1.17 1.88-1.02 2.98 1.08.09 2.2-.55 2.87-1.34Z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    node: (
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
        <path fill="#1877F2" d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.5-3.9 3.77-3.9 1.1 0 2.24.2 2.24.2v2.46H15.2c-1.24 0-1.63.78-1.63 1.57V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" />
      </svg>
    ),
  },
];

export function SocialRow() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {SOCIALS.map((s) => (
        <button
          key={s.name}
          type="button"
          aria-label={`Continuar con ${s.name}`} data-tip={s.name}
          className="flex h-[50px] items-center justify-center rounded-2xl border border-white/10 bg-panel transition hover:border-lime/40 hover:bg-panel2"
        >
          {s.node}
        </button>
      ))}
    </div>
  );
}
