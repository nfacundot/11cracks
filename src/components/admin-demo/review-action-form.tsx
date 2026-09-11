"use client";

import { useActionState, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

type ReviewAction = (formData: FormData) => Promise<void>;
type ActionState = { status: "idle" | "success" | "error" | "cancelled"; message: string };

const initialState: ActionState = { status: "idle", message: "" };

export function ReviewActionForm({ action, confirmMessage, successMessage, submitLabel, children, className = "" }: { action: ReviewAction; confirmMessage?: string; successMessage: string; submitLabel: string; children?: ReactNode; className?: string }) {
  const router = useRouter();
  const [dirty, setDirty] = useState(false);
  const [state, formAction, pending] = useActionState(async (_previous: ActionState, formData: FormData): Promise<ActionState> => {
    if (confirmMessage && !window.confirm(confirmMessage)) return { status: "cancelled", message: "Operación cancelada." };
    formData.set("confirm", "true");
    try {
      await action(formData);
      setDirty(false);
      router.refresh();
      return { status: "success", message: successMessage };
    } catch (error) {
      return { status: "error", message: error instanceof Error ? error.message : "No se pudo completar la operación." };
    }
  }, initialState);
  return <form className={`review-action-form ${className}`} action={formAction} onChange={() => setDirty(true)} onSubmit={(event) => { if (dirty) event.currentTarget.dataset.formState = "dirty"; }}>
    <fieldset disabled={pending}>
      {children}
      <button type="submit" data-state={pending ? "saving" : "idle"}>{pending ? "Guardando…" : submitLabel}</button>
    </fieldset>
    <p className="review-action-form__state" aria-live="polite" data-status={state.status}>{pending ? "Guardando y verificando persistencia…" : state.message || (dirty ? "Cambios sin guardar" : "Listo para revisar")}</p>
  </form>;
}