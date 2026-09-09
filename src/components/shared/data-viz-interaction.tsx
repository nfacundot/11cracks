"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";

export type DataVizDatum = {
  id: string;
  label: string;
  value: number;
  secondary?: string;
};

export function useDataVizInteraction() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || !rootRef.current?.contains(target)) setActiveId(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveId(null);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return { rootRef, activeId, activate: setActiveId, close: () => setActiveId(null) };
}

export function DataVizPoint({
  datum,
  active,
  anchorRef,
  onActivate,
  children,
}: {
  datum: DataVizDatum;
  active: boolean;
  anchorRef: RefObject<SVGGraphicsElement | null>;
  onActivate: () => void;
  children: ReactNode;
}) {
  const label = `${datum.label}: ${datum.value} de 100${datum.secondary ? `. ${datum.secondary}` : ""}`;
  return (
    <g
      ref={anchorRef}
      className={active ? "is-active" : undefined}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={active}
      onPointerEnter={(event) => { if (event.pointerType !== "touch") onActivate(); }}
      onPointerMove={(event) => { if (event.pointerType !== "touch") onActivate(); }}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      onFocusCapture={onActivate}
      onClick={onActivate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onActivate();
        }
      }}
    >
      {children}
    </g>
  );
}

export function DataVizTooltip({
  datum,
  anchorRef,
  visible,
  accent = "var(--brand-gold)",
}: {
  datum: DataVizDatum;
  anchorRef: RefObject<Element | null>;
  visible: boolean;
  accent?: string;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 12, top: 12 });

  useLayoutEffect(() => {
    if (!visible || !anchorRef.current || !tooltipRef.current) return;
    const updatePosition = () => {
      const anchor = anchorRef.current?.getBoundingClientRect();
      const tooltip = tooltipRef.current?.getBoundingClientRect();
      if (!anchor || !tooltip) return;
      const margin = 12;
      const bottomSafeArea = window.innerWidth < 1024 ? 76 : margin;
      let left = anchor.right + margin;
      if (left + tooltip.width > window.innerWidth - margin) left = anchor.left - tooltip.width - margin;
      left = Math.max(margin, Math.min(left, window.innerWidth - tooltip.width - margin));
      let top = anchor.top + (anchor.height - tooltip.height) / 2;
      top = Math.max(margin, Math.min(top, window.innerHeight - tooltip.height - bottomSafeArea));
      setPosition({ left, top });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, datum.id, visible]);

  if (!visible) return null;
  return (
    <div
      ref={tooltipRef}
      className="data-viz-tooltip"
      role="tooltip"
      aria-live="polite"
      style={{ left: position.left, top: position.top, "--data-viz-accent": accent } as CSSProperties}
    >
      <span>{datum.label}</span>
      <strong>{datum.value} / 100</strong>
      {datum.secondary ? <small>{datum.secondary}</small> : null}
    </div>
  );
}