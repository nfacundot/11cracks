"use client";

import { useActionState, useRef, useState } from "react";
import {
  createSponsor,
  deleteSponsor,
  toggleSponsorActive,
  updateSponsor,
  type SponsorState,
} from "@/actions/sponsors";

export type SponsorRow = {
  id: string;
  name: string;
  imageUrl: string;
  slot: number;
  order: number;
  active: boolean;
};

const field =
  "w-full rounded-[10px] border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] font-semibold outline-none transition focus:border-[#C9A24A]/50";
const fieldLabel = "text-[10px] font-semibold uppercase tracking-[0.1em] text-[#686862]";

function SponsorFields({ sponsor, takenSlots }: { sponsor?: SponsorRow; takenSlots: number[] }) {
  const [imageUrl, setImageUrl] = useState(sponsor?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir el logo");
      setImageUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir el logo");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1">
        <span className={fieldLabel}>Nombre</span>
        <input name="name" defaultValue={sponsor?.name ?? ""} required minLength={2} maxLength={60} placeholder="Crack Cola" className={field} />
      </label>
      <label className="flex flex-col gap-1">
        <span className={fieldLabel}>Espacio (1-20)</span>
        <select name="slot" defaultValue={sponsor?.slot ? String(sponsor.slot) : ""} className={field}>
          <option value="">Sin asignar</option>
          {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n} disabled={takenSlots.includes(n)}>
              {n}
              {takenSlots.includes(n) ? " · ocupado" : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className={fieldLabel}>Orden</span>
        <input name="order" type="number" defaultValue={sponsor?.order ?? 0} className={field} />
      </label>

      <input type="hidden" name="imageUrl" value={imageUrl} />
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className={fieldLabel}>Logo (URL)</span>
        <input
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="/uploads/logo.png o https://…"
          className={field}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <label className="cursor-pointer rounded-[10px] border border-[#C9A24A]/30 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-(--text-primary) transition hover:border-[#C9A24A]/60 hover:bg-[#C9A24A]/10">
          {uploading ? "Subiendo…" : "Subir logo"}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
            className="hidden"
            onChange={(event) => upload(event.target.files?.[0])}
          />
        </label>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Vista previa" className="h-11 w-24 rounded-[8px] border border-white/10 bg-white/5 object-contain p-1" />
        ) : null}
        {error ? <p className="text-[12px] font-bold text-red-400">{error}</p> : null}
      </div>

      <label className="flex items-center gap-2 sm:col-span-2">
        <input type="checkbox" name="active" defaultChecked={sponsor?.active ?? true} className="size-4 accent-[#C9A24A]" />
        <span className="text-[12px] font-semibold text-(--text-primary)">Activo</span>
      </label>
    </div>
  );
}

export function SponsorsManager({ sponsors }: { sponsors: SponsorRow[] }) {
  const [state, formAction, pending] = useActionState<SponsorState, FormData>(createSponsor, undefined);

  return (
    <div className="flex flex-col gap-5">
      <form action={formAction} className="flex flex-col gap-3 rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5">
        <div>
          <h3 className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-(--text-primary)">Nuevo patrocinador</h3>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.1em] text-[#686862]">
            {sponsors.length} / 20 · se muestran en las vallas del estadio
          </p>
        </div>
        <SponsorFields takenSlots={sponsors.map((s) => s.slot).filter((n) => n > 0)} />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending || sponsors.length >= 20}
            className="rounded-[10px] bg-[#C9A24A] px-5 py-2.5 text-[13px] font-extrabold uppercase tracking-[0.1em] text-black transition hover:bg-[#E3C065] disabled:opacity-50"
          >
            {pending ? "Creando…" : "Crear patrocinador"}
          </button>
          {state?.error ? <p className="text-[13px] font-bold text-red-400">{state.error}</p> : null}
          {state?.success ? <p className="text-[13px] font-bold text-emerald-400">{state.success}</p> : null}
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {sponsors.length === 0 ? (
          <p className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 text-[13px] text-[#686862] sm:col-span-2">
            Aún no hay patrocinadores. Crea el primero con el formulario de arriba.
          </p>
        ) : (
          sponsors.map((sponsor) => (
            <details key={sponsor.id} className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-4">
              <summary className="flex cursor-pointer list-none items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sponsor.imageUrl} alt={sponsor.name} className="h-10 w-16 shrink-0 rounded-[8px] border border-white/10 bg-white/5 object-contain p-1" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-(--text-primary)">{sponsor.name}</p>
                  <p className="truncate text-[11px] font-medium text-[#686862]">
                    {sponsor.slot > 0 ? `Espacio ${sponsor.slot}` : "Sin espacio"} · Orden {sponsor.order}
                  </p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${sponsor.active ? "text-emerald-400" : "text-[#686862]"}`}>
                  {sponsor.active ? "Activo" : "Inactivo"}
                </span>
              </summary>

              <div className="mt-4 flex flex-col gap-3">
                <form action={updateSponsor} className="flex flex-col gap-3">
                  <input type="hidden" name="id" value={sponsor.id} />
                  <SponsorFields
                    sponsor={sponsor}
                    takenSlots={sponsors.filter((s) => s.id !== sponsor.id).map((s) => s.slot).filter((n) => n > 0)}
                  />
                  <button
                    type="submit"
                    className="self-start rounded-[10px] border border-[#C9A24A]/30 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-(--text-primary) transition hover:border-[#C9A24A]/60 hover:bg-[#C9A24A]/10"
                  >
                    Guardar cambios
                  </button>
                </form>

                <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
                  <form action={toggleSponsorActive}>
                    <input type="hidden" name="id" value={sponsor.id} />
                    <input type="hidden" name="active" value={sponsor.active ? "0" : "1"} />
                    <button
                      type="submit"
                      className="rounded-[10px] border border-white/[0.12] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-(--text-primary) transition hover:border-white/30"
                    >
                      {sponsor.active ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                  <form action={deleteSponsor}>
                    <input type="hidden" name="id" value={sponsor.id} />
                    <button
                      type="submit"
                      className="rounded-[10px] border border-red-500/25 bg-red-500/[0.06] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-red-400 transition hover:border-red-500/50 hover:bg-red-500/15"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            </details>
          ))
        )}
      </div>
    </div>
  );
}
