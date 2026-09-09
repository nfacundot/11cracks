"use client";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  variant?: "default" | "destructive";
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  variant = "default",
}: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:bg-zinc-900/95">
        {(title || description) && (
          <div className="mb-4">
            {title && <h3 className="text-lg font-black text-emerald-950 dark:text-white">{title}</h3>}
            {description && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
          </div>
        )}
        {children}
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border-2 border-zinc-200 px-4 py-2 text-sm font-black text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/40"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm?.();
              onClose();
            }}
            className={`rounded-xl px-4 py-2 text-sm font-black text-white transition ${
              variant === "destructive"
                ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-red-950"
                : "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-200 dark:shadow-green-950"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
}

export function AlertDialog({ open, onClose, title, message, confirmLabel = "Entendido" }: AlertDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} confirmLabel={confirmLabel} variant="default">
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{message}</p>
    </Dialog>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: (confirmed: boolean) => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

export function ConfirmDialog({
  open,
  onClose,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      title={title}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      variant={variant}
      onConfirm={() => onClose(true)}
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{message}</p>
    </Dialog>
  );
}