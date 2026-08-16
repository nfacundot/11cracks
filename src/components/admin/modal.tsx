"use client";

import { createPortal } from "react-dom";
import { XIcon } from "@/components/icons";

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  if (!open) return null;

  const maxW = size === "xl" ? "max-w-3xl" : size === "lg" ? "max-w-2xl" : "max-w-lg";
  const maxH =
    size === "xl" ? "max-h-[88vh]" : size === "lg" ? "max-h-[82vh]" : "max-h-[70vh]";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-emerald-950/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={`animate-pop relative w-full overflow-hidden rounded-2xl bg-white/60 backdrop-blur-xl shadow-2xl ring-1 ring-green-100 dark:bg-emerald-950/60 dark:backdrop-blur-xl dark:ring-emerald-900 ${maxW}`}
      >
        <div className="flex items-center justify-between border-b border-green-100 px-5 py-4 dark:border-emerald-900">
          <h3 className="font-black text-emerald-950 dark:text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full bg-zinc-100 p-2 text-zinc-500 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <div className={`${maxH} overflow-y-auto p-5`}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
