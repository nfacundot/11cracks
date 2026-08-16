"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTeam } from "@/actions/admin";
import { useConfirmDialog } from "@/components/confirm-dialog";

export function DeleteTeamButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { confirm, node } = useConfirmDialog();

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (!(await confirm("¿Seguro que quieres eliminar este equipo? Se eliminará a todos sus miembros."))) return;
          startTransition(() => {
            void deleteTeam(id).then(() => router.refresh());
          });
        }}
        className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-red-500 transition hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/40"
      >
        Eliminar
      </button>
      {node}
    </>
  );
}
