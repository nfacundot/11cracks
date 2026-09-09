import type { ReactNode } from "react";

export type ProgressState = "COMPLETED" | "IN_PROGRESS" | "AVAILABLE" | "LOCKED";

export function ProgressStateChip({ state, label, icon, className = "" }: { state: ProgressState; label: string; icon: ReactNode; className?: string }) {
  return <span className={`progress-state-chip ${className}`.trim()} data-state={state}>
    <b aria-hidden="true">{icon}</b>
    <span>{label}</span>
  </span>;
}
