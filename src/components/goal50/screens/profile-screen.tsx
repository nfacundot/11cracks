"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { AvatarViewer } from "@/components/player/avatar-viewer";
import { updateProfile, type ProfileState } from "@/actions/user";
import { roleLabel } from "@/lib/roles";
import type { AvatarConfig } from "@/lib/avatar";
import type { TrophyProgress } from "@/lib/trophies";

export type ProfileData = {
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  bio: string | null;
  position: string | null;
  favoriteTeam: string | null;
  country: string | null;
  avatarConfig: AvatarConfig;
};

type TabId = "usuario" | "trofeos" | "progreso";

const FIELD =
  "goal50-text w-full rounded-lg border px-2.5 py-2 text-[12.5px] font-semibold outline-none transition focus:border-lime/60";
const FIELD_STYLE = { background: "var(--g50-msgbox)", borderColor: "var(--g50-glass-border)" } as const;
const CARD_STYLE = { background: "var(--g50-msgbox)", borderColor: "var(--g50-glass-border)" } as const;
const CHIP_STYLE = { background: "var(--g50-tile)", borderColor: "var(--g50-glass-border)" } as const;
const TOOLTIP_STYLE = { background: "var(--g50-win-header)", borderColor: "var(--g50-glass-border)" } as const;

function UserTabIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M4.8 20c1.2-3.4 4-5.2 7.2-5.2s6 1.8 7.2 5.2" />
    </svg>
  );
}

const TABS: Array<{ id: TabId; label: string; icon: ReactNode }> = [
  { id: "usuario", label: "Usuario", icon: <UserTabIcon /> },
  { id: "trofeos", label: "Trofeos", icon: <span className="text-[14px] leading-none">🏆</span> },
  { id: "progreso", label: "En progreso", icon: <span className="text-[14px] leading-none">↗</span> },
];

function TrophyTooltip({ trophy }: { trophy: TrophyProgress }) {
  return (
    <div className="w-64 rounded-xl border p-3 shadow-2xl" style={TOOLTIP_STYLE}>
      <div className="flex items-start gap-3">
        <span className="text-[30px] leading-none">{trophy.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="goal50-text text-[13px] font-bold">{trophy.name}</p>
          <p className="goal50-text-dim text-[10px] font-semibold uppercase tracking-[0.1em]">{trophy.subtitle}</p>
        </div>
        <span className="text-[14px] font-bold" style={{ color: trophy.earned ? "#c6f232" : "var(--g50-on-glass-dim)" }}>
          {trophy.earned ? "✓" : "↗"}
        </span>
      </div>

      {trophy.description ? <p className="goal50-text-dim mt-2 text-[11px] leading-snug">{trophy.description}</p> : null}

      <div className="mt-2.5 flex items-center justify-between">
        <span className="goal50-text-dim text-[9px] font-semibold uppercase tracking-wide">{trophy.metricLabel}</span>
        <span className="goal50-text text-[11px] font-bold tabular-nums">
          {trophy.current} / {trophy.target}
          {trophy.unit}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15">
        <div className="h-full rounded-full" style={{ width: `${trophy.percent}%`, background: "#c6f232" }} />
      </div>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: trophy.earned ? "#c6f232" : "var(--g50-on-glass-dim)" }}>
        {trophy.earned ? "conseguido" : "en progreso"}
      </p>
    </div>
  );
}

