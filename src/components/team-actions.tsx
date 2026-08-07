"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { leaveTeam, removeMember } from "@/actions/team";
import { CheckIcon, LogOutIcon, XIcon } from "@/components/icons";

export function TeamActions({
  teamId,
  canLeave,
  canRemove,
  memberUserId,
  memberName,
  copyCode,
  roleLabel,
}: {
  teamId: string;
  canLeave?: boolean;
  canRemove?: boolean;
  memberUserId?: string;
  memberName?: string;
  copyCode?: string;
  roleLabel?: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const copy = async () => {
    if (!copyCode) return;
    try {
      await navigator.clipboard.writeText(copyCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard no disponible */
    }
  };

  const doLeave = async () => {
    if (!confirm("¿Seguro que quieres salir de este equipo?")) return;
    setBusy(true);
    await leaveTeam(teamId);
    router.refresh();
  };

  const doRemove = async () => {
    if (!memberUserId || !memberName) return;
    if (!confirm(`¿Eliminar a ${memberName} del equipo?`)) return;
    setBusy(true);
    await removeMember(teamId, memberUserId);
    router.refresh();
  };

  if (copyCode) {
    return (
      <div className="flex items-center gap-2">
        {roleLabel && (
          <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-black text-green-300">
            {roleLabel}
          </span>
        )}
        <button
          onClick={copy}
          className="flex items-center gap-2 rounded-xl bg-green-500 px-3 py-2 text-xs font-black text-white transition hover:bg-green-600 active:scale-95"
        >
          {copied ? <CheckIcon className="h-3.5 w-3.5" /> : null}
          {copied ? "¡Copiado!" : "Copiar"}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-1 flex justify-end">
      {canRemove && (
        <button
          onClick={doRemove}
          disabled={busy}
          aria-label={`Eliminar a ${memberName}`}
          className="rounded-full bg-red-50 p-1.5 text-red-500 transition hover:bg-red-100 active:scale-95"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      )}
      {canLeave && (
        <button
          onClick={doLeave}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-xl border border-white/20 px-3 py-2 text-xs font-black text-white/80 transition hover:bg-white/10"
        >
          <LogOutIcon className="h-3.5 w-3.5" />
          Salir
        </button>
      )}
      {roleLabel && (
        <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-black text-green-300">
          {roleLabel}
        </span>
      )}
    </div>
  );
}
