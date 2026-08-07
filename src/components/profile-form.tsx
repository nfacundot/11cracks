"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { updateProfile, type ProfileState } from "@/actions/user";

const inputCls =
  "w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 font-medium text-zinc-800 placeholder-zinc-400 outline-none transition focus:border-green-400";

export function ProfileForm({
  user,
}: {
  user: {
    name: string;
    bio?: string | null;
    position?: string | null;
    favoriteTeam?: string | null;
    country?: string | null;
  };
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, undefined);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={action} className="flex flex-col gap-3">
      {state?.error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-600">
          {state.success}
        </p>
      )}

      <label className="text-xs font-bold text-zinc-500">
        Nombre
        <input name="name" defaultValue={user.name} required minLength={2} className={`${inputCls} mt-1`} />
      </label>

      <label className="text-xs font-bold text-zinc-500">
        Posición
        <input
          name="position"
          defaultValue={user.position ?? ""}
          placeholder="Delantero, Portero, Mediocampista..."
          className={`${inputCls} mt-1`}
        />
      </label>

      <label className="text-xs font-bold text-zinc-500">
        Equipo favorito
        <input
          name="favoriteTeam"
          defaultValue={user.favoriteTeam ?? ""}
          placeholder="Real Madrid, Boca, Barcelona..."
          className={`${inputCls} mt-1`}
        />
      </label>

      <label className="text-xs font-bold text-zinc-500">
        País
        <input
          name="country"
          defaultValue={user.country ?? ""}
          placeholder="Argentina, México, Colombia..."
          className={`${inputCls} mt-1`}
        />
      </label>

      <label className="text-xs font-bold text-zinc-500">
        Biografía
        <textarea
          name="bio"
          defaultValue={user.bio ?? ""}
          rows={3}
          maxLength={160}
          placeholder="Cuéntanos de tu amor por el fútbol..."
          className={`${inputCls} mt-1 resize-none`}
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-2xl bg-green-500 py-3 font-black text-white transition hover:bg-green-600 active:scale-95 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
