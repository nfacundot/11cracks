"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_FLOOR_COLOR,
  DEFAULT_WALL_COLOR,
  ROOM_SIZES,
  roomSizeByKey,
  type RoomData,
} from "@/lib/room";

const STEPS = ["Nombre", "Tamaño", "Colores", "Finalizar"];

function enterRoom(room: RoomData) {
  window.dispatchEvent(new CustomEvent<RoomData>("goal50:enter-room", { detail: room }));
}

export default function HotelScreen() {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"list" | "wizard">("list");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [size, setSize] = useState<string>(ROOM_SIZES[0].key);
  const [floorColor, setFloorColor] = useState(DEFAULT_FLOOR_COLOR);
  const [wallColor, setWallColor] = useState(DEFAULT_WALL_COLOR);

  useEffect(() => {
    let active = true;
    fetch("/api/room", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("bad"))))
      .then((data: { rooms: RoomData[] }) => {
        if (active) setRooms(data.rooms ?? []);
      })
      .catch(() => {
        if (active) setError("No se pudieron cargar tus habitaciones.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const startCreate = () => {
    setEditingId(null);
    setName("");
    setSize(ROOM_SIZES[0].key);
    setFloorColor(DEFAULT_FLOOR_COLOR);
    setWallColor(DEFAULT_WALL_COLOR);
    setStep(0);
    setMode("wizard");
  };

  const startEdit = (room: RoomData) => {
    setEditingId(room.id);
    setName(room.name);
    setSize(room.size);
    setFloorColor(room.floorColor);
    setWallColor(room.wallColor);
    setStep(0);
    setMode("wizard");
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const body = { name, size, floorColor, wallColor };
      const res = editingId
        ? await fetch("/api/room", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editingId, ...body }),
          })
        : await fetch("/api/room", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "No se pudo guardar");
      }
      const data = (await res.json()) as { room: RoomData };
      enterRoom(data.room);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="goal50-text-dim grid h-full place-items-center text-sm">Cargando…</div>;
  }

  if (mode === "list") {
    return (
      <div className="no-scrollbar h-full overflow-y-auto p-6">
        <div className="mx-auto w-full max-w-[560px]">
          <p className="goal50-text-dim text-[10px] font-bold uppercase tracking-[0.16em]">Hotel ELEVEN CRACKS</p>
          <h1 className="goal50-text mt-1 text-2xl font-black">Mis habitaciones</h1>

          {rooms.length === 0 ? (
            <p className="goal50-text-dim mt-4 text-[13px]">Todavía no tienes habitaciones. ¡Crea la primera!</p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {rooms.map((room) => {
                const selected = roomSizeByKey(room.size);
                return (
                  <div key={room.id} className="goal50-glass flex items-center gap-3 rounded-2xl border p-4">
                    <div className="min-w-0 flex-1">
                      <p className="goal50-text truncate text-[15px] font-bold">{room.name}</p>
                      <p className="goal50-text-dim text-[12px]">
                        {selected.label} · {selected.width}×{selected.depth} m
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="size-4 rounded-full border border-white/20" style={{ background: room.floorColor }} />
                        <span className="size-4 rounded-full border border-white/20" style={{ background: room.wallColor }} />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => enterRoom(room)}
                      className="rounded-full bg-lime px-4 py-2 text-[12px] font-bold text-black transition hover:brightness-110"
                    >
                      Entrar
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(room)}
                      className="goal50-tile rounded-full px-4 py-2 text-[12px] font-semibold"
                    >
                      Editar
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={startCreate}
            className="mt-5 w-full rounded-full bg-lime px-6 py-3 text-[13px] font-bold text-black transition hover:brightness-110"
          >
            + Crear habitación
          </button>

          {error ? <p className="mt-3 text-[12px] font-medium text-[#ff8fab]">{error}</p> : null}
        </div>
      </div>
    );
  }

  const selected = roomSizeByKey(size);

  return (
    <div className="no-scrollbar h-full overflow-y-auto p-6">
      <div className="mx-auto w-full max-w-[560px]">
        <p className="goal50-text-dim text-[10px] font-bold uppercase tracking-[0.16em]">Hotel ELEVEN CRACKS</p>
        <h1 className="goal50-text mt-1 text-2xl font-black">
          {editingId ? "Editar habitación" : "Crea tu habitación"}
        </h1>

        <div className="mt-5 flex items-center gap-2">
          {STEPS.map((label, index) => (
            <div key={label} className="flex flex-1 flex-col gap-1">
              <span className={`h-1 rounded-full ${index <= step ? "bg-lime" : "bg-white/15"}`} />
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${index === step ? "goal50-text" : "goal50-text-dim"}`}>
                {index + 1}. {label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6">
          {step === 0 ? (
            <label className="block">
              <span className="goal50-text-dim text-[12px] font-semibold">Nombre de la habitación</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={40}
                placeholder="Mi cuarto crack"
                className="goal50-text mt-2 h-12 w-full rounded-2xl border px-4 text-[14px] outline-none focus:border-lime/60"
                style={{ background: "var(--g50-msgbox)", borderColor: "var(--g50-glass-border)" }}
              />
            </label>
          ) : null}

          {step === 1 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {ROOM_SIZES.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSize(option.key)}
                  className={`rounded-2xl border p-3 text-left transition ${
                    size === option.key ? "border-lime/60 bg-lime/15" : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <span className="goal50-text block text-[13px] font-bold">{option.label}</span>
                  <span className="goal50-text-dim block text-[11px]">{option.description}</span>
                  <span className="goal50-text-dim mt-1 block text-[10px]">
                    {option.width}×{option.depth} m
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="goal50-glass rounded-2xl border p-4">
                <span className="goal50-text-dim text-[12px] font-semibold">Color del suelo</span>
                <input
                  type="color"
                  value={floorColor}
                  onChange={(event) => setFloorColor(event.target.value)}
                  className="mt-2 h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-transparent"
                />
              </label>
              <label className="goal50-glass rounded-2xl border p-4">
                <span className="goal50-text-dim text-[12px] font-semibold">Color de las paredes</span>
                <input
                  type="color"
                  value={wallColor}
                  onChange={(event) => setWallColor(event.target.value)}
                  className="mt-2 h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-transparent"
                />
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="goal50-glass rounded-2xl border p-5">
              <p className="goal50-text text-lg font-black">{name || "Sin nombre"}</p>
              <p className="goal50-text-dim mt-1 text-[13px]">
                {selected.label} · {selected.width}×{selected.depth} m · alto {selected.height} m
              </p>
              <div className="mt-3 flex items-center gap-4">
                <span className="flex items-center gap-2">
                  <span className="size-5 rounded-full border border-white/20" style={{ background: floorColor }} />
                  <span className="goal50-text-dim text-[12px]">Suelo</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="size-5 rounded-full border border-white/20" style={{ background: wallColor }} />
                  <span className="goal50-text-dim text-[12px]">Paredes</span>
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {error ? <p className="mt-3 text-[12px] font-medium text-[#ff8fab]">{error}</p> : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (step === 0) {
                setMode("list");
                setEditingId(null);
              } else {
                setStep((s) => Math.max(0, s - 1));
              }
            }}
            className="goal50-tile rounded-full px-5 py-3 text-[13px] font-semibold"
          >
            Atrás
          </button>

          {step < 3 ? (
            <button
              type="button"
              disabled={step === 0 && name.trim().length === 0}
              onClick={() => setStep((s) => Math.min(3, s + 1))}
              className="rounded-full bg-lime px-6 py-3 text-[13px] font-bold text-black transition hover:brightness-110 disabled:opacity-40"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="button"
              disabled={saving || name.trim().length === 0}
              onClick={() => void save()}
              className="rounded-full bg-lime px-6 py-3 text-[13px] font-bold text-black transition hover:brightness-110 disabled:opacity-40"
            >
              {saving ? "Guardando…" : editingId ? "Guardar y entrar" : "Finalizar y entrar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
