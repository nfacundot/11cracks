"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { createPortal } from "react-dom";
import { XIcon } from "@/components/icons";
import { createUser, type AdminState } from "@/actions/admin";
import { UserSetupWizard } from "@/components/admin/user-setup-wizard";

const INPUT = "rounded-[10px] border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-medium text-(--text-primary) placeholder:text-[#686862] outline-none transition focus:border-[#C9A24A]/50 focus:bg-white/[0.06]";

export function AddUserModal({
  open,
  onClose,
  teams,
}: {
  open: boolean;
  onClose: () => void;
  teams: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<AdminState, FormData>(createUser, undefined);
  const [wizardOpen, setWizardOpen] = useState(false);

  const createdUserId = state?.userId ?? "";
  const createdUserName = state?.userName ?? "";

  useEffect(() => {
    if (state?.success && state.userId) {
      setWizardOpen(true);
    }
  }, [state]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 tk-panel backdrop-blur-[2px]" />
        <div className="animate-pop relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[#C9A24A]/10 tk-panel shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#C9A24A]/10 px-6 py-5">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9A24A]">ADMIN · ACCESOS</span>
              <h3 className="mt-1 text-lg font-black text-(--text-primary)">Agregar o actualizar usuario</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="rounded-full bg-white/5 p-2 text-[#686862] transition hover:bg-white/10 hover:text-(--text-primary)"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-[75vh] overflow-y-auto p-6">
            {state?.success ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <p className="text-sm font-bold text-emerald-400">{state.success}</p>
                <button
                  type="button"
                  onClick={() => { onClose(); window.location.reload(); }}
                  className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-black text-[#686862] transition hover:bg-white/5 hover:text-(--text-primary)"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form action={formAction} className="flex flex-col gap-4">
                {state?.error && (
                  <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-400">
                    {state.error}
                  </p>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#686862]">Persona existente (opcional)</span>
                    <input name="personId" placeholder="ID estable, si ya existe" className={INPUT} />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#686862]">Nombre completo *</span>
                    <input name="displayName" required maxLength={80} className={INPUT} placeholder="Nombre completo" />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#686862]">Correo de acceso *</span>
                    <input name="email" type="email" required className={INPUT} placeholder="correo@ejemplo.com" />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#686862]">Rol</span>
                    <select name="role" defaultValue="player" className={INPUT}>
                      <option value="player">Jugador</option>
                      <option value="coach">Entrenador</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#686862]">Nombre corto del jugador</span>
                    <input name="shortName" placeholder="Se muestra en roster" className={INPUT} />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#686862]">Número</span>
                    <input name="number" type="number" min="0" max="99" defaultValue="0" className={INPUT} />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#686862]">Posición</span>
                    <input name="position" placeholder="Mediocentro" className={INPUT} />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#686862]">Categoría</span>
                    <input name="category" placeholder="Sub-17" className={INPUT} />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#686862]">Club *</span>
                    <select name="clubId" required defaultValue="" className={INPUT}>
                      <option value="" disabled>Seleccionar club</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#686862]">Equipo *</span>
                    <select name="teamId" required defaultValue="" className={INPUT}>
                      <option value="" disabled>Seleccionar equipo</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5 sm:col-span-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#686862]">Acceso inicial</span>
                    <select name="status" defaultValue="pending" className={INPUT}>
                      <option value="pending">Invitación pendiente</option>
                      <option value="active">Activo</option>
                    </select>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-white/[0.05] pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-black text-[#686862] transition hover:bg-white/5 hover:text-(--text-primary)"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-xl bg-[#C9A24A] px-5 py-2.5 text-sm font-black text-[#080909] transition hover:bg-[#d4ad5a] disabled:opacity-50 active:scale-95"
                  >
                    {pending ? "Guardando..." : "Crear cuenta"}
                  </button>
                </div>

                <p className="text-[11px] font-medium text-[#686862] border-t border-white/[0.05] pt-3">
                  Para Jugador son obligatorios el perfil deportivo, el club, el equipo y el acceso. El rol Admin se asigna únicamente desde Gobierno global.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      <UserSetupWizard
        open={wizardOpen}
        onClose={() => { setWizardOpen(false); onClose(); window.location.reload(); }}
        userName={createdUserName}
        userId={createdUserId}
      />
    </>,
    document.body
  );
}
