"use client";

import { useActionState } from "react";
import { logout } from "@/actions/auth";
import { LogOutIcon } from "@/components/icons";

export function LogoutButton() {
  const [, action, pending] = useActionState(logout, undefined);

  return (
    <form action={action}>
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-red-100 py-3 font-bold text-red-500 transition hover:bg-red-50 active:scale-95 disabled:opacity-60"
      >
        <LogOutIcon className="h-4 w-4" />
        {pending ? "Saliendo..." : "Cerrar sesión"}
      </button>
    </form>
  );
}
