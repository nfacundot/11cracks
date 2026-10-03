"use client";

import { useEffect, useRef, useState } from "react";
import { ElCaminoHome } from "@/components/player/el-camino-home";
import type { ClaseCamino } from "@/lib/el-camino/lecciones";

export default function CaminoScreen() {
  const [data, setData] = useState<{ playerId: string; caminos: ClaseCamino[] } | null>(null);
  const [error, setError] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/neurocracks", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("bad"))))
      .then((payload: { playerId: string; caminos: ClaseCamino[] }) => {
        if (active) setData(payload);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Intercepta "Empezar lección": en vez de navegar, avisa al mundo
  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest(".el-camino__detail-action") as HTMLAnchorElement | null;
      if (!anchor || anchor.tagName !== "A") return;
      event.preventDefault();
      event.stopPropagation();
      const title = document.getElementById("el-camino-leccion-detail-title")?.textContent?.trim() || "Lección";
      const href = anchor.getAttribute("href") ?? "";
      const match = href.match(/\/leccion\/([^/?#]+)/) ?? href.match(/[?&]lesson=([^&#]+)/);
      const lessonId = match ? decodeURIComponent(match[1]) : null;
      const node = lessonId
        ? data?.caminos.flatMap((c) => c.stages.flatMap((s) => s.nodes)).find((n) => n.id === lessonId)
        : undefined;
      window.dispatchEvent(
        new CustomEvent("goal50:start-lesson", {
          detail: { title, lessonId, lessonType: node?.lessonType ?? null },
        }),
      );
    };
    node.addEventListener("click", onClick, true);
    return () => node.removeEventListener("click", onClick, true);
  }, [data]);

  if (error) {
    return <div className="goal50-text-dim grid h-full place-items-center text-sm">No se pudo cargar El Camino.</div>;
  }
  if (!data) {
    return <div className="goal50-text-dim grid h-full place-items-center text-sm">Cargando El Camino…</div>;
  }

  return (
    <div ref={wrapRef} className="no-scrollbar h-full overflow-y-auto">
      <ElCaminoHome playerId={data.playerId} caminos={data.caminos} />
    </div>
  );
}
