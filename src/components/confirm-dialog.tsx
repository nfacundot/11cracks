"use client";

import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { XIcon } from "@/components/icons";

type DialogState = {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
  resolve: (value: boolean) => void;
};

export function useConfirmDialog() {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const open = useCallback(
    (opts: {
      title?: string;
      message: string;
      confirmText?: string;
      cancelText?: string;
      danger?: boolean;
    }) => {
      return new Promise<boolean>((resolve) => {
        setDialog({
          title: opts.title ?? "Confirmar",
          message: opts.message,
          confirmText: opts.confirmText ?? "Aceptar",
          cancelText: opts.cancelText ?? "Cancelar",
          danger: opts.danger ?? false,
          resolve,
        });
      });
    },
    []
  );

  const confirm = useCallback(
    (message: string, opts?: { confirmText?: string; title?: string }) =>
      open({
        title: opts?.title,
        message,
        confirmText: opts?.confirmText ?? "Continuar",
        cancelText: "Cancelar",
        danger: true,
      }),
    [open]
  );

  const alert = useCallback(
    (message: string, opts?: { title?: string }) =>
      open({
        title: opts?.title ?? "Aviso",
        message,
        confirmText: "Entendido",
        danger: false,
      }),
    [open]
  );

  const close = (value: boolean) => {
    if (dialog) {
      dialog.resolve(value);
    }
    setDialog(null);
  };

  const node = dialog
    ? createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-emerald-950/60 backdrop-blur-[2px]"
          />
          <div
            className="animate-pop relative w-full max-w-sm overflow-hidden rounded-2xl bg-white/60 backdrop-blur-xl shadow-2xl ring-1 ring-green-100 dark:bg-emerald-950/60 dark:backdrop-blur-xl dark:ring-emerald-900"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
          >
            <div className="flex items-center justify-between border-b border-green-100 px-5 py-4 dark:border-emerald-900">
              <h3
                id="confirm-dialog-title"
                className="font-black text-emerald-950 dark:text-white"
              >
                {dialog.title}
              </h3>
              <button
                type="button"
                onClick={() => close(false)}
                aria-label="Cerrar"
                className="rounded-full bg-zinc-100 p-2 text-zinc-500 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <p
                id="confirm-dialog-message"
                className="text-sm font-semibold text-zinc-600 dark:text-zinc-300"
              >
                {dialog.message}
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="flex-1 rounded-xl border-2 border-green-100 px-4 py-2.5 text-sm font-black text-zinc-600 transition hover:bg-green-50 dark:border-emerald-800 dark:text-zinc-300 dark:hover:bg-emerald-900"
                >
                  {dialog.cancelText}
                </button>
                <button
                  type="button"
                  autoFocus
                  onClick={() => close(true)}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-black text-white transition active:scale-95 ${
                    dialog.danger
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {dialog.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return { confirm, alert, node };
}
