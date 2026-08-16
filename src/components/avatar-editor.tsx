"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Avatar } from "@/components/avatar";
import { AvatarSvg } from "@/components/avatar-svg";
import { Modal } from "@/components/admin/modal";
import { CameraIcon } from "@/components/camera-icon";
import { setAvatarConfig } from "@/actions/user";
import {
  DEFAULT_AVATAR_CONFIG,
  SKIN_TONES,
  HAIR_STYLES,
  HAIR_COLORS,
  EYE_STYLES,
  MOUTH_STYLES,
  POSE_STYLES,
  KIT_COLORS,
  UNIFORM_PRESETS,
  SHIELDS,
  ACCESSORIES,
  BACKGROUNDS,
  type AvatarConfig,
} from "@/lib/avatar";

function Swatch({
  color,
  selected,
  onClick,
}: {
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Color ${color}`}
      className={`h-8 w-8 rounded-full border-2 transition active:scale-90 ${
        selected
          ? "border-green-500 ring-2 ring-green-500/30"
          : "border-white/40 hover:scale-105 dark:border-white/20"
      }`}
      style={{ backgroundColor: color }}
    />
  );
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-black transition active:scale-95 ${
        selected
          ? "bg-green-500 text-white"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      }`}
    >
      {label}
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-2 text-[11px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
      {children}
    </h4>
  );
}

