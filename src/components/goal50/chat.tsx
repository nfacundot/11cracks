"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type ChatMsg = {
  id: string;
  userId: string;
  name: string;
  body: string;
  createdAt: string;
};

const PALETTE = [
  "#e11d48",
  "#d97706",
  "#65a30d",
  "#0d9488",
  "#0284c7",
  "#7c3aed",
  "#db2777",
  "#2563eb",
];

const EMOJIS = [
  "⚽", "🔥", "💪", "🏆", "🥅", "🧤", "👟", "🚀",
  "😂", "😎", "😮", "😭", "🤝", "👏", "🙌", "🎯",
  "💚", "💛", "❤️", "💙", "🤍", "⭐", "✨", "🎉",
  "🐐", "🧠", "📈", "⏱️", "🟨", "🟥", "🥇", "🏅",
];

const DEFAULT_W = 340;
const DEFAULT_H = 380;
const MIN_W = 260;
const MIN_H = 200;
const HEADER_H = 48;

function colorFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function tintFor(color: string) {
  return `color-mix(in srgb, ${color} 72%, var(--g50-on-glass))`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

type Rect = { x: number; y: number; w: number; h: number };

function initialRect(): Rect {
  if (typeof window === "undefined") {
    return { x: 0, y: 0, w: DEFAULT_W, h: DEFAULT_H };
  }
  const w = Math.min(DEFAULT_W, window.innerWidth - 24);
  const h = Math.min(DEFAULT_H, window.innerHeight - 120);
  return {
    x: Math.max(12, window.innerWidth - w - 16),
    y: Math.max(56, window.innerHeight - h - 16),
    w,
    h,
  };
}

export function Goal50Chat() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(true);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rect, setRect] = useState<Rect>(initialRect);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const resizeRef = useRef<{ w: number; h: number; x: number; y: number } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/chat", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { me?: string; messages?: ChatMsg[] };
      if (data.messages) setMessages(data.messages);
      if (data.me) setMe(data.me);
    } catch {
      /* sin conexión: se reintenta en el próximo poll */
    }
  }, []);

  useEffect(() => {
    let active = true;
    const run = () => {
      if (active) void load();
    };
    run();
    const id = setInterval(run, 4000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [load]);

  useEffect(() => {
    const box = boxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    const handler = () => setOpen(false);
    window.addEventListener("goal50:close-chat", handler);
    return () => window.removeEventListener("goal50:close-chat", handler);
  }, []);

  const onDragDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("[data-no-drag]")) return;
    dragRef.current = { dx: event.clientX - rect.x, dy: event.clientY - rect.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - HEADER_H;
    setRect((r) => ({
      ...r,
      x: clamp(event.clientX - drag.dx, 0, maxX),
      y: clamp(event.clientY - drag.dy, 44, maxY),
    }));
  };
  const onDragUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* no capturado */
    }
  };

  const onResizeDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    resizeRef.current = { w: rect.w, h: rect.h, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onResizeMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = resizeRef.current;
    if (!start) return;
    setRect((r) => ({
      ...r,
      w: clamp(start.w + (event.clientX - start.x), MIN_W, window.innerWidth - 16),
      h: clamp(start.h + (event.clientY - start.y), MIN_H, window.innerHeight - 60),
    }));
  };
  const onResizeUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    resizeRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* no capturado */
    }
  };

  const addEmoji = (emoji: string) => {
    setValue((prev) => (prev + emoji).slice(0, 500));
  };

  const send = async () => {
    const text = value.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "No se pudo enviar");
      }
      setValue("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar");
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      className="goal50-chrome goal50-glass fixed flex flex-col overflow-hidden rounded-3xl border transition-transform duration-300 ease-out"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: open ? rect.h : "auto",
        transform: open
          ? "translateY(0)"
          : `translateY(${Math.max(0, (typeof window !== "undefined" ? window.innerHeight : 0) - rect.y - 48)}px)`,
      }}
    >
      <div
        onPointerDown={onDragDown}
        onPointerMove={onDragMove}
        onPointerUp={onDragUp}
        onPointerCancel={onDragUp}
        className="flex cursor-move touch-none select-none items-center gap-2.5 px-4 py-3"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-lime/90 text-black">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 5.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-9l-4.5 3.6V16.5H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z" />
            <path d="M8.2 10h7.6M8.2 13h4.6" />
          </svg>
        </span>
        <span className="goal50-text flex-1 font-display text-[13px] font-bold uppercase tracking-[0.14em]">
          Chat
        </span>
        <span className="goal50-text-dim text-[11px] font-semibold">{messages.length}</span>
        <button
          type="button"
          data-no-drag
          aria-label={open ? "Contraer chat" : "Expandir chat"}
          onClick={() => setOpen((v) => !v)}
          className="goal50-text-dim flex size-6 items-center justify-center rounded-full transition hover:opacity-100"
        >
          <svg viewBox="0 0 24 24" className={`size-4 transition-transform ${open ? "" : "rotate-180"}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {open ? (
        <div className="flex min-h-0 flex-1 flex-col px-3 pb-3">
          <div
            ref={boxRef}
            className="no-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto rounded-2xl border p-3"
            style={{ background: "var(--g50-msgbox)", borderColor: "var(--g50-glass-border)" }}
          >
            {messages.length === 0 ? (
              <p className="goal50-text-dim py-4 text-center text-[12px]">
                Sé el primero en escribir 👋
              </p>
            ) : (
              messages.map((m) => {
                const color = tintFor(colorFor(m.userId));
                const mine = me !== null && m.userId === me;
                return (
                  <p key={m.id} className="text-[12.5px] leading-snug">
                    <span className="font-bold" style={{ color }}>
                      {mine ? "Tú" : m.name}:
                    </span>{" "}
                    <span style={{ color, opacity: 0.95 }}>{m.body}</span>
                  </p>
                );
              })
            )}
          </div>

          {error ? (
            <p className="mt-1.5 px-1 text-[11px] font-medium text-[#ff8fab]">{error}</p>
          ) : null}

          {emojiOpen ? (
            <div
              className="mt-2 grid grid-cols-8 gap-1 rounded-2xl border p-2"
              style={{ background: "var(--g50-msgbox)", borderColor: "var(--g50-glass-border)" }}
            >
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  aria-label={`Añadir ${emoji}`}
                  onClick={() => addEmoji(emoji)}
                  className="flex size-7 items-center justify-center rounded-lg text-[16px] leading-none transition hover:bg-white/20 active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : null}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
            className="mt-2 flex items-center gap-2"
          >
            <button
              type="button"
              aria-label="Emoticonos"
              onClick={() => setEmojiOpen((v) => !v)}
              className={`goal50-tile flex size-10 shrink-0 items-center justify-center rounded-full ${emojiOpen ? "text-lime" : ""}`}
            >
              <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="8.6" />
                <path d="M8.6 14.2a4.2 4.2 0 0 0 6.8 0" />
                <path d="M9 9.6h.01M15 9.6h.01" strokeWidth="2.4" />
              </svg>
            </button>
            <input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Escribe un mensaje…"
              maxLength={500}
              className="goal50-text h-10 min-w-0 flex-1 rounded-full border px-4 text-[13px] outline-none transition placeholder:opacity-50 focus:border-lime/60"
              style={{ background: "var(--g50-msgbox)", borderColor: "var(--g50-glass-border)" }}
            />
            <button
              type="submit"
              disabled={sending}
              aria-label="Enviar"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lime text-black transition hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12l16-8-6 8 6 8-16-8Z" />
              </svg>
            </button>
          </form>
        </div>
      ) : null}

      {/* Asa de redimensionado */}
      <div
        onPointerDown={onResizeDown}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeUp}
        onPointerCancel={onResizeUp}
        className="absolute bottom-0 right-0 size-4 cursor-nwse-resize touch-none"
        aria-hidden
      >
        <svg viewBox="0 0 10 10" className="absolute bottom-1 right-1 size-2.5 text-white/40">
          <path d="M9 1v8H1" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
    </section>
  );
}
