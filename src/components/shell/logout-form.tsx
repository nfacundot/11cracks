"use client";

import { logout } from "@/actions/auth";

export function LogoutForm({ className, buttonClassName }: { className?: string; buttonClassName?: string } = {}) {
  return (
    <form className={className} action={logout}>
      <button className={buttonClassName} type="submit">
        Cerrar sesión
      </button>
    </form>
  );
}
