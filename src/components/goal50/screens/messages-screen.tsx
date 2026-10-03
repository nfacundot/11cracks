"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ConversationDto, DirectMessageDto } from "@/lib/direct-messages";

type Peer = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  teamName: string | null;
  teamLogoUrl: string | null;
};

const CARD_STYLE = { background: "var(--g50-msgbox)", borderColor: "var(--g50-glass-border)" } as const;
const CHIP_STYLE = { background: "var(--g50-tile)", borderColor: "var(--g50-glass-border)" } as const;

function formatWhen(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay
    ? date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("es", { day: "numeric", month: "short" });
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} className="size-9 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border text-[12px] font-black" style={CHIP_STYLE}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export default function MessagesScreen({
  initialUserId,
  focusComposer,
}: {
  initialUserId?: string | null;
  focusComposer?: boolean;
}) {
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [messages, setMessages] = useState<DirectMessageDto[]>([]);
  const [me, setMe] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/messages", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { conversations: [] }))
      .then((data: { conversations?: ConversationDto[] }) => {
        if (!active) return;
        const list = data.conversations ?? [];
        setConversations(list);
        const first = initialUserId ?? list[0]?.userId ?? null;
        setActiveId(first);
        if (!first) {
          setLoading(false);
          return;
        }
        return fetch(`/api/messages/${first}`, { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : null))
          .then((thread: { me: string; peer: Peer; messages: DirectMessageDto[] } | null) => {
            if (!active || !thread) return;
            setMe(thread.me);
            setPeer(thread.peer);
            setMessages(thread.messages ?? []);
            window.dispatchEvent(new CustomEvent("goal50:messages-read"));
          });
      })
      .catch(() => {
        /* sin conexión */
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [initialUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  useEffect(() => {
    if (focusComposer) inputRef.current?.focus();
  }, [focusComposer, activeId]);

  const refreshConversations = async () => {
    const res = await fetch("/api/messages", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { conversations?: ConversationDto[] };
    setConversations(data.conversations ?? []);
  };

  const openConversation = useCallback(async (userId: string) => {
    setActiveId(userId);
    const res = await fetch(`/api/messages/${userId}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { me: string; peer: Peer; messages: DirectMessageDto[] };
    setMe(data.me);
    setPeer(data.peer);
    setMessages(data.messages ?? []);
    setConversations((prev) => prev.map((item) => (item.userId === userId ? { ...item, unread: 0 } : item)));
    window.dispatchEvent(new CustomEvent("goal50:messages-read"));
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string }>).detail;
      if (detail?.userId) void openConversation(detail.userId);
    };
    window.addEventListener("goal50:messages-focus", handler);
    return () => window.removeEventListener("goal50:messages-focus", handler);
  }, [openConversation]);

  const send = async () => {
    const text = body.trim();
    if (!text || !activeId) return;
    setBody("");
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: activeId, body: text }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { message: DirectMessageDto };
    setMessages((prev) => [...prev, data.message]);
    void refreshConversations();
  };

  const remove = async (id: string) => {
    await fetch(`/api/messages?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setMessages((prev) => prev.filter((item) => item.id !== id));
    void refreshConversations();
  };

  return (
    <div className="h-full p-4 md:p-6">
      <div className="grid h-full gap-4 md:grid-cols-[300px_minmax(0,1fr)]">
        {/* ─── Conversaciones (más reciente primero) ─── */}
        <aside className="no-scrollbar flex h-full min-h-0 flex-col gap-1.5 overflow-y-auto rounded-2xl border p-2" style={CARD_STYLE}>
          <p className="goal50-text-dim px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">Mensajes</p>
          {loading ? (
            <p className="goal50-text-dim px-2 py-4 text-[12px]">Cargando…</p>
          ) : conversations.length === 0 ? (
            <p className="goal50-text-dim px-2 py-4 text-[12px]">Sin conversaciones todavía.</p>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.userId}
                type="button"
                onClick={() => openConversation(conversation.userId)}
                className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-left transition"
                style={{ background: activeId === conversation.userId ? "var(--g50-tile)" : "transparent" }}
              >
                <Avatar name={conversation.name} url={conversation.avatarUrl} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="goal50-text truncate text-[12.5px] font-bold">{conversation.name}</p>
                    <span className="goal50-text-dim ml-auto shrink-0 text-[9px] font-semibold">{formatWhen(conversation.lastAt)}</span>
                  </div>
                  <p className="goal50-text-dim truncate text-[11px]">{conversation.lastMessage}</p>
                </div>
                {conversation.unread > 0 ? (
                  <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[9px] font-bold text-white">
                    {conversation.unread > 99 ? "99+" : conversation.unread}
                  </span>
                ) : null}
              </button>
            ))
          )}
        </aside>

        {/* ─── Hilo ─── */}
        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border" style={CARD_STYLE}>
          {peer ? (
            <>
              <header className="flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: "var(--g50-glass-border)" }}>
                <Avatar name={peer.name} url={peer.avatarUrl} />
                <div className="min-w-0">
                  <p className="goal50-text truncate text-[13px] font-bold">{peer.name}</p>
                  <p className="goal50-text-dim truncate text-[10px] font-semibold uppercase tracking-[0.08em]">
                    {peer.teamName ?? "Sin equipo"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("goal50:open-player-profile", { detail: { userId: peer.id } }))}
                  className="goal50-tile goal50-text ml-auto rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em]"
                >
                  Ver perfil
                </button>
              </header>

              <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-3">
                {messages.length === 0 ? (
                  <p className="goal50-text-dim py-6 text-center text-[12px]">Sin mensajes. Escribe el primero.</p>
                ) : (
                  messages.map((message) => {
                    const mine = message.senderId === me;
                    return (
                      <div key={message.id} className={`group mb-2 flex items-center gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                        {mine ? (
                          <button
                            type="button"
                            onClick={() => remove(message.id)}
                            aria-label="Eliminar mensaje"
                            className="goal50-text-dim shrink-0 text-[12px] opacity-0 transition hover:text-[#ff5f57] group-hover:opacity-100"
                          >
                            🗑
                          </button>
                        ) : null}
                        <div
                          className="max-w-[75%] rounded-2xl px-3 py-2"
                          style={{ background: mine ? "rgba(198,242,50,0.18)" : "var(--g50-tile)" }}
                        >
                          <p className="goal50-text whitespace-pre-wrap break-words text-[12.5px]">{message.body}</p>
                          <p className="goal50-text-dim mt-0.5 text-[9px] font-semibold">{formatWhen(message.createdAt)}</p>
                        </div>
                        {!mine ? (
                          <button
                            type="button"
                            onClick={() => remove(message.id)}
                            aria-label="Eliminar mensaje"
                            className="goal50-text-dim shrink-0 text-[12px] opacity-0 transition hover:text-[#ff5f57] group-hover:opacity-100"
                          >
                            🗑
                          </button>
                        ) : null}
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void send();
                }}
                className="flex items-end gap-2 border-t p-3"
                style={{ borderColor: "var(--g50-glass-border)" }}
              >
                <textarea
                  ref={inputRef}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void send();
                    }
                  }}
                  rows={1}
                  maxLength={500}
                  placeholder={`Mensaje para ${peer.name}…`}
                  className="goal50-text max-h-28 min-h-9 flex-1 resize-none rounded-xl border px-3 py-2 text-[12.5px] outline-none"
                  style={CHIP_STYLE}
                />
                <button
                  type="submit"
                  disabled={!body.trim()}
                  className="rounded-xl bg-lime px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.08em] text-black transition hover:brightness-110 disabled:opacity-40"
                >
                  Enviar
                </button>
              </form>
            </>
          ) : (
            <p className="goal50-text-dim m-auto text-[12px]">Selecciona una conversación</p>
          )}
        </section>
      </div>
    </div>
  );
}
