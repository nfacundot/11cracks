"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";
import { PencilIcon } from "@/components/icons";
import { Modal } from "@/components/admin/modal";
import {
  saveAlignment,
  publishAlignment,
  unpublishAlignment,
  createAlignment,
  renameAlignment,
  deleteAlignment,
  getAlignmentData,
  type TrazoData,
} from "@/actions/team";

export type CanchaPlayer = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  lineupPosition: string | null;
};

export type AlignmentSummary = { id: string; name: string; formation: string; published: boolean };

type Punto = { x: number; y: number };
type Trazo = { color: string; width: number; alpha: number; puntos: Punto[] };

const FORMACIONES = ["4-3-3", "4-4-2", "3-5-2", "4-5-1"];

function MoveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 9l-3 3 3 3" />
      <path d="M9 5l3-3 3 3" />
      <path d="M15 19l-3 3-3-3" />
      <path d="M19 9l3 3-3 3" />
      <path d="M2 12h20" />
      <path d="M12 2v20" />
    </svg>
  );
}

function MarkerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m12 19 7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  );
}

const POSICION_LABEL: Record<string, string> = {
  POR: "Portero",
  LD: "Lateral Derecho",
  DFC: "Central",
  LI: "Lateral Izquierdo",
  MCD: "Pivote",
  MC: "Mediocampista",
  MCO: "Mediapunta",
  ED: "Extremo Derecho",
  EI: "Extremo Izquierdo",
  DC: "Delantero Centro",
  SD: "Segundo Delantero",
};

const DEFAULT_BY_CODE: Record<string, Punto> = {
  POR: { x: 8, y: 32.5 },
  LD: { x: 28, y: 10 },
  DFC: { x: 20, y: 32.5 },
  LI: { x: 28, y: 55 },
  MCD: { x: 40, y: 32.5 },
  MC: { x: 50, y: 32.5 },
  MCO: { x: 62, y: 32.5 },
  ED: { x: 78, y: 12 },
  EI: { x: 78, y: 53 },
  DC: { x: 88, y: 32.5 },
  SD: { x: 72, y: 32.5 },
};

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function buildInitial(
  players: CanchaPlayer[],
  raw: Record<string, { x: number; y: number }> | null,
): Record<string, Punto> {
  const out: Record<string, Punto> = {};
  const guardados = (raw ?? {}) as Record<string, { x?: unknown; y?: unknown }>;
  const vistosPorCodigo: Record<string, number> = {};
  let sinPos = 0;

  for (const p of players) {
    const g = guardados[p.id];
    const gx = Number(g?.x);
    const gy = Number(g?.y);
    if (g && Number.isFinite(gx) && Number.isFinite(gy)) {
      out[p.id] = { x: gx, y: gy };
      continue;
    }
    if (p.lineupPosition && DEFAULT_BY_CODE[p.lineupPosition]) {
      const base = DEFAULT_BY_CODE[p.lineupPosition];
      const n = vistosPorCodigo[p.lineupPosition] ?? 0;
      vistosPorCodigo[p.lineupPosition] = n + 1;
      out[p.id] = { x: base.x, y: Math.min(92, Math.max(8, base.y + (n % 2 === 0 ? 0 : n * -11))) };
    } else {
      const col = sinPos % 3;
      const fila = Math.floor(sinPos / 3);
      sinPos += 1;
      out[p.id] = { x: 25 + col * 25, y: Math.min(88, 20 + fila * 16) };
    }
  }
  return out;
}