function TrophyGrid({ trophies, emptyText }: { trophies: TrophyProgress[]; emptyText: string }) {
  const [hover, setHover] = useState<{ trophy: TrophyProgress; x: number; y: number; below: boolean } | null>(null);

  if (trophies.length === 0) {
    return (
      <div className="rounded-2xl border px-4 py-12 text-center" style={CARD_STYLE}>
        <div className="text-4xl">🏆</div>
        <p className="goal50-text-dim mt-3 text-[12px]">{emptyText}</p>
      </div>
    );
  }

  const show = (trophy: TrophyProgress, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setHover({ trophy, x: rect.left + rect.width / 2, y: rect.top, below: rect.top < 230 });
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">
        {trophies.map((trophy) => (
          <button
            key={trophy.id}
            type="button"
            aria-label={trophy.name}
            onMouseEnter={(event) => show(trophy, event.currentTarget)}
            onMouseLeave={() => setHover(null)}
            onFocus={(event) => show(trophy, event.currentTarget)}
            onBlur={() => setHover(null)}
            className="relative flex aspect-square items-center justify-center rounded-2xl border text-[34px] transition"
            style={{
              background: trophy.earned ? "var(--g50-tile)" : "var(--g50-msgbox)",
              borderColor: trophy.earned ? "rgba(198,242,50,0.5)" : "var(--g50-glass-border)",
              opacity: trophy.earned ? 1 : 0.82,
            }}
          >
            <span style={{ filter: trophy.earned ? "none" : "grayscale(0.75)" }}>{trophy.icon}</span>
            {trophy.earned ? (
              <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-[#c6f232] text-[10px] font-black leading-none text-black">
                ✓
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {hover ? (
        <div
          className="pointer-events-none fixed z-[2147483600]"
          style={{
            left: hover.x,
            top: hover.y,
            transform: hover.below ? "translate(-50%, 10px)" : "translate(-50%, calc(-100% - 10px))",
          }}
        >
          <TrophyTooltip trophy={hover.trophy} />
        </div>
      ) : null}
    </>
  );
}

export default function ProfileScreen({
  profile,
  streak,
  coins,
  bottles,
  kg,
}: {
  profile: ProfileData;
  streak: number;
  coins: number;
  bottles: number;
  kg: number;
}) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(updateProfile, undefined);
  const [tab, setTab] = useState<TabId>("usuario");
  const [trophies, setTrophies] = useState<TrophyProgress[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/trophies", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("bad"))))
      .then((data: { trophies?: TrophyProgress[] }) => {
        if (active) setTrophies(data.trophies ?? []);
      })
      .catch(() => {
        if (active) setTrophies([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = [
    { label: "Racha", value: `${streak}` },
    { label: "Coins", value: `${coins}` },
    { label: "Botellas", value: `${bottles}` },
    { label: "KG", value: kg.toFixed(1) },
  ];

  const fields = [
    { name: "name", label: "Nombre", defaultValue: profile.name, required: true, minLength: 2, maxLength: 50, placeholder: "" },
    { name: "position", label: "Posición", defaultValue: profile.position ?? "", placeholder: "Portero, Defensa…" },
    { name: "favoriteTeam", label: "Equipo favorito", defaultValue: profile.favoriteTeam ?? "", placeholder: "Real Madrid, Boca…" },
    { name: "country", label: "País", defaultValue: profile.country ?? "", placeholder: "Colombia, Argentina…" },
  ];

  const earned = trophies?.filter((trophy) => trophy.earned) ?? [];
  const inProgress = trophies?.filter((trophy) => !trophy.earned) ?? [];

  return (
    <div className="relative h-full">
      <div className="no-scrollbar h-full overflow-y-auto p-4 md:p-6">
        <div className="grid gap-4 lg:grid-cols-2">
          {/* ─── Columna izquierda: avatar 3D exclusivo ─── */}
          <div className="lg:sticky lg:top-0 lg:h-max">
            <div
              className="relative h-[340px] min-h-[340px] overflow-hidden rounded-2xl border lg:h-[calc(100vh-180px)]"
              style={CARD_STYLE}
            >
              <AvatarViewer config={profile.avatarConfig} className="h-full w-full" />
            </div>
            <p className="goal50-text-dim mt-2 text-center text-[11px]">
              Arrastra el modelo para girarlo · gira solo lentamente
            </p>
          </div>

          {/* ─── Columna derecha: tabs + formularios ─── */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {TABS.map((item) => {
                const isActive = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className="flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[12px] font-bold uppercase tracking-[0.06em] transition"
                    style={{
                      background: isActive ? "var(--g50-tile)" : "var(--g50-msgbox)",
                      borderColor: isActive ? "rgba(198,242,50,0.55)" : "var(--g50-glass-border)",
                      color: isActive ? "var(--g50-on-glass)" : "var(--g50-on-glass-dim)",
                    }}
                  >
                    {item.icon}
                    {item.label}
                    {item.id !== "usuario" && trophies ? (
                      <span className="goal50-text-dim text-[10px] tabular-nums">
                        {item.id === "trofeos" ? trophies.length : inProgress.length}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {tab === "usuario" ? (
              <>
                <section className="rounded-2xl border p-4 md:p-5" style={CARD_STYLE}>
                  <span className="goal50-text-dim text-[10px] font-bold uppercase tracking-[0.22em]">Identidad</span>
                  <p className="goal50-text mt-1.5 text-[24px] font-extrabold uppercase leading-none tracking-tight">{profile.name}</p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <div className="flex flex-1 items-center justify-between gap-3 rounded-xl border px-3 py-2.5" style={CHIP_STYLE}>
                      <span className="goal50-text-dim text-[10px] font-semibold uppercase tracking-[0.06em]">Correo</span>
                      <span className="goal50-text max-w-[65%] truncate text-[12.5px] font-bold">{profile.email}</span>
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-3 rounded-xl border px-3 py-2.5" style={CHIP_STYLE}>
                      <span className="goal50-text-dim text-[10px] font-semibold uppercase tracking-[0.06em]">Rol</span>
                      <span className="goal50-text max-w-[65%] truncate text-[12.5px] font-bold">{roleLabel(profile.role)}</span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {stats.map((stat) => (
                      <div key={stat.label} className="rounded-xl border px-2 py-2.5 text-center" style={CHIP_STYLE}>
                        <p className="goal50-text text-[16px] font-bold tabular-nums">{stat.value}</p>
                        <p className="goal50-text-dim text-[9px] font-semibold uppercase tracking-wide">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent("goal50:open-friends"))}
                    className="goal50-tile goal50-text mt-3 w-full rounded-xl px-3 py-2 text-[12px] font-bold uppercase tracking-[0.08em] transition"
                  >
                    Amigos
                  </button>
                </section>

                <form action={formAction} className="flex flex-col gap-3 rounded-2xl border p-4 md:p-5" style={CARD_STYLE}>
                  <div>
                    <h3 className="goal50-text text-[12px] font-extrabold uppercase tracking-[0.08em]">Datos personales</h3>
                    <p className="goal50-text-dim text-[10px] font-semibold uppercase tracking-[0.1em]">Actualiza tu información</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {fields.map((field) => (
                      <label key={field.name} className="flex flex-col gap-1">
                        <span className="goal50-text-dim text-[10px] font-semibold uppercase tracking-[0.08em]">{field.label}</span>
                        <input
                          name={field.name}
                          type="text"
                          defaultValue={field.defaultValue}
                          placeholder={field.placeholder}
                          required={field.required}
                          minLength={field.minLength}
                          maxLength={field.maxLength}
                          className={FIELD}
                          style={FIELD_STYLE}
                        />
                      </label>
                    ))}
                  </div>

                  <label className="flex flex-col gap-1">
                    <span className="goal50-text-dim text-[10px] font-semibold uppercase tracking-[0.08em]">Biografía</span>
                    <textarea
                      name="bio"
                      defaultValue={profile.bio ?? ""}
                      rows={4}
                      maxLength={160}
                      placeholder="Cuéntanos de ti…"
                      className={`${FIELD} resize-none`}
                      style={FIELD_STYLE}
                    />
                  </label>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={pending}
                      className="rounded-lg bg-lime px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.08em] text-black transition hover:brightness-110 disabled:opacity-50"
                    >
                      {pending ? "Guardando…" : "Guardar cambios"}
                    </button>
                    {state?.error ? <p className="text-[12px] font-bold text-[#ff5f57]">{state.error}</p> : null}
                    {state?.success ? <p className="text-[12px] font-bold text-lime">{state.success}</p> : null}
                  </div>
                </form>
              </>
            ) : null}

            {tab === "trofeos" ? (
              trophies === null ? (
                <p className="goal50-text-dim py-10 text-center text-[12px]">Cargando trofeos…</p>
              ) : (
                <>
                  <p className="goal50-text-dim text-[11px]">
                    {earned.length} de {trophies.length} conseguidos · pasa el cursor por un trofeo para ver el detalle
                  </p>
                  <TrophyGrid trophies={trophies} emptyText="Aún no hay trofeos disponibles." />
                </>
              )
            ) : null}

            {tab === "progreso" ? (
              trophies === null ? (
                <p className="goal50-text-dim py-10 text-center text-[12px]">Cargando trofeos…</p>
              ) : (
                <>
                  <p className="goal50-text-dim text-[11px]">
                    Trofeos en proceso de conseguirse · pasa el cursor para ver el detalle
                  </p>
                  <TrophyGrid trophies={inProgress} emptyText="¡Todo conseguido! No tienes trofeos en progreso." />
                </>
              )
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
