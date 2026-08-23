"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Muestra <sección>/dashboard en la barra del navegador (p. ej. /jugador/dashboard)
 * sin perder la ubicación real: guarda la ruta en sessionStorage y, si el
 * documento se cargó por una recarga (F5), restaura la última ventana visitada.
 */
export function CleanUrl({ base }: { base: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const restoredRef = useRef(false);

  useEffect(() => {
    if (!pathname) return;
    const key = `11cracks:path:${base}`;
    const baseNorm = base.replace(/\/+$/, "");
    const cleanRoot = `${baseNorm}/dashboard`;

    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(key);
    } catch {}

    // ¿Este documento se cargó por una recarga?
    let navType = "";
    try {
      navType =
        (performance.getEntriesByType("navigation")[0] as
          | PerformanceNavigationTiming
          | undefined)?.type ?? "";
    } catch {}

    // Restaurar una sola vez por carga de documento
    if (
      navType === "reload" &&
      !restoredRef.current &&
      stored &&
      stored.startsWith(baseNorm) &&
      stored !== pathname
    ) {
      restoredRef.current = true;
      router.replace(stored);
      return;
    }

    // Recordar la ruta real actual
    if (pathname.startsWith(baseNorm)) {
      try {
        sessionStorage.setItem(key, pathname);
      } catch {}
    }

    // Cosmético: mostrar <sección>/dashboard
    if (window.location.pathname !== cleanRoot) {
      window.history.replaceState(null, "", cleanRoot);
    }
  }, [pathname, base, router]);

  return null;
}