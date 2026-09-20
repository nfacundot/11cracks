"use client";

import Link from "next/link";
import { useState } from "react";
import { Field, PrimaryCta, SocialRow } from "./auth-parts";
import { LogoMark } from "./logo-mark";

type Mode = "login" | "register";

export default function AuthDesktopScreen() {
  const [mode, setMode] = useState<Mode>("login");

  return (
    <div className="grid min-h-dvh grid-cols-1 bg-ink lg:grid-cols-[1.05fr_1fr]">
      {/* brand side */}
      <aside className="screen-bg relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 45% at 70% 15%, rgba(198,242,50,0.14), transparent 70%), radial-gradient(50% 40% at 15% 90%, rgba(198,242,50,0.08), transparent 70%)",
          }}
        />
        <span className="relative flex items-center gap-3">
          <LogoMark className="size-10" />
          <span className="font-display text-[18px] font-bold tracking-[0.18em] text-white">
            GOAL<span className="text-lime">50</span>
          </span>
        </span>

        <div className="relative">
          <h2 className="font-display text-[46px] font-semibold leading-[1.1] text-white">
            Cada partido.
            <br />
            En vivo.{" "}
            <span className="text-lime">Una app.</span>
          </h2>
          <p className="mt-4 max-w-[380px] text-[15px] leading-relaxed text-white/55">
            Sigue UEFA, Premier League y EFL, consulta las cuotas en tiempo
            real y apuesta en dos toques.
          </p>
          <ul className="mt-8 space-y-3 text-[14px] text-white/75">
            {[
              "Streams en HD con cuotas en tiempo real",
              "Alertas de inicio al instante para tus favoritos",
              "Boletos y pagos con un solo toque",
            ].map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span className="flex size-5 items-center justify-center rounded-full bg-lime/15 text-[11px] text-lime">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex -space-x-3">
          {(["uefa", "pl", "efl", "bvb", "fcb"] as const).map((t) => (
            <span key={t} className="inline-flex size-10 items-center justify-center rounded-full bg-panel text-[10px] font-bold uppercase text-white/85 ring-2 ring-ink">
              {t}
            </span>
          ))}
        </div>
      </aside>

      {/* form side */}
      <main className="flex flex-col justify-center bg-white px-6 py-12 sm:px-14">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="flex items-center gap-3 lg:hidden">
            <LogoMark className="size-8" />
            <span className="font-display text-[15px] font-bold tracking-[0.18em] text-ink">
              GOAL<span className="text-lime">50</span>
            </span>
          </div>

          <h1 className="mt-6 text-[30px] font-bold tracking-tight text-[#141c10] lg:mt-0">
            {mode === "login" ? "Bienvenido de nuevo" : "Únete al juego 🔥"}
          </h1>
          <p className="mt-2 text-[14px] text-[#6d7a68]">
            {mode === "login"
              ? "Inicia sesión para seguir tus partidos en vivo, favoritos y apuestas."
              : "Crea tu cuenta para ver partidos, seguir cuotas y apostar."}
          </p>

          {/* same-page toggle */}
          <div className="mt-7 grid grid-cols-2 rounded-2xl bg-[#eef2ea] p-1.5">
            {(
              [
                ["login", "Iniciar sesión"],
                ["register", "Crear cuenta"],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-xl py-2.5 text-[14px] font-semibold transition ${
                  mode === m ? "bg-ink text-white shadow" : "text-[#4c564a] hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form className="mt-7 space-y-4 [&_span]:text-[#6d7a68] [&_input]:border-[#dbe3d6] [&_input]:bg-[#f7f9f4] [&_input]:text-[#141c10] [&_input]:placeholder:text-[#a5b09e]">
            {mode === "register" ? (
              <Field label="Nombre completo" placeholder="Alex Kerr" autoComplete="name" />
            ) : null}
            <Field label="Correo electrónico" type="email" placeholder="you@goal50.app" autoComplete="email" />
            <Field
              label="Contraseña"
              type="password"
              placeholder={mode === "login" ? "••••••••" : "Mín. 8 caracteres"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />

            {mode === "register" ? (
              <label className="flex items-start gap-3 pt-1 text-[12.5px] leading-relaxed text-[#6d7a68]">
                <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[#141c10]" />
                <span>
                  Acepto los <span className="font-semibold text-[#141c10]">Términos del servicio</span> y la{" "}
                  <span className="font-semibold text-[#141c10]">Política de privacidad</span>, y confirmo que tengo 18 años o más.
                </span>
              </label>
            ) : (
              <div className="flex justify-end">
                <button type="button" className="text-[12px] font-semibold text-[#141c10] underline-offset-2 hover:underline">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <div className="pt-1 [&_a]:shadow-none">
              <PrimaryCta href="/">
                {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </PrimaryCta>
            </div>
          </form>

          <div className="mt-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a5b09e]">
            <span className="h-px flex-1 bg-[#e2e8dc]" />
            o continúa con
            <span className="h-px flex-1 bg-[#e2e8dc]" />
          </div>
          <div className="mt-5 [&_button]:border-[#dbe3d6] [&_button]:bg-[#f7f9f4] [&_svg]:text-[#141c10]">
            <SocialRow />
          </div>

          <p className="mt-8 text-center text-[13px] text-[#6d7a68]">
            {mode === "login" ? "¿Nuevo en GOAL50? " : "¿Ya tienes cuenta? "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="font-semibold text-[#141c10] underline-offset-2 hover:underline"
            >
              {mode === "login" ? "Crear cuenta" : "Iniciar sesión"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
