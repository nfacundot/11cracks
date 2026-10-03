"use client";

import { createContext, useContext } from "react";

/**
 * Permite que cualquier pantalla portada del tema GOAL50 abra otra app
 * en una ventana Winbox sin navegar fuera de /jugador/world.
 */
export const AppLauncherContext = createContext<(key: string) => void>(() => {});

export function useLauncher() {
  return useContext(AppLauncherContext);
}

/**
 * Acciones globales del escritorio (cerrar ventanas, salir con confirmación).
 */
export const DesktopActionsContext = createContext<{
  closeAll: () => void;
  confirmExit: () => void;
}>({ closeAll: () => {}, confirmExit: () => {} });

export function useDesktopActions() {
  return useContext(DesktopActionsContext);
}
