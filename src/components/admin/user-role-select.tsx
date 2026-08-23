"use client";

import { useTransition } from "react";
import { setUserRole, deleteUser } from "@/actions/admin";
import { useConfirmDialog } from "@/components/confirm-dialog";

const ROLE_OPTIONS = [
  { value: "SUPERADMIN", label: "Superadministrador", staffOnly: true },
  { value: "ADMIN", label: "Administrador", staffOnly: true },
  { value: "ENTRENADOR", label: "Entrenador", staffOnly: false },
  { value: "JUGADOR", label: "Jugador", staffOnly: false },
] as const;

export function UserRoleSelect({
  userId,
  currentRole,
  isProtected,
  viewerIsSuperadmin,
}: {
  userId: string;
  currentRole: string;
  isProtected: boolean;
  viewerIsSuperadmin: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const targetIsStaff = currentRole === "SUPERADMIN" || currentRole === "ADMIN";
  const locked = pending || isProtected || (targetIsStaff && !viewerIsSuperadmin);
  const options = ROLE_OPTIONS.filter((r) => viewerIsSuperadmin || !r.staffOnly);

  return (
    <select
      value={currentRole}
      disabled={locked}
      onChange={(e) => {
        const role = e.target.value as (typeof ROLE_OPTIONS)[number]["value"];
        startTransition(() => {
          void setUserRole(userId, role);
        });
      }}
      className={`rounded-lg border-2 px-2 py-1.5 text-xs font-bold outline-none transition disabled:opacity-50 ${
        isProtected
          ? "cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-emerald-900"
          : "border-green-200 bg-white/60 backdrop-blur-xl text-emerald-950 hover:border-green-400 dark:border-emerald-800 dark:bg-emerald-950/60 dark:backdrop-blur-xl dark:text-white"
      }`}
    >
      {options.map((role) => (
        <option key={role.value} value={role.value}>
          {role.label}
        </option>
      ))}
    </select>
  );
}

export function DeleteUserButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  const { confirm, node } = useConfirmDialog();

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (!(await confirm("¿Seguro que quieres eliminar este usuario? Se borrará todo su progreso."))) return;
          startTransition(() => {
            void deleteUser(userId);
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
