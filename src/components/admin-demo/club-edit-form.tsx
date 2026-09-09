"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTeam } from "@/actions/admin";
import type { AdminWorkspaceClub } from "@/components/admin-demo/admin-workspace";

export function ClubEditForm({ club }: { club: AdminWorkspaceClub }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [description, setDescription] = useState(club.description);

  return (
    <details className="admin-detail">
      <summary>Ver y editar</summary>
      <form
        className="admin-edit-form"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage(null);
          startTransition(async () => {
            const res = await updateTeam({ id: club.id, name: club.name, code: club.code, description });
            if (res?.error) {
              setMessage(res.error);
            } else {
              setMessage(res?.success ?? "Guardado");
              router.refresh();
            }
          });
        }}
      >
        <label>Nombre canónico<input value={club.name} readOnly aria-readonly="true" /></label>
        <label>Ubicación<input value={description} onChange={(e) => setDescription(e.target.value)} required /></label>
        <label>Clave<input value={club.code} readOnly aria-readonly="true" /></label>
        <button type="submit" disabled={pending} className="admin-edit-form__submit">{pending ? "Guardando…" : "Guardar cambios"}</button>
        {message ? <p className="admin-note">{message}</p> : null}
      </form>
    </details>
  );
}
