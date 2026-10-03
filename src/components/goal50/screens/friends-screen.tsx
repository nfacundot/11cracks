"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { FriendRelation, FriendUser } from "@/lib/friends";

const CARD_STYLE = { background: "var(--g50-msgbox)", borderColor: "var(--g50-glass-border)" } as const;
const CHIP_STYLE = { background: "var(--g50-tile)", borderColor: "var(--g50-glass-border)" } as const;

type FriendsPayload = { friends: FriendUser[]; incoming: FriendUser[]; outgoing: FriendUser[] };
type SearchResult = FriendUser & { status: FriendRelation };

function Avatar({ name, url, online }: { name: string; url: string | null; online?: boolean }) {
  return (
    <span className="relative shrink-0">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="size-10 rounded-full object-cover" />
      ) : (
        <span className="flex size-10 items-center justify-center rounded-full border text-[13px] font-black" style={CHIP_STYLE}>
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      {online !== undefined ? (
        <span
          className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 ${online ? "bg-[#7bd44a]" : "bg-[#686862]"}`}
          style={{ borderColor: "var(--g50-win-body)" }}
        />
      ) : null}
    </span>
  );
}

function Person({ user, online, children }: { user: FriendUser; online?: boolean; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border px-3 py-2.5" style={CARD_STYLE}>
      <Avatar name={user.name} url={user.avatarUrl} online={online} />
      <div className="min-w-0 flex-1">
        <p className="goal50-text truncate text-[13px] font-bold">{user.name}</p>
        <p className="goal50-text-dim truncate text-[10px] font-semibold uppercase tracking-[0.08em]">
          {user.teamName ?? "Sin equipo"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">{children}</div>
    </div>
  );
}

function Action({
  children,
  onClick,
  tone,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: "primary" | "danger" | "ghost";
  disabled?: boolean;
}) {
  const style =
    tone === "primary"
      ? "bg-lime text-black"
      : tone === "danger"
        ? "border border-[#ff5f57]/30 text-[#ff5f57] hover:bg-[#ff5f57]/10"
        : "goal50-tile goal50-text";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.04em] transition disabled:opacity-40 ${style}`}
    >
      {children}
    </button>
  );
}

function TabButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-[12px] font-bold uppercase tracking-[0.06em] transition"
      style={{
        background: active ? "var(--g50-tile)" : "var(--g50-msgbox)",
        borderColor: active ? "rgba(198,242,50,0.55)" : "var(--g50-glass-border)",
        color: active ? "var(--g50-on-glass)" : "var(--g50-on-glass-dim)",
      }}
    >
      {label}
      <span className="goal50-text-dim text-[10px] tabular-nums">{count}</span>
    </button>
  );
}