function pintarTrazo(ctx: CanvasRenderingContext2D, t: Trazo, w: number, h: number) {
  if (t.puntos.length === 0) return;
  ctx.globalAlpha = t.alpha;
  ctx.strokeStyle = t.color;
  ctx.lineWidth = t.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(t.puntos[0].x * w, t.puntos[0].y * h);
  for (let i = 1; i < t.puntos.length; i++) {
    ctx.lineTo(t.puntos[i].x * w, t.puntos[i].y * h);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toolCls = (activo: boolean) =>
  `rounded-[8px] border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition ${
    activo
      ? "border-[#C9A24A]/70 bg-[#C9A24A]/15 text-[#E3C065]"
      : "border-white/10 bg-transparent hover:border-white/20 hover:bg-white/[0.03]"
  }`;

export function CanchaView({
  teamId,
  teamName,
  players,
  initialFormation,
  initialPositions,
  initialTrazos = [],
  alignments = [],
  initialAlignmentId = null,
  readOnly = false,
  meId = null,
  playerWindow = false,
}: {
  teamId: string | null;
  teamName: string | null;
  players: CanchaPlayer[];
  initialFormation: string;
  initialPositions: Record<string, { x: number; y: number }> | null;
  initialTrazos?: Trazo[];
  alignments?: AlignmentSummary[];
  initialAlignmentId?: string | null;
  readOnly?: boolean;
  meId?: string | null;
  playerWindow?: boolean;
}) {
  const [formacion, setFormacion] = useState(
    FORMACIONES.includes(initialFormation) ? initialFormation : initialFormation || "4-3-3",
  );
  const [posiciones, setPosiciones] = useState<Record<string, Punto>>(() =>
    buildInitial(players, initialPositions),
  );
  const [dragId, setDragId] = useState<string | null>(null);
  const [tool, setTool] = useState<"mover" | "lapiz" | "marcador">("mover");
  const [color, setColor] = useState("#F3F0E8");
  const [alpha, setAlpha] = useState(1);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [trazos, setTrazos] = useState<Trazo[]>(initialTrazos);
  const [alignmentId, setAlignmentId] = useState<string | null>(initialAlignmentId);
  const [alignmentList, setAlignmentList] = useState<AlignmentSummary[]>(alignments);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameName, setRenameName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishName, setPublishName] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveEstado, setSaveEstado] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [live, setLive] = useState(false);

  const contRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<string | null>(null);
  const posRef = useRef(posiciones);
  const formRef = useRef(formacion);
  const trazoActual = useRef<Trazo | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trazosInitRef = useRef(true);
  const alignmentIdRef = useRef(alignmentId);

  useEffect(() => {
    alignmentIdRef.current = alignmentId;
  }, [alignmentId]);

  useEffect(() => {
    posRef.current = posiciones;
  }, [posiciones]);

  useEffect(() => {
    formRef.current = formacion;
  }, [formacion]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = (msg: string, kind: "ok" | "err") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, kind });
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    const el = contRef.current;
    if (!el) return;
    const update = () => setCanvasSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!readOnly || !teamId) return;
    const es = new EventSource(`/api/teams/${teamId}/tactics-stream`);
    es.addEventListener("ready", () => setLive(true));
    es.onopen = () => setLive(true);
    es.onerror = () => setLive(false);
    es.addEventListener("tactics", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent<string>).data) as {
          alignmentId?: string;
          name?: string;
          formation?: unknown;
          positions?: Record<string, { x?: unknown; y?: unknown }>;
          trazos?: { color?: string; width?: number; alpha?: number; puntos?: { x?: unknown; y?: unknown }[] }[];
          published?: unknown;
        };
        if (data.alignmentId && data.alignmentId !== alignmentIdRef.current) return;
        if (typeof data.formation === "string" && data.formation) {
          formRef.current = data.formation;
          setFormacion(data.formation);
        }
        if (data.positions && typeof data.positions === "object") {
          setPosiciones((prev) => {
            const next = { ...prev };
            for (const [id, p] of Object.entries(data.positions ?? {})) {
              const x = Number(p?.x);
              const y = Number(p?.y);
              if (Number.isFinite(x) && Number.isFinite(y)) next[id] = { x, y };
            }
            return next;
          });
        }
        if (Array.isArray(data.trazos)) {
          const synced: Trazo[] = data.trazos
            .filter((t) => Array.isArray(t.puntos) && t.puntos.length > 0)
            .map((t) => ({
              color: String(t.color || "#F3F0E8"),
              width: Number(t.width) || 2.5,
              alpha: Number(t.alpha) || 1,
              puntos: t.puntos!
                .filter((pt) => Number.isFinite(Number(pt.x)) && Number.isFinite(Number(pt.y)))
                .map((pt) => ({ x: Number(pt.x), y: Number(pt.y) })),
            }));
          setTrazos(synced);
        }
        if (typeof data.published === "boolean") {
          setAlignmentList((prev) =>
            prev.map((a) => (a.id === data.alignmentId ? { ...a, published: data.published as boolean } : a)),
          );
        }
        if (typeof data.name === "string" && data.alignmentId) {
          setAlignmentList((prev) =>
            prev.map((a) => (a.id === data.alignmentId ? { ...a, name: data.name as string } : a)),
          );
        }
      } catch {}
    });
    return () => {
      es.close();
      setLive(false);
    };
  }, [readOnly, teamId]);

  const dibujarTodo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.w === 0 || canvasSize.h === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(canvasSize.w * dpr);
    canvas.height = Math.round(canvasSize.h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);
    for (const t of trazos) pintarTrazo(ctx, t, canvasSize.w, canvasSize.h);
  }, [trazos, canvasSize]);

  useEffect(() => {
    dibujarTodo();
  }, [dibujarTodo]);

  const persistir = useCallback(
    (trazosPayload?: Trazo[]) => {
      const currentId = alignmentIdRef.current;
      if (!currentId) return;
      setSaveEstado("saving");
      saveAlignment(currentId, formRef.current, posRef.current, trazosPayload ?? trazos)
        .then((r) => setSaveEstado(r.error ? "error" : "saved"))
        .catch(() => setSaveEstado("error"))
        .finally(() => {
          if (saveTimer.current) clearTimeout(saveTimer.current);
          saveTimer.current = setTimeout(() => setSaveEstado("idle"), 2000);
        });
    },
    [trazos],
  );

  useEffect(() => {
    if (trazosInitRef.current) {
      trazosInitRef.current = false;
      return;
    }
    persistir(trazos);
  }, [trazos, persistir]);

  const switchAlignment = useCallback(
    async (id: string) => {
      const a = alignmentList.find((al) => al.id === id);
      if (!a) return;
      setAlignmentId(id);
      alignmentIdRef.current = id;
      const res = await getAlignmentData(id);
      if (res.error || !res.data) return;
      const d = res.data;
      setFormacion(d.formation);
      formRef.current = d.formation;
      setPosiciones(buildInitial(players, d.positions && Object.keys(d.positions).length > 0 ? d.positions : null));
      trazosInitRef.current = true;
      setTrazos(d.trazos as Trazo[]);
    },
    [alignmentList, players],
  );

  const handleNewAlignment = async () => {
    if (!teamId) return;
    const res = await createAlignment(teamId, "Nueva alineación");
    if (res.error || !res.alignment) return;
    const a = res.alignment;
    setAlignmentList((prev) => [...prev, { id: a.id, name: a.name, formation: a.formation, published: false }]);
    await switchAlignment(a.id);
    showToast("Nueva alineación lista", "ok");
  };

  const handlePublish = async () => {
    if (!alignmentId) return;
    setPublishing(true);
    try {
      const res = await publishAlignment(alignmentId, publishName);
      if (res.error) return;
      setAlignmentList((prev) =>
        prev.map((a) => (a.id === alignmentId ? { ...a, published: true, name: publishName || a.name } : a)),
      );
      setPublishModalOpen(false);
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!alignmentId) return;
    const res = await unpublishAlignment(alignmentId);
    if (res.error) return;
    setAlignmentList((prev) =>
      prev.map((a) => (a.id === alignmentId ? { ...a, published: false } : a)),
    );
  };

  const handleRename = async () => {
    if (!alignmentId) return;
    setRenaming(true);
    try {
      const res = await renameAlignment(alignmentId, renameName);
      if (res.error) return;
      setAlignmentList((prev) =>
        prev.map((a) => (a.id === alignmentId ? { ...a, name: renameName || a.name } : a)),
      );
      setRenameModalOpen(false);
    } finally {
      setRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!alignmentId) return;
    setDeleting(true);
    try {
      const res = await deleteAlignment(alignmentId);
      if (res.error) return;
      const remaining = alignmentList.filter((a) => a.id !== alignmentId);
      setAlignmentList(remaining);
      setDeleteModalOpen(false);
      if (remaining.length > 0) {
        switchAlignment(remaining[0].id);
      } else {
        setAlignmentId(null);
        alignmentIdRef.current = null;
      }
    } finally {
      setDeleting(false);
    }
  };

  const cambiarFormacion = (v: string) => {
    setFormacion(v);
    formRef.current = v;
    persistir();
  };

  const moverArrastre = (e: React.PointerEvent<HTMLDivElement>) => {
    if (readOnly) return;
    const id = dragRef.current;
    if (!id) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosiciones((prev) => ({
      ...prev,
      [id]: { x: Math.min(96, Math.max(4, x)), y: Math.min(93, Math.max(7, y)) },
    }));
  };

  const soltarArrastre = () => {
    if (readOnly) return;
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragId(null);
    persistir();
  };

  const puntoDe = (e: React.PointerEvent<HTMLCanvasElement>): Punto => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const iniciarTrazo = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === "mover") return;
    e.preventDefault();
    trazoActual.current = {
      color,
      width: tool === "marcador" ? 9 : 2.5,
      alpha,
      puntos: [puntoDe(e)],
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const moverTrazo = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const t = trazoActual.current;
    if (!t) return;
    e.preventDefault();
    const p = puntoDe(e);
    const prev = t.puntos[t.puntos.length - 1];
    t.puntos.push(p);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasSize.w > 0 && canvasSize.h > 0) {
      ctx.globalAlpha = t.alpha;
      ctx.strokeStyle = t.color;
      ctx.lineWidth = t.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(prev.x * canvasSize.w, prev.y * canvasSize.h);
      ctx.lineTo(p.x * canvasSize.w, p.y * canvasSize.h);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  };

  const terminarTrazo = () => {
    const t = trazoActual.current;
    if (!t) return;
    trazoActual.current = null;
    setTrazos((prev) => [...prev, t]);
  };

  const opcionesFormacion = Array.from(new Set([formacion, ...FORMACIONES]));
  const currentAlignment = alignmentList.find((a) => a.id === alignmentId);
  const estadoGuardado =
    saveEstado === "saving"
      ? "Guardando…"
      : saveEstado === "saved"
        ? "Guardado automáticamente ✓"
        : saveEstado === "error"
          ? "Error al guardar"
          : teamId
            ? "Se guarda solo al soltar al jugador"
            : null;

  return (
    <div className={playerWindow ? "player-alineacion__wrap" : "flex flex-col gap-6 pt-12"}>
      {!playerWindow ? (
        <GlobalHero
          eyebrow={readOnly ? "CANCHA · TIEMPO REAL" : "COACH · FIELD BOARD"}
          title="Alineación"
          subtitle={
            readOnly
              ? teamName
                ? `El tablero táctico de ${teamName}, en vivo.`
                : "El tablero táctico de tu equipo, en vivo."
              : teamName
                ? `Organiza a ${teamName} y publica la formación.`
                : "Organiza tu equipo y publica la formación."
          }
        />
      ) : null}

      <section className={playerWindow ? "player-alineacion__panel" : "rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6"}>
        {/* ─── Header del panel ─── */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {readOnly ? (
            <>
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-300"
                  style={{ fontFamily: S.barlow }}
                >
                  <span
                    className={`h-2 w-2 rounded-full bg-emerald-400 ${live ? "animate-pulse" : "opacity-40"}`}
                  />
                  {live ? "En vivo" : "Conectando…"}
                </span>
                <span className="text-[16px] font-bold text-[#C9A24A]" style={{ fontFamily: S.barlow }}>
                  {formacion}
                </span>
              </div>
              <p className="text-[12px] text-[#686862]" style={{ fontFamily: S.barlow }}>
                Los movimientos del entrenador aparecen al instante aquí.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                {currentAlignment?.published ? (
                  <span
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-300"
                    style={{ fontFamily: S.barlow }}
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    {currentAlignment.name || "Publicado"}
                  </span>
                ) : (
                  <span
                    className="rounded-full bg-[#C9A24A]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#E3C065]"
                    style={{ fontFamily: S.barlow }}
                  >
                    {currentAlignment?.name || "Sin alineación"}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-[#686862]" style={{ fontFamily: S.barlow }}>
                {currentAlignment?.published
                  ? "Publicado — los jugadores pueden ver esta alineación."
                  : "Solo lo ve el Coach. Publica para que los jugadores vean la alineación."}
              </p>
            </>
          )}
        </div>

        {/* ─── Selector de alineaciones + Acciones ─── */}
        {!readOnly && (
          <div className="mb-4 flex flex-col gap-3">
            {/* ─── Selector de alineaciones ─── */}
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#686862]"
                style={{ fontFamily: S.barlow }}
              >
                Alineaciones
              </span>
              <select
                value={alignmentId ?? ""}
                onChange={(e) => switchAlignment(e.target.value)}
                className="rounded-[8px] border border-white/10 bg-[#080909] px-3 py-1.5 text-[13px] outline-none transition hover:border-[#C9A24A]/30 focus:border-[#C9A24A]/60"
                style={{ fontFamily: S.barlow, color: S.textPrimary }}
              >
                {alignmentList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.published ? "🟢 " : ""}{a.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  if (!currentAlignment) return;
                  setRenameName(currentAlignment.name);
                  setRenameModalOpen(true);
                }}
                className="rounded-[8px] border border-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:border-white/20 hover:bg-white/[0.03]"
                style={{ fontFamily: S.barlow, color: S.textPrimary }}
              >
                ✎ Renombrar
              </button>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="rounded-[8px] border border-red-400/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:border-red-400/40 hover:bg-red-400/10"
                style={{ fontFamily: S.barlow, color: "#F87171" }}
              >
                ✕ Eliminar
              </button>
            </div>

            {/* ─── Acciones ─── */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleNewAlignment}
                disabled={!teamId}
                className="rounded-[10px] border border-[#C9A24A]/40 bg-[#C9A24A]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:bg-[#C9A24A]/20 hover:border-[#C9A24A]/60 disabled:opacity-50"
                style={{ fontFamily: S.barlow, color: S.textPrimary }}
              >
                + Nueva alineación
              </button>
              <span
                className="ml-auto text-[11px] font-semibold"
                style={{ fontFamily: S.barlow, color: saveEstado === "error" ? "#EF4444" : saveEstado === "saved" ? "#34D399" : "#686862" }}
              >
                {estadoGuardado}
              </span>
              <button
                type="button"
                onClick={() => persistir()}
                disabled={!teamId}
                className="rounded-[10px] border border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:border-white/20 hover:bg-white/[0.03] disabled:opacity-50"
                style={{ fontFamily: S.barlow, color: S.textPrimary }}
              >
                Guardar alineación
              </button>
              {currentAlignment?.published ? (
                <button
                  type="button"
                  onClick={handleUnpublish}
                  disabled={!teamId}
                  className="rounded-[10px] border border-red-400/30 bg-red-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:bg-red-400/20 hover:border-red-400/50 disabled:opacity-50"
                  style={{ fontFamily: S.barlow, color: "#F87171" }}
                >
                  Despublicar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setPublishName(currentAlignment?.name || "");
                    setPublishModalOpen(true);
                  }}
                  disabled={!teamId}
                  className="rounded-[10px] border border-[#C9A24A]/40 bg-[#C9A24A]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:bg-[#C9A24A]/20 hover:border-[#C9A24A]/60 disabled:opacity-50"
                  style={{ fontFamily: S.barlow, color: S.textPrimary }}
                >
                  Publicar para el equipo
                </button>
              )}
            </div>

            {/* ─── Herramientas de trazos: movidas al control flotante ─── */}
            {/* (Ver botón ✏ dentro de la cancha) */}
          </div>
        )}

        {/* ─── Cancha de fútbol ─── */}
        <div
          ref={contRef}
          className="relative overflow-hidden rounded-[16px] border border-emerald-500/20 bg-emerald-950/30"
          onPointerMove={moverArrastre}
          onPointerUp={soltarArrastre}
          onPointerLeave={soltarArrastre}
          onPointerCancel={soltarArrastre}
          style={{ aspectRatio: "100/65", minHeight: "420px" }}
        >
          {/* Fondo cancha */}
          <svg viewBox="0 0 100 65" className="absolute inset-0 z-0 h-full w-full" preserveAspectRatio="none">
            <defs>
              <pattern id="grass" patternUnits="userSpaceOnUse" width="4" height="4">
                <rect width="4" height="4" fill="#0a4d1a" />
                <path d="M0 2 L2 0 L4 2 L2 4 Z" fill="#0d5a20" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100" height="65" fill="url(#grass)" />

            {/* Línea central */}
            <line x1="50" y1="0" x2="50" y2="65" stroke="#22c55e" strokeWidth="0.8" strokeDasharray="4 4" />
            <circle cx="50" cy="32.5" r="12" fill="none" stroke="#22c55e" strokeWidth="0.8" />
            <circle cx="50" cy="32.5" r="1.5" fill="#22c55e" />

            {/* Áreas grandes */}
            <rect x="0" y="16.5" width="20" height="32" fill="none" stroke="#22c55e" strokeWidth="0.8" rx="2" />
            <rect x="80" y="16.5" width="20" height="32" fill="none" stroke="#22c55e" strokeWidth="0.8" rx="2" />

            {/* Áreas pequeñas */}
            <rect x="0" y="24.5" width="8" height="16" fill="none" stroke="#22c55e" strokeWidth="0.8" rx="1" />
            <rect x="92" y="24.5" width="8" height="16" fill="none" stroke="#22c55e" strokeWidth="0.8" rx="1" />

            {/* Puntos de penalti */}
            <circle cx="11" cy="32.5" r="1" fill="#22c55e" />
            <circle cx="89" cy="32.5" r="1" fill="#22c55e" />

            {/* Arcos */}
            <rect x="-1" y="26" width="1.5" height="13" fill="#1a1a1a" stroke="#22c55e" strokeWidth="0.5" />
            <rect x="99.5" y="26" width="1.5" height="13" fill="#1a1a1a" stroke="#22c55e" strokeWidth="0.5" />
          </svg>

          {/* Capa de trazos */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-10"
            style={{
              width: "100%",
              height: "100%",
              cursor: tool === "mover" ? "default" : "crosshair",
              pointerEvents: tool === "mover" ? "none" : "auto",
              touchAction: tool === "mover" ? "auto" : "none",
            }}
            onPointerDown={iniciarTrazo}
            onPointerMove={moverTrazo}
            onPointerUp={terminarTrazo}
            onPointerCancel={terminarTrazo}
          />

          {/* Jugadores arrastrables */}
          {players.length === 0 ? (
            <div className="absolute inset-0 z-30 flex items-center justify-center">
                <p className="text-[13px] font-medium text-white/70" style={{ fontFamily: S.barlow }}>
                  {readOnly
                    ? "Tu entrenador todavía no ha convocado jugadores."
                    : "Aún no hay jugadores en el equipo. Agrégalos desde Configurar Equipo."}
                </p>
            </div>
          ) : (
            players.map((p) => {
              const pos = posiciones[p.id] || { x: 50, y: 50 };
              const mio = p.id === meId;
              const activo = dragId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onPointerDown={(e) => {
                    if (readOnly || tool !== "mover") return;
                    e.preventDefault();
                    dragRef.current = p.id;
                    setDragId(p.id);
                  }}
                  className="absolute touch-none select-none"
                  style={{
                    left: `calc(${pos.x}% - 24px)`,
                    top: `calc(${pos.y}% - 24px)`,
                    zIndex: activo ? 50 : 30,
                    transition: activo ? "none" : "left 0.25s ease-out, top 0.25s ease-out",
                    cursor: readOnly ? "default" : tool === "mover" ? "grab" : "pointer",
                  }}
                  title={`${p.name} (@${p.username})`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`relative h-10 w-10 ${mio && !activo ? "rounded-full ring-2 ring-[#E3C065]/80 ring-offset-2 ring-offset-emerald-950" : ""}`}
                    >
                      {p.avatarUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={p.avatarUrl}
                          alt=""
                          className={`absolute inset-0 h-10 w-10 rounded-full object-cover border-2 ${
                            activo || mio ? "border-[#E3C065]" : "border-[#C9A24A]/60"
                          }`}
                        />
                      ) : (
                        <div
                          className={`absolute inset-0 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-[#080909] text-[11px] font-extrabold ${
                            activo || mio ? "border-[#E3C065]" : "border-[#C9A24A]/60"
                          }`}
                          style={{ color: S.textPrimary }}
                        >
                          {initialsOf(p.name)}
                        </div>
                      )}
                      {activo && (
                        <div className="absolute -inset-1 animate-pulse rounded-full border-2 border-[#C9A24A] bg-[#C9A24A]/10" />
                      )}
                    </div>
                    <div className="flex flex-col items-center rounded border border-white/[0.05] bg-[#080909]/90 px-1.5 py-0.5 text-center" style={{ fontFamily: S.barlow }}>
                      <span className="whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.05em]" style={{ color: S.textPrimary }}>
                        {p.name}
                        {mio ? <span className="ml-1 text-emerald-300">· Tú</span> : null}
                      </span>
                      {p.lineupPosition && (
                        <span className="text-[8px] font-extrabold uppercase tracking-[0.06em] text-[#E3C065]">
                          {POSICION_LABEL[p.lineupPosition] ?? p.lineupPosition}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}

          {/* ─── Control flotante: herramientas + color RGBA ─── */}
          {!readOnly && (
            <div className="absolute right-3 top-3 z-40 flex flex-col items-end gap-2">
              <div className="group/fab relative">
                <button
                  type="button"
                  onClick={() => setToolsOpen((o) => !o)}
                  aria-expanded={toolsOpen}
                  aria-label="Herramientas de cancha"
                  className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-lg shadow-black/40 transition ${
                    toolsOpen
                      ? "border-[#C9A24A]/70 bg-[#C9A24A]/15 text-[#E3C065]"
                      : "border-white/10 bg-[#080909]/90 text-[#F3F0E8] hover:border-white/25"
                  }`}
                  style={{ fontFamily: S.barlow }}
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-black px-2.5 py-1.5 text-xs font-semibold text-[#F3F0E8] shadow-xl opacity-0 transition group-hover/fab:opacity-100">
                  Herramientas de cancha
                </span>
              </div>
              {toolsOpen && (
                <div
                  className="w-[15rem] rounded-[12px] border border-white/10 bg-[#080909]/95 p-3 shadow-2xl shadow-black/60 backdrop-blur"
                  style={{ fontFamily: S.barlow }}
                >
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#686862]">Herramientas</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "mover" as const, icon: <MoveIcon className="h-4 w-4" />, label: "Mover", desc: "Arrastrar jugadores" },
                      { id: "lapiz" as const, icon: <PencilIcon className="h-4 w-4" />, label: "Lápiz", desc: "Dibujar trazos finos" },
                      { id: "marcador" as const, icon: <MarkerIcon className="h-4 w-4" />, label: "Marcador", desc: "Resaltar con trazo grueso" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTool(t.id)}
                        aria-label={t.desc}
                        className={`group/tool relative flex flex-col items-center gap-1 rounded-[10px] border px-1 py-2 transition ${
                          tool === t.id
                            ? "border-[#C9A24A]/70 bg-[#C9A24A]/15 text-[#E3C065]"
                            : "border-white/10 text-[#F3F0E8] hover:border-white/25 hover:bg-white/[0.03]"
                        }`}
                      >
                        {t.icon}
                        <span className="text-[9px] font-bold uppercase tracking-[0.08em]">{t.label}</span>
                        <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-black px-2.5 py-1.5 text-xs font-semibold text-[#F3F0E8] shadow-xl opacity-0 transition group-hover/tool:opacity-100">
                          {t.desc}
                        </span>
                      </button>
                    ))}
                  </div>

                  <p className="mb-2 mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#686862]">Color RGBA</p>
                  <div className="flex items-center gap-2">
                    <label
                      className="group/color relative shrink-0 cursor-pointer"
                      aria-label="Elegir color"
                      title="Elegir color"
                    >
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="sr-only"
                      />
                      <span
                        className="block h-9 w-9 rounded-full border-2 border-white/25 shadow-inner shadow-black/40 transition group-hover/color:scale-110"
                        style={{ background: `rgba(${hexToRgb(color).join(", ")}, ${alpha})` }}
                      />
                      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-black px-2.5 py-1.5 text-xs font-semibold text-[#F3F0E8] shadow-xl opacity-0 transition group-hover/color:opacity-100">
                        Elegir color
                      </span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={alpha}
                      onChange={(e) => setAlpha(Number(e.target.value))}
                      className="h-1.5 flex-1 accent-[#C9A24A]"
                      aria-label="Opacidad (canal alfa)"
                    />
                    <span className="w-10 shrink-0 text-right text-[10px] font-bold text-[#E3C065]">
                      {Math.round(alpha * 100)}%
                    </span>
                  </div>

                  <div className="mt-3 flex gap-1.5 border-t border-white/[0.06] pt-2.5">
                    <button
                      type="button"
                      onClick={() => setTrazos((t) => t.slice(0, -1))}
                      disabled={trazos.length === 0}
                      className={toolCls(false) + " disabled:cursor-not-allowed disabled:opacity-40"}
                    >
                      ↩ Deshacer
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrazos([])}
                      disabled={trazos.length === 0}
                      className={toolCls(false) + " disabled:cursor-not-allowed disabled:opacity-40"}
                    >
                      ✕ Limpiar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Leyendas */}
          <div className="absolute bottom-2 left-2 z-20 text-[9px] font-medium text-white/60" style={{ fontFamily: S.barlow }}>
            Portería propia
          </div>
          <div className="absolute bottom-2 right-2 z-20 text-[9px] font-medium text-white/60" style={{ fontFamily: S.barlow }}>
            Ataque →
          </div>
        </div>

        {/* ─── Lista de jugadores para referencia ─── */}
        <div className="mt-6 border-t border-white/[0.05] pt-4">
          <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#686862]" style={{ fontFamily: S.barlow }}>
            Jugadores del plantel
          </h4>
          {players.length === 0 ? (
            <p className="text-[12px] font-medium text-[#686862]" style={{ fontFamily: S.barlow }}>
              Sin jugadores todavía.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {players.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.05] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium"
                  style={{ fontFamily: S.barlow, color: S.textSecondary }}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.05] text-[9px] font-extrabold" style={{ color: S.textPrimary }}>
                    {initialsOf(p.name)}
                  </span>
                  {p.name}
                  {p.lineupPosition ? <span className="font-bold text-[#C9A24A]">{POSICION_LABEL[p.lineupPosition] ?? p.lineupPosition}</span> : null}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Modal: Publicar alineación ─── */}
      <Modal open={publishModalOpen} onClose={() => setPublishModalOpen(false)} title="Publicar alineación">
          <p className="mb-4 text-[12px] text-[#686862]" style={{ fontFamily: S.barlow }}>
            Los jugadores podrán ver esta alineación en su tablero.
          </p>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#686862]" style={{ fontFamily: S.barlow }}>
            Nombre
          </label>
          <input
            type="text"
            value={publishName}
            onChange={(e) => setPublishName(e.target.value)}
            placeholder="Ej: Alineación Local, 4-3-3 Ofensiva…"
            maxLength={60}
            className="mb-4 w-full rounded-[10px] border border-white/10 bg-[#080909] px-3 py-2 text-[13px] outline-none transition placeholder:text-white/20 hover:border-[#C9A24A]/30 focus:border-[#C9A24A]/60"
            style={{ fontFamily: S.barlow, color: S.textPrimary }}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPublishModalOpen(false)}
              className="rounded-[10px] border border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:border-white/20 hover:bg-white/[0.03]"
              style={{ fontFamily: S.barlow, color: S.textPrimary }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="rounded-[10px] border border-[#C9A24A]/40 bg-[#C9A24A]/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:bg-[#C9A24A]/25 hover:border-[#C9A24A]/60 disabled:opacity-50"
              style={{ fontFamily: S.barlow, color: S.textPrimary }}
            >
              {publishing ? "Publicando…" : "Publicar"}
            </button>
          </div>
      </Modal>

      {/* ─── Modal: Renombrar alineación ─── */}
      <Modal open={renameModalOpen} onClose={() => setRenameModalOpen(false)} title="Renombrar alineación">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#686862]" style={{ fontFamily: S.barlow }}>
            Nombre
          </label>
          <input
            type="text"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            placeholder="Nombre de la alineación…"
            maxLength={60}
            className="mb-4 w-full rounded-[10px] border border-white/10 bg-[#080909] px-3 py-2 text-[13px] outline-none transition placeholder:text-white/20 hover:border-[#C9A24A]/30 focus:border-[#C9A24A]/60"
            style={{ fontFamily: S.barlow, color: S.textPrimary }}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRenameModalOpen(false)}
              className="rounded-[10px] border border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:border-white/20 hover:bg-white/[0.03]"
              style={{ fontFamily: S.barlow, color: S.textPrimary }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleRename}
              disabled={renaming}
              className="rounded-[10px] border border-[#C9A24A]/40 bg-[#C9A24A]/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:bg-[#C9A24A]/25 hover:border-[#C9A24A]/60 disabled:opacity-50"
              style={{ fontFamily: S.barlow, color: S.textPrimary }}
            >
              {renaming ? "Guardando…" : "Guardar"}
            </button>
          </div>
      </Modal>

      {/* ─── Modal: Eliminar alineación ─── */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Eliminar alineación">
          <p className="mb-4 text-[13px]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
            ¿Seguro que querés eliminar <span className="font-bold text-[#E3C065]">{currentAlignment?.name}</span>? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="rounded-[10px] border border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:border-white/20 hover:bg-white/[0.03]"
              style={{ fontFamily: S.barlow, color: S.textPrimary }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-[10px] border border-red-400/40 bg-red-400/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:bg-red-400/25 hover:border-red-400/60 disabled:opacity-50"
              style={{ fontFamily: S.barlow, color: "#F87171" }}
            >
              {deleting ? "Eliminando…" : "Eliminar"}
            </button>
          </div>
      </Modal>

      {toast && (
        <div
          role="alert"
          className={`fixed left-1/2 top-6 z-[100] flex max-w-md -translate-x-1/2 items-center gap-3 rounded-[12px] border px-4 py-3 shadow-2xl shadow-black/60 ${
            toast.kind === "ok"
              ? "border-[#C9A24A]/50 bg-[#0B0D0D]"
              : "border-red-500/50 bg-[#1A0D0D]"
          }`}
          style={{ fontFamily: S.barlow }}
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-black ${
              toast.kind === "ok" ? "bg-[#C9A24A] text-black" : "bg-red-500 text-white"
            }`}
          >
            {toast.kind === "ok" ? "✓" : "!"}
          </span>
          <p
            className={`text-[13px] font-bold leading-snug ${
              toast.kind === "ok" ? "text-[#F3F0E8]" : "text-red-400"
            }`}
          >
            {toast.msg}
          </p>
        </div>
      )}
    </div>
  );
}
