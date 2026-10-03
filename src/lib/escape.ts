"use client";

type EscapeHandler = () => boolean;

const handlers: EscapeHandler[] = [];

/** Registra un manejador de Escape. Devuelve una función para desregistrarlo. */
export function pushEscapeHandler(handler: EscapeHandler) {
  handlers.push(handler);
  return () => {
    const index = handlers.indexOf(handler);
    if (index >= 0) handlers.splice(index, 1);
  };
}

/** Ejecuta el manejador más reciente que consuma el Escape. */
export function runEscapeHandlers(): boolean {
  for (let i = handlers.length - 1; i >= 0; i -= 1) {
    if (handlers[i]()) return true;
  }
  return false;
}