export default function FriendsScreen() {
  const [data, setData] = useState<FriendsPayload | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [tab, setTab] = useState<"online" | "offline">("online");
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/friends", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("bad"))))
      .then((payload: Partial<FriendsPayload>) => {
        if (active) {
          setData({ friends: payload.friends ?? [], incoming: payload.incoming ?? [], outgoing: payload.outgoing ?? [] });
        }
      })
      .catch(() => {
        if (active) setData({ friends: [], incoming: [], outgoing: [] });
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    const handler = () => setReloadKey((key) => key + 1);
    window.addEventListener("goal50:friends-changed", handler);
    return () => window.removeEventListener("goal50:friends-changed", handler);
  }, []);

  useEffect(() => {
    if (!addOpen) return;
    const term = query.trim();
    if (term.length < 2) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setSearching(true);
      fetch(`/api/friends/search?q=${encodeURIComponent(term)}`, { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : { results: [] }))
        .then((payload: { results?: SearchResult[] }) => {
          if (active) setResults(payload.results ?? []);
        })
        .catch(() => {
          if (active) setResults([]);
        })
        .finally(() => {
          if (active) setSearching(false);
        });
    }, 280);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [addOpen, query]);

  const reload = () => {
    setReloadKey((key) => key + 1);
    window.dispatchEvent(new CustomEvent("goal50:friends-changed"));
  };

  const request = async (userId: string, action?: "accept") => {
    setBusyId(userId);
    await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    }).catch(() => {});
    setBusyId(null);
    setResults((prev) =>
      prev.map((item) =>
        item.id === userId
          ? { ...item, status: item.status === "incoming" || action === "accept" ? "friends" : "outgoing" }
          : item,
      ),
    );
    reload();
  };

  const remove = async (userId: string) => {
    setBusyId(userId);
    await fetch(`/api/friends?userId=${encodeURIComponent(userId)}`, { method: "DELETE" }).catch(() => {});
    setBusyId(null);
    setResults((prev) => prev.map((item) => (item.id === userId ? { ...item, status: "none" } : item)));
    reload();
  };

  const openProfile = (userId: string) => window.dispatchEvent(new CustomEvent("goal50:open-player-profile", { detail: { userId } }));
  const openMessage = (userId: string) => window.dispatchEvent(new CustomEvent("goal50:open-messages", { detail: { userId } }));

  const friends = data?.friends ?? [];
  const incoming = data?.incoming ?? [];
  const outgoing = data?.outgoing ?? [];

  const online = friends.filter((user) => user.online);
  const offline = friends.filter((user) => !user.online);
  const visible = tab === "online" ? online : offline;

  return (
    <div className="no-scrollbar h-full overflow-y-auto p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4">
        <header className="flex items-end justify-between gap-3">
          <div>
            <h1 className="goal50-text text-[20px] font-extrabold uppercase leading-none tracking-tight">Amigos</h1>
            <p className="goal50-text-dim mt-1 text-[12px]">
              {friends.length} {friends.length === 1 ? "amigo" : "amigos"} · {online.length} conectado{online.length === 1 ? "" : "s"}
            </p>
          </div>
          <Action tone={addOpen ? "ghost" : "primary"} onClick={() => setAddOpen((value) => !value)}>
            {addOpen ? "Cerrar" : "Agregar amigo"}
          </Action>
        </header>

        {addOpen ? (
          <section className="flex flex-col gap-3 rounded-2xl border p-4" style={CARD_STYLE}>
            <div className="flex items-center gap-2 rounded-xl border px-3" style={CHIP_STYLE}>
              <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4.5 4.5" />
              </svg>
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Busca por nombre o @usuario"
                maxLength={40}
                className="goal50-text h-10 min-w-0 flex-1 bg-transparent text-[12.5px] outline-none"
              />
            </div>

            {query.trim().length < 2 ? (
              <p className="goal50-text-dim px-1 text-[11.5px]">Escribe al menos 2 letras para buscar jugadores.</p>
            ) : searching ? (
              <p className="goal50-text-dim px-1 text-[11.5px]">Buscando…</p>
            ) : results.length === 0 ? (
              <p className="goal50-text-dim px-1 text-[11.5px]">Sin resultados.</p>
            ) : (
              results.map((user) => (
                <Person key={user.id} user={user} online={user.online}>
                  {user.status === "friends" ? (
                    <Action onClick={() => openMessage(user.id)}>Mensaje</Action>
                  ) : user.status === "incoming" ? (
                    <>
                      <Action tone="primary" disabled={busyId === user.id} onClick={() => void request(user.id, "accept")}>
                        Aceptar
                      </Action>
                      <Action tone="danger" disabled={busyId === user.id} onClick={() => void remove(user.id)}>
                        Rechazar
                      </Action>
                    </>
                  ) : user.status === "outgoing" ? (
                    <Action tone="ghost" disabled={busyId === user.id} onClick={() => void remove(user.id)}>
                      Cancelar
                    </Action>
                  ) : (
                    <Action tone="primary" disabled={busyId === user.id} onClick={() => void request(user.id)}>
                      Agregar
                    </Action>
                  )}
                </Person>
              ))
            )}
          </section>
        ) : null}

        {incoming.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h2 className="goal50-text-dim text-[10px] font-bold uppercase tracking-[0.16em]">Solicitudes recibidas</h2>
            {incoming.map((user) => (
              <Person key={user.id} user={user} online={user.online}>
                <Action tone="primary" disabled={busyId === user.id} onClick={() => void request(user.id, "accept")}>Aceptar</Action>
                <Action tone="danger" disabled={busyId === user.id} onClick={() => void remove(user.id)}>Rechazar</Action>
              </Person>
            ))}
          </section>
        ) : null}

        {outgoing.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h2 className="goal50-text-dim text-[10px] font-bold uppercase tracking-[0.16em]">Solicitudes enviadas</h2>
            {outgoing.map((user) => (
              <Person key={user.id} user={user} online={user.online}>
                <Action tone="ghost" disabled={busyId === user.id} onClick={() => void remove(user.id)}>Cancelar</Action>
              </Person>
            ))}
          </section>
        ) : null}

        <div className="flex gap-2">
          <TabButton active={tab === "online"} label="Conectados" count={online.length} onClick={() => setTab("online")} />
          <TabButton active={tab === "offline"} label="Desconectados" count={offline.length} onClick={() => setTab("offline")} />
        </div>

        <section className="flex flex-col gap-2">
          {data === null ? (
            <p className="goal50-text-dim py-10 text-center text-[12px]">Cargando…</p>
          ) : visible.length === 0 ? (
            <p className="rounded-2xl border px-4 py-10 text-center text-[12px]" style={{ ...CARD_STYLE, color: "var(--g50-on-glass-dim)" }}>
              {friends.length === 0
                ? "Todavía no tienes amigos. Usa “Agregar amigo” para buscar jugadores."
                : tab === "online"
                  ? "Ningún amigo conectado ahora mismo."
                  : "No hay amigos desconectados."}
            </p>
          ) : (
            visible.map((user) => (
              <Person key={user.id} user={user} online={user.online}>
                <Action onClick={() => openProfile(user.id)}>Perfil</Action>
                <Action onClick={() => openMessage(user.id)}>Mensaje</Action>
                <Action tone="danger" disabled={busyId === user.id} onClick={() => void remove(user.id)}>Quitar</Action>
              </Person>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
