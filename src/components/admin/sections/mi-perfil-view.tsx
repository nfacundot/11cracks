"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";
import { setAvatar, updateProfile, type ProfileState } from "@/actions/user";
import { roleLabel } from "@/lib/roles";

export function MiPerfilView({
  user,
}: {
  user: {
    name: string;
    email: string;
    role: string;
    avatarUrl: string | null;
    bio: string | null;
    position: string | null;
    favoriteTeam: string | null;
    country: string | null;
  };
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(user.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateProfile,
    undefined,
  );

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state, router]);

  const showToast = (msg: string, kind: "ok" | "err") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, kind });
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  const handlePhotoUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir la imagen");

      const result = await setAvatar(data.url);
      if ("error" in result && result.error) {
        setUploadError(result.error);
      } else {
        setPreview(data.url);
        showToast("Foto actualizada", "ok");
        router.refresh();
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error al subir la imagen");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="TU IDENTIDAD"
        title="Mi perfil"
        subtitle="Mantén actualizada tu identidad personal y deportiva."
      />

      {/* ─── Foto + datos básicos ─── */}
      <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
        <div className="grid gap-6 md:grid-cols-[auto_1fr]">
          {/* Foto */}
          <div className="flex flex-col items-center gap-3">
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ fontFamily: S.barlow, color: "#686862" }}
            >
              Foto de perfil
            </span>
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-[#C9A24A]/40 bg-[#C9A24A]/10">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className="text-3xl font-extrabold text-[#E3C065]"
                  style={{ fontFamily: S.barlow }}
                >
                  {initials}
                </span>
              )}
            </div>
            <label
              className="cursor-pointer rounded-[10px] border border-[#C9A24A]/25 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:border-[#C9A24A]/50 hover:bg-[#C9A24A]/10"
              style={{ fontFamily: S.barlow, color: S.textPrimary }}
            >
              {uploading ? "Subiendo…" : "Cambiar foto"}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
              />
            </label>
            {uploadError && (
              <p
                className="text-[11px] font-medium text-red-400"
                style={{ fontFamily: S.barlow }}
              >
                {uploadError}
              </p>
            )}
          </div>

          {/* Datos de cuenta */}
          <div className="flex flex-col justify-center border-t border-white/[0.05] pt-5 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <span
              className="text-[11px] font-bold uppercase tracking-[0.22em]"
              style={{ fontFamily: S.barlow, color: S.gold }}
            >
              Identidad
            </span>
            <p
              className="mt-2 text-[26px] font-extrabold uppercase leading-none tracking-tight"
              style={{ fontFamily: S.barlow, color: S.textPrimary }}
            >
              {user.name}
            </p>
            <div className="mt-4 flex gap-2">
              {[
                { etiqueta: "Correo", valor: user.email },
                { etiqueta: "Rol", valor: roleLabel(user.role) },
              ].map((c) => (
                <div
                  key={c.etiqueta}
                  className="flex flex-1 items-center justify-between rounded-[10px] border border-white/[0.05] bg-white/[0.02] px-3 py-2"
                >
                  <span
                    className="text-[11px] font-medium uppercase tracking-[0.06em]"
                    style={{ fontFamily: S.barlow, color: "#686862" }}
                  >
                    {c.etiqueta}
                  </span>
                  <span
                    className="max-w-[60%] truncate text-[13px] font-bold"
                    style={{ fontFamily: S.barlow, color: S.textPrimary }}
                  >
                    {c.valor}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Formulario de perfil ─── */}
      <form action={formAction} className="flex flex-col gap-4">
        <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
          <h3
            className="text-[13px] font-extrabold uppercase tracking-[0.08em]"
            style={{ fontFamily: S.barlow, color: S.textPrimary }}
          >
            Datos personales
          </h3>
          <p
            className="mt-1 text-[11px] font-medium uppercase tracking-[0.1em]"
            style={{ fontFamily: S.barlow, color: "#686862" }}
          >
            Actualiza tu información
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              { name: "name", label: "Nombre", defaultValue: user.name, required: true, minLength: 2, maxLength: 50 },
              { name: "position", label: "Posición", defaultValue: user.position ?? "", placeholder: "Portero, Defensa, Mediocampista…" },
              { name: "favoriteTeam", label: "Equipo favorito", defaultValue: user.favoriteTeam ?? "", placeholder: "Real Madrid, Boca, Barcelona…" },
              { name: "country", label: "País", defaultValue: user.country ?? "", placeholder: "Colombia, Argentina, México…" },
            ].map((f) => (
              <label key={f.name} className="flex flex-col gap-1.5">
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                  style={{ fontFamily: S.barlow, color: "#686862" }}
                >
                  {f.label}
                </span>
                <input
                  name={f.name}
                  type="text"
                  defaultValue={f.defaultValue}
                  placeholder={f.placeholder}
                  required={f.required}
                  minLength={f.minLength}
                  maxLength={f.maxLength}
                  className="rounded-[10px] border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[13px] font-bold outline-none transition focus:border-[#C9A24A]/50"
                  style={{ fontFamily: S.barlow, color: S.textPrimary }}
                />
              </label>
            ))}
          </div>

          <label className="mt-3 flex flex-col gap-1.5">
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ fontFamily: S.barlow, color: "#686862" }}
            >
              Biografía
            </span>
            <textarea
              name="bio"
              defaultValue={user.bio ?? ""}
              rows={3}
              maxLength={160}
              placeholder="Cuéntanos de ti…"
              className="rounded-[10px] border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[13px] font-bold outline-none transition resize-none focus:border-[#C9A24A]/50"
              style={{ fontFamily: S.barlow, color: S.textPrimary }}
            />
          </label>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-[10px] bg-[#C9A24A] px-5 py-2.5 text-[13px] font-extrabold uppercase tracking-[0.1em] text-black transition hover:bg-[#E3C065] disabled:opacity-50"
              style={{ fontFamily: S.barlow }}
            >
              {pending ? "Guardando…" : "Guardar cambios"}
            </button>
            {state?.error && (
              <p
                className="text-[13px] font-bold text-red-400"
                style={{ fontFamily: S.barlow }}
              >
                {state.error}
              </p>
            )}
            {state?.success && (
              <p
                className="text-[13px] font-bold text-emerald-400"
                style={{ fontFamily: S.barlow }}
              >
                {state.success}
              </p>
            )}
          </div>
        </section>
      </form>

      {/* Toast */}
      {toast && (
        <div
          role="alert"
          className={`fixed left-1/2 top-6 z-[100] flex max-w-md -translate-x-1/2 items-center gap-3 rounded-[12px] border px-4 py-3 shadow-2xl shadow-black/60 ${
            toast.kind === "ok"
              ? "border-[#C9A24A]/50 tk-panel-solid"
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
              toast.kind === "ok" ? "text-(--text-primary)" : "text-red-400"
            }`}
          >
            {toast.msg}
          </p>
        </div>
      )}
    </div>
  );
}
