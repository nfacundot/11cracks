"use client";

import { getCanchaTarget } from "@/lib/cancha-target";
import { PitchPreview } from "@/components/player/pitch-preview";

export default function CanchaPreviewScreen() {
  const target = getCanchaTarget();
  if (!target) {
    return <div className="goal50-text-dim grid h-full place-items-center p-6 text-sm">Sin alineación para mostrar.</div>;
  }
  return (
    <div className="no-scrollbar h-full overflow-y-auto p-4">
      <p className="goal50-text-dim text-[10px] font-bold uppercase tracking-[0.16em]">{target.title}</p>
      <div className="mt-3">
        <PitchPreview players={target.players} positions={target.positions} meId={target.meId} />
      </div>
    </div>
  );
}
