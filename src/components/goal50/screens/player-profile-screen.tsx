"use client";

import { useEffect, useState } from "react";
import { AvatarViewer } from "@/components/player/avatar-viewer";
import { roleLabel } from "@/lib/roles";
import type { AvatarConfig } from "@/lib/avatar";

type PlayerProfile = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  avatarConfig: AvatarConfig;
  bio: string | null;
  position: string | null;
  favoriteTeam: string | null;
  country: string | null;
  role: string;
  xp: number;
  coins: number;
  trophies: number;
  streak: number;
  teamName: string | null;
  teamLogoUrl: string | null;
};

const CARD_STYLE = { background: "var(--g50-msgbox)", borderColor: "var(--g50-glass-border)" } as const;
const CHIP_STYLE = { background: "var(--g50-tile)", borderColor: "var(--g50-glass-border)" } as const;

export default function PlayerProfileScreen({ userId }: { userId: string }) {
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/players/${userId}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("bad"))))
      .then((data: { player?: PlayerProfile }) => {
        if (active) setPlayer(data.player ?? null);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  if (failed) {
    return <p className="goal50-text-dim p-6 text-center text-[12px]">No se pudo cargar el perfil.</p>;
  }
  if (!player) {
    return <p className="goal50-text-dim p-6 text-center text-[12px]">Cargando…</p>;
  }

  const stats = [
    { label: "XP", value: `${player.xp}` },
    { label: "Coins", value: `${player.coins}` },
    { label: "Trofeos", value: `${player.trophies}` },
    { label: "Racha", value: `${player.streak}` },
  ];

  const details = [
    { label: "Posición", value: player.position },
    { label: "Equipo favorito", value: player.favoriteTeam },
    { label: "País", value: player.country },
  ].filter((item) => item.value);

  return (
    <div className="no-scrollbar h-full overflow-y-auto p-4 md:p-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="lg:sticky lg:top-0 lg:h-max">
          <div className="relative h-[340px] overflow-hidden rounded-2xl border lg:h-[calc(100vh-180px)]" style={CARD_STYLE}>
            <AvatarViewer config={player.avatarConfig} className="h-full w-full" />
          </div>
          <p className="goal50-text-dim mt-2 text-center text-[11px]">Arrastra el modelo para girarlo</p>
        </div>

        <div className="flex flex-col gap-3">
          <section className="rounded-2xl border p-4 md:p-5" style={CARD_STYLE}>
            <span className="goal50-text-dim text-[10px] font-bold uppercase tracking-[0.22em]">Identidad</span>
            <p className="goal50-text mt-1.5 text-[24px] font-extrabold uppercase leading-none tracking-tight">{player.name}</p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <div className="flex flex-1 items-center justify-between gap-3 rounded-xl border px-3 py-2.5" style={CHIP_STYLE}>
                <span className="goal50-text-dim text-[10px] font-semibold uppercase tracking-[0.06em]">Usuario</span>
                <span className="goal50-text max-w-[65%] truncate text-[12.5px] font-bold">@{player.username}</span>
              </div>
              <div className="flex flex-1 items-center justify-between gap-3 rounded-xl border px-3 py-2.5" style={CHIP_STYLE}>
                <span className="goal50-text-dim text-[10px] font-semibold uppercase tracking-[0.06em]">Rol</span>
                <span className="goal50-text max-w-[65%] truncate text-[12.5px] font-bold">{roleLabel(player.role)}</span>
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
          </section>

          <section className="rounded-2xl border p-4 md:p-5" style={CARD_STYLE}>
            <div className="flex items-center gap-3">
              {player.teamLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={player.teamLogoUrl} alt={player.teamName ?? "Equipo"} className="size-10 rounded-full object-cover" />
              ) : (
                <span className="flex size-10 items-center justify-center rounded-full border text-[14px] font-black" style={CHIP_STYLE}>
                  {(player.teamName ?? "?").charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="goal50-text-dim text-[10px] font-semibold uppercase tracking-[0.1em]">Equipo</p>
                <p className="goal50-text truncate text-[14px] font-bold">{player.teamName ?? "Sin equipo"}</p>
              </div>
            </div>
          </section>

          {player.bio || details.length > 0 ? (
            <section className="rounded-2xl border p-4 md:p-5" style={CARD_STYLE}>
              {player.bio ? <p className="goal50-text-dim text-[12px] leading-relaxed">{player.bio}</p> : null}
              {details.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {details.map((item) => (
                    <span key={item.label} className="rounded-full border px-3 py-1 text-[11px] font-semibold" style={CHIP_STYLE}>
                      <span className="goal50-text-dim">{item.label}: </span>
                      <span className="goal50-text">{item.value}</span>
                    </span>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("goal50:open-messages", { detail: { userId: player.id } }))}
            className="self-start rounded-lg bg-lime px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.08em] text-black transition hover:brightness-110"
          >
            Mandar mensaje
          </button>
        </div>
      </div>
    </div>
  );
}