export function AvatarEditor({
  name,
  src,
  config,
}: {
  name: string;
  src?: string | null;
  config: AvatarConfig | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<AvatarConfig>(config ?? DEFAULT_AVATAR_CONFIG);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const shieldInputRef = useRef<HTMLInputElement>(null);
  const [uploadingShield, setUploadingShield] = useState(false);

  const openEditor = () => {
    setDraft(config ?? DEFAULT_AVATAR_CONFIG);
    setError("");
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await setAvatarConfig(draft);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("No se pudo guardar el avatar");
    } finally {
      setSaving(false);
    }
  };

  const uploadShield = async (file: File) => {
    setUploadingShield(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Error al subir el escudo");
        return;
      }
      setDraft((d) => ({ ...d, shield: "custom", shieldUrl: data.url }));
    } catch {
      setError("No se pudo subir el escudo");
    } finally {
      setUploadingShield(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openEditor}
        className="group relative rounded-full transition active:scale-95"
        aria-label="Editar avatar"
      >
        <Avatar
          name={name}
          src={src}
          config={config}
          size={88}
          className="ring-4 ring-white shadow-lg dark:ring-emerald-800"
        />
        <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-white shadow-md transition group-hover:bg-green-600">
          <CameraIcon className="h-4 w-4" />
        </span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Editar avatar" size="xl">
        <div className="flex flex-col gap-5 md:flex-row md:gap-6">
          <div className="flex shrink-0 flex-col items-center gap-3 md:w-[300px]">
            <div className="aspect-square w-full overflow-hidden rounded-2xl ring-4 ring-white shadow-xl dark:ring-emerald-800">
              <AvatarSvg config={draft} />
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {POSE_STYLES.map((p) => (
                <Chip
                  key={p.id}
                  label={p.label}
                  selected={draft.pose === p.id}
                  onClick={() => setDraft((d) => ({ ...d, pose: p.id }))}
                />
              ))}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-4 md:max-h-[calc(88vh-9rem)] md:overflow-y-auto md:pr-1">
            <div>
              <SectionTitle>Uniforme</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {UNIFORM_PRESETS.map((p) => {
                  const selected =
                    draft.jersey === p.jersey &&
                    draft.shorts === p.shorts &&
                    draft.socks === p.socks;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          jersey: p.jersey,
                          shorts: p.shorts,
                          socks: p.socks,
                        }))
                      }
                      className={`flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-xs font-black transition active:scale-95 ${
                        selected
                          ? "bg-green-500 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      }`}
                    >
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full text-[9px]"
                        style={{ backgroundColor: p.jersey, color: p.shorts }}
                      >
                        ●
                      </span>
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <SectionTitle>Camiseta</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {KIT_COLORS.map((c) => (
                  <Swatch
                    key={c}
                    color={c}
                    selected={draft.jersey === c}
                    onClick={() => setDraft((d) => ({ ...d, jersey: c }))}
                  />
                ))}
              </div>
            </div>

            <div>
              <SectionTitle>Pantalón</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {KIT_COLORS.map((c) => (
                  <Swatch
                    key={c}
                    color={c}
                    selected={draft.shorts === c}
                    onClick={() => setDraft((d) => ({ ...d, shorts: c }))}
                  />
                ))}
              </div>
            </div>

            <div>
              <SectionTitle>Medias</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {KIT_COLORS.map((c) => (
                  <Swatch
                    key={c}
                    color={c}
                    selected={draft.socks === c}
                    onClick={() => setDraft((d) => ({ ...d, socks: c }))}
                  />
                ))}
              </div>
            </div>

            <div>
              <SectionTitle>Tacos</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {KIT_COLORS.map((c) => (
                  <Swatch
                    key={c}
                    color={c}
                    selected={draft.boots === c}
                    onClick={() => setDraft((d) => ({ ...d, boots: c }))}
                  />
                ))}
              </div>
            </div>

            <div>
              <SectionTitle>Escudo</SectionTitle>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {SHIELDS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        shield: s.id,
                        shieldUrl: s.id === "custom" ? d.shieldUrl : d.shieldUrl,
                      }))
                    }
                    className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-black transition active:scale-95 ${
                      draft.shield === s.id
                        ? "bg-green-500 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <span>{s.emoji}</span>
                    {s.label}
                  </button>
                ))}
              </div>
              {draft.shield === "custom" && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => shieldInputRef.current?.click()}
                    disabled={uploadingShield}
                    className="rounded-xl bg-green-500 px-3.5 py-2 text-xs font-black text-white transition hover:bg-green-600 active:scale-95 disabled:opacity-50"
                  >
                    {uploadingShield ? "Subiendo..." : "Subir mi escudo"}
                  </button>
                  {draft.shieldUrl && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 dark:text-zinc-500">
                      <Image
                        src={draft.shieldUrl}
                        alt=""
                        width={24}
                        height={24}
                        unoptimized
                        className="h-6 w-6 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-emerald-900"
                      />
                      Escudo cargado
                    </span>
                  )}
                  <input
                    ref={shieldInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadShield(file);
                      e.target.value = "";
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <SectionTitle>Número</SectionTitle>
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                Número de camiseta
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={draft.number}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isInteger(n) && n >= 1 && n <= 99) {
                      setDraft((d) => ({ ...d, number: n }));
                    }
                  }}
                  className="w-16 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-center font-black dark:border-emerald-900 dark:bg-emerald-950"
                />
              </label>
            </div>

            <div>
              <SectionTitle>Piel</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {SKIN_TONES.map((c) => (
                  <Swatch
                    key={c}
                    color={c}
                    selected={draft.skin === c}
                    onClick={() => setDraft((d) => ({ ...d, skin: c }))}
                  />
                ))}
              </div>
            </div>

            <div>
              <SectionTitle>Pelo</SectionTitle>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {HAIR_STYLES.map((s) => (
                  <Chip
                    key={s.id}
                    label={s.label}
                    selected={draft.hair === s.id}
                    onClick={() => setDraft((d) => ({ ...d, hair: s.id }))}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {HAIR_COLORS.map((c) => (
                  <Swatch
                    key={c}
                    color={c}
                    selected={draft.hairColor === c}
                    onClick={() => setDraft((d) => ({ ...d, hairColor: c }))}
                  />
                ))}
              </div>
            </div>

            <div>
              <SectionTitle>Ojos</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {EYE_STYLES.map((s) => (
                  <Chip
                    key={s.id}
                    label={s.label}
                    selected={draft.eyes === s.id}
                    onClick={() => setDraft((d) => ({ ...d, eyes: s.id }))}
                  />
                ))}
              </div>
            </div>

            <div>
              <SectionTitle>Boca</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {MOUTH_STYLES.map((s) => (
                  <Chip
                    key={s.id}
                    label={s.label}
                    selected={draft.mouth === s.id}
                    onClick={() => setDraft((d) => ({ ...d, mouth: s.id }))}
                  />
                ))}
              </div>
            </div>

            <div>
              <SectionTitle>Accesorio</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {ACCESSORIES.map((s) => (
                  <Chip
                    key={s.id}
                    label={s.label}
                    selected={draft.accessory === s.id}
                    onClick={() => setDraft((d) => ({ ...d, accessory: s.id }))}
                  />
                ))}
              </div>
            </div>

            <div>
              <SectionTitle>Fondo</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {BACKGROUNDS.map((c) => (
                  <Swatch
                    key={c}
                    color={c}
                    selected={draft.background === c}
                    onClick={() => setDraft((d) => ({ ...d, background: c }))}
                  />
                ))}
              </div>
            </div>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-bold text-red-500">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="w-full rounded-2xl bg-green-500 py-3.5 font-black text-white shadow-lg transition hover:bg-green-600 active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar avatar"}
          </button>
      </Modal>
    </>
  );
}
