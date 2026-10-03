"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export type WorldPlayerInfo = {
  id: string;
  name: string;
  username: string;
  teamName: string | null;
  teamLogoUrl: string | null;
  // true cuando el id corresponde a una cuenta real (no a un sessionId).
  account?: boolean;
};

type FriendRelation = "loading" | "none" | "outgoing" | "incoming" | "friends";

function TeamLogo({ name, url }: { name: string | null; url: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name ?? "Equipo"} className="size-7 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-black" style={{ borderColor: "var(--g50-glass-border)", background: "var(--g50-tile)", color: "var(--g50-on-glass-dim)" }}>
      {(name ?? "?").charAt(0).toUpperCase()}
    </span>
  );
}

function Item({ children, onClick, danger, disabled }: { children: ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`goal50-text w-full px-3.5 py-2 text-left text-[12.5px] font-semibold transition hover:bg-white/10 disabled:opacity-50 ${danger ? "text-[#ff5f57]" : ""}`}
    >
      {children}
    </button>
  );
}

export function PlayerContextMenu({
  player,
  x,
  y,
  onClose,
}: {
  player: WorldPlayerInfo;
  x: number;
  y: number;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [relation, setRelation] = useState<FriendRelation>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Se valida contra el servidor: solo un id real devuelve un status válido.
  const [validId, setValidId] = useState(player.account ?? false);

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("contextmenu", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("contextmenu", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    let active = true;
    fetch(`/api/friends/status?userId=${encodeURIComponent(player.id)}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("bad");
        return (await res.json()) as { status?: FriendRelation; valid?: boolean };
      })
      .then((data) => {
        if (!active) return;
        setValidId(data.valid !== false);
        setRelation(data.status ?? "none");
      })
      .catch(() => {
        if (!active) return;
        setValidId(false);
        setRelation("none");
      });
    return () => {
      active = false;
    };
  }, [player.id]);

  const dispatch = (name: string, detail?: unknown) => {
    if (!validId) {
      setError("Este jugador no tiene perfil disponible.");
      return;
    }
    window.dispatchEvent(new CustomEvent(name, { detail }));
    onClose();
  };

  const friendAction = async () => {
    if (relation === "loading" || busy || !validId) return;
    setBusy(true);
    setError(null);
    try {
      if (relation === "outgoing" || relation === "friends") {
        const res = await fetch(`/api/friends?userId=${encodeURIComponent(player.id)}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        setRelation("none");
      } else {
        const res = await fetch("/api/friends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: player.id, action: relation === "incoming" ? "accept" : "request" }),
        });
        if (!res.ok) throw new Error();
        const data = (await res.json().catch(() => null)) as { status?: FriendRelation } | null;
        setRelation(data?.status ?? (relation === "incoming" ? "friends" : "outgoing"));
      }
      window.dispatchEvent(new CustomEvent("goal50:friends-changed"));
    } catch {
      setError("No se pudo completar la acción.");
    } finally {
      setBusy(false);
    }
  };

  const friendLabel =
    relation === "loading"
      ? "…"
      : relation === "outgoing"
        ? "Solicitud enviada · cancelar"
        : relation === "incoming"
          ? `Aceptar solicitud de ${player.name}`
          : relation === "friends"
            ? "Eliminar amistad"
            : `Ser amigo de ${player.name}`;

  const width = 256;
  const left = Math.min(x, Math.max(8, (typeof window !== "undefined" ? window.innerWidth : x + width) - width - 8));
  const top = Math.min(y, Math.max(8, (typeof window !== "undefined" ? window.innerHeight : y + 320) - 340));

  return (
    <div
      ref={ref}
      className="fixed z-[2147483600] overflow-hidden rounded-xl border shadow-2xl"
      style={{ left, top, width, background: "var(--g50-win-header)", borderColor: "var(--g50-glass-border)" }}
    >
      <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
        <div className="min-w-0">
          <p className="goal50-text truncate text-[13px] font-bold">{player.name}</p>
          {player.username ? (
            <p className="goal50-text-dim truncate text-[10px] font-semibold uppercase tracking-[0.08em]">@{player.username}</p>
          ) : null}
        </div>
        <TeamLogo name={player.name} url={null} />
      </div>
      <div className="flex items-center justify-between gap-3 px-3.5 py-2" style={{ background: "var(--g50-tile)" }}>
        <span className="goal50-text truncate text-[11px] font-bold uppercase tracking-[0.08em]">{player.teamName ?? "Sin equipo"}</span>
        <TeamLogo name={player.teamName} url={player.teamLogoUrl} />
      </div>

      {!validId ? (
        <p className="goal50-text-dim border-t px-3.5 py-2 text-[11px]" style={{ borderColor: "var(--g50-glass-border)" }}>
          Este jugador se mostró sin cuenta conectada. Vuelve a intentarlo cuando esté en línea.
        </p>
      ) : null}

      <div className="border-t" style={{ borderColor: "var(--g50-glass-border)" }} />
      <Item onClick={() => dispatch("goal50:open-player-profile", { userId: player.id })} disabled={!validId}>
        Ver Perfil de {player.name}
      </Item>
      <Item onClick={() => void friendAction()} disabled={!validId || relation === "loading" || busy}>
        {friendLabel}
      </Item>
      <Item onClick={() => dispatch("goal50:open-messages", { userId: player.id })} disabled={!validId}>
        Hablarle en privado
      </Item>
      <Item onClick={() => dispatch("goal50:open-messages", { userId: player.id, focus: true })} disabled={!validId}>
        Mandar mensaje
      </Item>

      {error ? (
        <p className="border-t px-3.5 py-2 text-[11px] text-[#ff5f57]" style={{ borderColor: "var(--g50-glass-border)" }}>
          {error}
        </p>
      ) : null}

      <div className="border-t" style={{ borderColor: "var(--g50-glass-border)" }} />
      <Item onClick={onClose} danger>
        Cancelar opciones
      </Item>
    </div>
  );
}
