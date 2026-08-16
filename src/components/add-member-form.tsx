"use client";

import { useActionState } from "react";
import { addMember } from "@/actions/team";
import { UserPlusIcon } from "@/components/icons";

export function AddMemberForm({ teamId }: { teamId: string }) {
  const [state, formAction] = useActionState(addMember, undefined);

  return (
    <form action={formAction} className="rounded-2xl bg-white/60 backdrop-blur-xl p-4 shadow-sm ring-1 ring-green-100 dark:bg-emerald-950/60 dark:backdrop-blur-xl dark:ring-green-900">
      <input type="hidden" name="teamId" value={teamId} />
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/15 text-green-600 dark:text-green-400">
          <UserPlusIcon className="h-5 w-5" />
        </span>
        <input
          name="username"
          placeholder="@usuario del estudiante"
          required
          className="w-full flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-bold text-emerald-950 outline-none transition placeholder:font-normal placeholder:text-zinc-400 focus:border-green-400 focus:ring-2 focus:ring-green-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        />
        <button
          type="submit"
          className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-green-700 active:scale-95"
        >
          Agregar
        </button>
      </div>
      {state?.error && (
        <p className="mt-2 text-xs font-bold text-red-500">{state.error}</p>
      )}
      {state?.success && (
        <p className="mt-2 text-xs font-black text-green-600 dark:text-green-400">
          {state.success}
        </p>
      )}
      <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">
        Escribe el usuario de un estudiante para sumarlo a tu equipo.
      </p>
    </form>
  );
}
