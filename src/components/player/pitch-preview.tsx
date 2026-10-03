"use client";

export type PitchPreviewPlayer = { id: string; name: string; avatarUrl: string | null };

export function PitchPreview({
  players,
  positions,
  meId,
}: {
  players: PitchPreviewPlayer[];
  positions: Record<string, { x: number; y: number }>;
  meId: string;
}) {
  const titulares = players.filter((p) => positions[p.id]);
  return (
    <div className="pitch-preview">
      <svg viewBox="0 0 100 150" preserveAspectRatio="none" className="pitch-preview__lines" aria-hidden>
        <g fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="0.4">
          <rect x="3" y="3" width="94" height="144" />
          <line x1="3" y1="75" x2="97" y2="75" />
          <circle cx="50" cy="75" r="13" />
          <circle cx="50" cy="75" r="0.8" fill="rgba(255,255,255,0.75)" stroke="none" />
          <rect x="24" y="3" width="52" height="18" />
          <rect x="37" y="3" width="26" height="7" />
          <path d="M40 21 A 11 11 0 0 0 60 21" />
          <rect x="24" y="129" width="52" height="18" />
          <rect x="37" y="140" width="26" height="7" />
          <path d="M40 129 A 11 11 0 0 1 60 129" />
          <rect x="42" y="0.8" width="16" height="2.2" />
          <rect x="42" y="147" width="16" height="2.2" />
        </g>
      </svg>
      {titulares.map((p) => {
        const pos = positions[p.id];
        const initials = p.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
        return (
          <span
            key={p.id}
            className="pitch-preview__player"
            data-mine={p.id === meId}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            {p.avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={p.avatarUrl} alt="" />
            ) : (
              <b>{initials}</b>
            )}
            <small>{p.name.split(" ")[0]}</small>
          </span>
        );
      })}
    </div>
  );
}
