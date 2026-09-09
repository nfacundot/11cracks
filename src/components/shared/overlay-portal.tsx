"use client";

import { createPortal as reactCreatePortal } from "react-dom";
import type { ReactNode } from "react";

export type OverlayLayer = "modal" | "critical";

/**
 * All document-level overlays share one stacking context. The second argument
 * is intentionally accepted for compatibility with the old createPortal call
 * sites; portals are always mounted in the app's global overlay root.
 */
export function createOverlayPortal(
  children: ReactNode,
  _legacyContainer?: Element | DocumentFragment,
  layer: OverlayLayer = "modal",
) {
  if (typeof document === "undefined") return null;

  const root = document.getElementById("overlay-root");
  if (!root) return null;

  return reactCreatePortal(
    <div className="overlay-layer" data-overlay-layer={layer}>
      {children}
    </div>,
    root,
  );
}
