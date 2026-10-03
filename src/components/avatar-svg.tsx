import { SHIELDS } from "@/lib/avatar";
import type { AvatarConfig } from "@/lib/avatar";

function contrastColor(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum > 150 ? "#111827" : "#ffffff";
}

const HAIR_CROWN = "M34 15 A16 10.5 0 0 1 66 15 L66 17 Q50 13 34 17 Z";
const SHORT_BANGS =
  "M36 14 Q50 9 64 14 L64 21 Q56 23.5 50 23.5 Q44 23.5 36 21 Z";
const BANGS =
  "M36 14 Q50 9 64 14 L64 20 Q61 23 58 20 Q54 23 50 20 Q46 23 42 20 Q39 23 36 20 Z";
const SPIKY_BANGS =
  "M36 14 Q50 9 64 14 L64 18 L61 22.5 L58 17.5 L54 22.5 L50 17.5 L46 22.5 L42 17.5 L39 22.5 L36 18 Z";
const SIDE_BANGS =
  "M36 14 Q50 9 64 14 L64 24 Q59 22 54 25 Q49 22 44 23 Q39 23 36 19 Z";
const AFRO_CROWN =
  "M33 24 Q33 2 50 2 Q67 2 67 24 Q67 28 60 25.5 Q52 23 50 23.5 Q48 23 40 25.5 Q33 28 33 24 Z";

type PoseId = "standing" | "celebrate" | "jump" | "kick" | "dribble";
type ArmType = "down" | "up" | "out" | "hold";
type LegType = "straight" | "bent" | "kick" | "ready";

type ArmShape = {
  jersey: string;
  shade: string;
  skin: string;
  hand: { x: number; y: number; r: number };
};

const ARMS: Record<"L" | "R", Record<ArmType, ArmShape>> = {
  L: {
    down: {
      jersey: "M29 46 L22 51 L21 58 L28 60 Z",
      shade: "M21 58 L28 60 L28 63 L21 61 Z",
      skin: "M21.5 56 L27.5 58 L26 78 L22 78 Z",
      hand: { x: 24, y: 80.5, r: 3.8 },
    },
    up: {
      jersey: "M30 46 L25 37 L21 39 L27 48 Z",
      shade: "M25 37 L21 39 L23 33 L26 33 Z",
      skin: "M22 36 L19 38 L16 29 L18 28 Z",
      hand: { x: 17.5, y: 27.5, r: 3.2 },
    },
    out: {
      jersey: "M30 46 L21 44.5 L20.5 51 L29 52 Z",
      shade: "M20.5 51 L29 52 L29 55 L20 54 Z",
      skin: "M21 45.5 L20.5 51 L18.5 60 L19.5 61 Z",
      hand: { x: 18.5, y: 62, r: 3.2 },
    },
    hold: {
      jersey: "M30 46 L44 49.5 L44 54.5 L32 52 Z",
      shade: "",
      skin: "M44 49.5 L44 55 L41 56 L41 50.5 Z",
      hand: { x: 41, y: 56.5, r: 3.4 },
    },
  },
  R: {
    down: {
      jersey: "M71 46 L78 51 L79 58 L72 60 Z",
      shade: "M79 58 L72 60 L72 63 L79 61 Z",
      skin: "M78.5 56 L72.5 58 L74 78 L78 78 Z",
      hand: { x: 76, y: 80.5, r: 3.8 },
    },
    up: {
      jersey: "M70 46 L75 37 L79 39 L73 48 Z",
      shade: "M75 37 L79 39 L77 33 L74 33 Z",
      skin: "M78 36 L81 38 L84 29 L82 28 Z",
      hand: { x: 82.5, y: 27.5, r: 3.2 },
    },
    out: {
      jersey: "M70 46 L79 44.5 L79.5 51 L71 52 Z",
      shade: "M79.5 51 L71 52 L71 55 L80 54 Z",
      skin: "M79 45.5 L79.5 51 L81.5 60 L80.5 61 Z",
      hand: { x: 81.5, y: 62, r: 3.2 },
    },
    hold: {
      jersey: "M70 46 L56 49.5 L56 54.5 L68 52 Z",
      shade: "",
      skin: "M56 49.5 L56 55 L59 56 L59 50.5 Z",
      hand: { x: 59, y: 56.5, r: 3.4 },
    },
  },
};

type LegShape = {
  leg: string[];
  sock: string;
  band: string;
  boot: [number, number, number, number];
  sole: [number, number, number, number];
};

const LEGS: Record<"L" | "R", Record<LegType, LegShape>> = {
  L: {
    straight: {
      leg: ["M36 73 L44 73 L43 94 L36.5 94 Z"],
      sock: "M36.5 82 L43.5 82 L43.2 94 L36.8 94 Z",
      band: "M36.7 82 L43.3 82 L43.2 85.5 L36.8 85.5 Z",
      boot: [34, 91, 12, 8],
      sole: [34, 96, 12, 3],
    },
    bent: {
      leg: ["M37 73 L44 73 L45 79 L37.5 79.5 Z", "M44 78 L45.5 86 L38 87 L37 79.5 Z"],
      sock: "M37.6 84 L45.3 83.5 L45.5 88 L37.8 88.5 Z",
      band: "M37.7 84 L45.2 83.6 L45 86 L37.6 86.3 Z",
      boot: [34.5, 84.5, 12, 7],
      sole: [34.5, 89.5, 12, 2.5],
    },
    kick: {
      leg: ["M36 73 L44 73 L43 94 L36.5 94 Z"],
      sock: "M36.5 82 L43.5 82 L43.2 94 L36.8 94 Z",
      band: "M36.7 82 L43.3 82 L43.2 85.5 L36.8 85.5 Z",
      boot: [34, 91, 12, 8],
      sole: [34, 96, 12, 3],
    },
    ready: {
      leg: ["M36 73 L44 73 L46 80 L37 81 Z", "M45.5 79 L47 86 L38.5 88 L37 81 Z"],
      sock: "M38 84.5 L46.6 83.5 L46.8 88.5 L38.3 89 Z",
      band: "M38.1 84.5 L46.4 83.6 L46.2 86 L38.2 86.3 Z",
      boot: [33.5, 85, 13, 7],
      sole: [33.5, 90, 13, 2.5],
    },
  },
  R: {
    straight: {
      leg: ["M56 73 L64 73 L63.5 94 L57 94 Z"],
      sock: "M56.5 82 L63.5 82 L63.2 94 L56.8 94 Z",
      band: "M56.7 82 L63.3 82 L63.2 85.5 L56.8 85.5 Z",
      boot: [54, 91, 12, 8],
      sole: [54, 96, 12, 3],
    },
    bent: {
      leg: ["M56 73 L63 73 L62 79 L62.5 79.5 Z", "M56 78 L54.5 86 L62 87 L63 79.5 Z"],
      sock: "M62.4 84 L54.7 83.5 L54.5 88 L62.2 88.5 Z",
      band: "M62.3 84 L54.8 83.6 L55 86 L62.4 86.3 Z",
      boot: [53.5, 84.5, 12, 7],
      sole: [53.5, 89.5, 12, 2.5],
    },
    kick: {
      leg: ["M56 73 L63 73 L64 78 L57 78.5 Z", "M57.5 77 L63.5 77 L65.5 84 L59.5 84.5 Z"],
      sock: "M60 80 L65.3 80.3 L65.6 84 L60.2 84 Z",
      band: "M60.1 80 L65.2 80.3 L65 82 L60.2 81.8 Z",
      boot: [56.5, 83, 12, 7],
      sole: [56.5, 88, 12, 2.5],
    },
    ready: {
      leg: ["M56 73 L64 73 L62 80 L63 81 Z", "M54.5 79 L53 86 L61.5 88 L63 81 Z"],
      sock: "M62 84.5 L53.4 83.5 L53.2 88.5 L61.7 89 Z",
      band: "M61.9 84.5 L53.6 83.6 L53.8 86 L61.8 86.3 Z",
      boot: [53.5, 85, 13, 7],
      sole: [53.5, 90, 13, 2.5],
    },
  },
};

const POSE_ARMS: Record<PoseId, ArmType> = {
  standing: "down",
  celebrate: "up",
  jump: "up",
  kick: "out",
  dribble: "out",
};

const POSE_LEGS: Record<PoseId, LegType> = {
  standing: "straight",
  celebrate: "straight",
  jump: "bent",
  kick: "kick",
  dribble: "ready",
};

function Arm({
  side,
  type,
  jersey,
  skin,
}: {
  side: "L" | "R";
  type: ArmType;
  jersey: string;
  skin: string;
}) {
  const a = ARMS[side][type];
  return (
    <g>
      <path d={a.jersey} fill={jersey} />
      {a.shade && <path d={a.shade} fill="rgba(0,0,0,0.12)" />}
      <path d={a.skin} fill={skin} />
      <circle cx={a.hand.x} cy={a.hand.y} r={a.hand.r} fill={skin} />
    </g>
  );
}

function Leg({
  side,
  type,
  skin,
  socks,
  boots,
}: {
  side: "L" | "R";
  type: LegType;
  skin: string;
  socks: string;
  boots: string;
}) {
  const l = LEGS[side][type];
  const [bx, by, bw, bh] = l.boot;
  const [sx, sy, sw, sh] = l.sole;
  return (
    <g>
      {l.leg.map((d) => (
        <path key={d} d={d} fill={skin} />
      ))}
      <path d={l.sock} fill={socks} />
      <path d={l.band} fill="rgba(255,255,255,0.22)" />
      <rect x={bx} y={by} width={bw} height={bh} rx={3.5} fill={boots} />
      <rect x={sx} y={sy} width={sw} height={sh} rx={1.5} fill="rgba(0,0,0,0.3)" />
      <rect
        x={bx + 2}
        y={by + 1.5}
        width={bw - 4}
        height={1.2}
        rx={0.6}
        fill="rgba(255,255,255,0.35)"
      />
    </g>
  );
}

export function AvatarSvg({
  config,
  size = 40,
}: {
  config: AvatarConfig;
  size?: number;
}) {
  const {
    skin,
    hair,
    hairColor,
    eyes,
    mouth,
    pose,
    jersey,
    shorts,
    socks,
    boots,
    number,
    shield,
    shieldUrl,
    accessory,
    background,
  } = config;
  const numColor = contrastColor(jersey);
  const shieldEmoji = SHIELDS.find((s) => s.id === shield)?.emoji ?? "—";
  const showBrows = eyes === "normal" || eyes === "round";
  const armsType: ArmType = accessory === "ball" ? "hold" : POSE_ARMS[pose];
  const legsType: LegType = POSE_LEGS[pose];

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label="Avatar de jugador"
      className="block h-full w-full"
    >
      <circle cx="50" cy="50" r="50" fill={background} />
      {legsType === "bent" ? (
        <ellipse cx="50" cy="92" rx="22" ry="2.5" fill="rgba(0,0,0,0.15)" />
      ) : (
        <ellipse cx="50" cy="97" rx="30" ry="3" fill="rgba(0,0,0,0.18)" />
      )}

      <Leg side="L" type={legsType} skin={skin} socks={socks} boots={boots} />
      <Leg side="R" type={legsType} skin={skin} socks={socks} boots={boots} />

      <path d="M34 69 L66 69 L67 79 Q50 84 33 79 Z" fill={shorts} />
      <path d="M34 69 L66 69 L66 72.5 L34 72.5 Z" fill="rgba(255,255,255,0.18)" />
      <path d="M33.5 77 Q50 82 66.5 77 L66 79.5 Q50 84.5 34 79.5 Z" fill="rgba(0,0,0,0.12)" />

      <path
        d="M30 46 Q50 41 70 46 Q74 66 66 68 Q50 73 34 68 Q26 66 30 46 Z"
        fill={jersey}
      />
      <path d="M31 46.5 Q50 42 69 46.5 L68 54 Q50 50 32 54 Z" fill="rgba(255,255,255,0.14)" />
      <path d="M50 42 Q70 46 72 64 Q64 70 50 71 Z" fill="rgba(0,0,0,0.1)" />
      <path d="M30 46 L43 43.8 L45 47.5 L32 49.8 Z" fill="rgba(255,255,255,0.2)" />
      <path d="M70 46 L57 43.8 L55 47.5 L68 49.8 Z" fill="rgba(255,255,255,0.2)" />

      <path
        d="M43.5 44 L50 53 L56.5 44 L56.5 47.5 C53 53.5 47 53.5 43.5 47.5 Z"
        fill="rgba(255,255,255,0.25)"
      />

      <Arm side="L" type={armsType} jersey={jersey} skin={skin} />
      <Arm side="R" type={armsType} jersey={jersey} skin={skin} />

      <rect x="45" y="39" width="10" height="8" rx="3" fill={skin} />

      {hair === "long" && (
        <>
          <path d="M31 12 C31 8 38 8 38 12 L38 32 C38 35 31 35 31 32 Z" fill={hairColor} />
          <path d="M69 12 C69 8 62 8 62 12 L62 32 C62 35 69 35 69 32 Z" fill={hairColor} />
          <circle cx="50" cy="15" r="13" fill={hairColor} opacity="0.55" />
        </>
      )}

      <circle cx="50" cy="24" r="16" fill={skin} />
      <circle
        cx="50"
        cy="24"
        r="16"
        fill="none"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="1"
      />

      {hair !== "long" && (
        <>
          <circle cx="34" cy="25" r="3.5" fill={skin} />
          <circle cx="66" cy="25" r="3.5" fill={skin} />
        </>
      )}

      {hair === "short" && (
        <g>
          <path d={HAIR_CROWN} fill={hairColor} />
          <path d={SHORT_BANGS} fill={hairColor} />
        </g>
      )}

      {hair === "fringe" && (
        <g>
          <path d={HAIR_CROWN} fill={hairColor} />
          <path d={BANGS} fill={hairColor} />
        </g>
      )}

      {hair === "spiky" && (
        <g>
          <path d={HAIR_CROWN} fill={hairColor} />
          <path d={SPIKY_BANGS} fill={hairColor} />
        </g>
      )}

      {hair === "side" && (
        <g>
          <path d={HAIR_CROWN} fill={hairColor} />
          <path d={SIDE_BANGS} fill={hairColor} />
        </g>
      )}

      {hair === "afro" && (
        <>
          <path d={AFRO_CROWN} fill={hairColor} />
          <g fill={hairColor}>
            <circle cx="50" cy="9" r="5" />
            <circle cx="41" cy="12" r="4.5" />
            <circle cx="59" cy="12" r="4.5" />
            <circle cx="50" cy="19" r="5" />
            <circle cx="42" cy="20.5" r="4.5" />
            <circle cx="58" cy="20.5" r="4.5" />
          </g>
        </>
      )}

      {hair === "curly" && (
        <g fill={hairColor}>
          <circle cx="50" cy="8" r="6.5" />
          <circle cx="42" cy="11" r="5.5" />
          <circle cx="58" cy="11" r="5.5" />
          <circle cx="34" cy="18" r="5.5" />
          <circle cx="66" cy="18" r="5.5" />
          <circle cx="42" cy="18.5" r="5" />
          <circle cx="58" cy="18.5" r="5" />
          <circle cx="50" cy="17.5" r="5.5" />
          <circle cx="36" cy="22.5" r="4.5" />
          <circle cx="64" cy="22.5" r="4.5" />
        </g>
      )}

      {hair === "long" && (
        <g>
          <path d={HAIR_CROWN} fill={hairColor} />
          <path d={BANGS} fill={hairColor} />
        </g>
      )}

      {hair === "bun" && (
        <g>
          <path d={HAIR_CROWN} fill={hairColor} />
          <path d={BANGS} fill={hairColor} />
          <circle cx="50" cy="6" r="5.5" fill={hairColor} />
          <circle cx="48.5" cy="5" r="1.8" fill="rgba(255,255,255,0.25)" />
        </g>
      )}

      {hair === "ponytail" && (
        <g>
          <path d={HAIR_CROWN} fill={hairColor} />
          <path d={BANGS} fill={hairColor} />
          <path d="M35 15 Q28 12 27 20 Q26 32 31 36 Q35 33 34 22 Z" fill={hairColor} />
        </g>
      )}

      {showBrows && (
        <g stroke={hairColor} strokeWidth="1.7" fill="none" strokeLinecap="round">
          <path d="M40 23.5 Q42.5 22 45 23" />
          <path d="M55 23 Q57.5 22 60 23.5" />
        </g>
      )}

      {eyes === "normal" && (
        <g>
          <ellipse cx="42.5" cy="27.5" rx="3" ry="3.8" fill="#ffffff" />
          <ellipse cx="57.5" cy="27.5" rx="3" ry="3.8" fill="#ffffff" />
          <circle cx="42.5" cy="28" r="2" fill="#3b2f2f" />
          <circle cx="57.5" cy="28" r="2" fill="#3b2f2f" />
          <circle cx="42" cy="26.6" r="0.7" fill="#ffffff" />
          <circle cx="57" cy="26.6" r="0.7" fill="#ffffff" />
        </g>
      )}

      {eyes === "round" && (
        <g>
          <circle cx="42.5" cy="27.5" r="4.5" fill="#ffffff" />
          <circle cx="57.5" cy="27.5" r="4.5" fill="#ffffff" />
          <circle cx="42.5" cy="28" r="2.4" fill="#3b2f2f" />
          <circle cx="57.5" cy="28" r="2.4" fill="#3b2f2f" />
          <circle cx="41.4" cy="26.6" r="1.1" fill="#ffffff" />
          <circle cx="56.4" cy="26.6" r="1.1" fill="#ffffff" />
          <circle cx="43.6" cy="29.2" r="0.5" fill="#ffffff" opacity="0.8" />
          <circle cx="58.6" cy="29.2" r="0.5" fill="#ffffff" opacity="0.8" />
        </g>
      )}

      {eyes === "closed" && (
        <path
          d="M39.5 28.5 Q42.5 25 45.5 28.5 M54.5 28.5 Q57.5 25 60.5 28.5"
          stroke="#111827"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
      )}

      <ellipse cx="38" cy="31.5" rx="2.6" ry="1.6" fill="#fca5a5" opacity="0.45" />
      <ellipse cx="62" cy="31.5" rx="2.6" ry="1.6" fill="#fca5a5" opacity="0.45" />

      <path
        d="M48 29 Q50 31 52 29"
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />

      {mouth === "smile" && (
        <path d="M44 33 Q50 40 56 33 Q50 37.5 44 33 Z" fill="#7c2d12" />
      )}

      {mouth === "smirk" && (
        <g>
          <path
            d="M43.5 34.5 Q48.5 37.5 54 33.5"
            stroke="#7c2d12"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="54.3" cy="32.8" r="0.9" fill="#7c2d12" />
        </g>
      )}

      {mouth === "laugh" && (
        <g>
          <path d="M42.5 32.5 Q50 42 57.5 32.5 Z" fill="#7c2d12" />
          <path
            d="M42.5 32.5 Q50 36.5 57.5 32.5"
            stroke="#ffffff"
            strokeWidth="1.7"
            fill="none"
          />
          <path d="M46.5 38 Q50 41.5 53.5 38 Z" fill="#ef4444" opacity="0.85" />
        </g>
      )}

      {mouth === "grin" && (
        <g>
          <path d="M43.5 33 Q50 41 56.5 33 Z" fill="#7c2d12" />
          <path
            d="M43.5 33 Q50 36.5 56.5 33"
            stroke="#ffffff"
            strokeWidth="1.6"
            fill="none"
          />
          <path d="M47 37.5 Q50 40 53 37.5 Z" fill="#ef4444" opacity="0.8" />
        </g>
      )}

      {mouth === "shy" && (
        <path
          d="M46 33.5 Q48 35.5 50 34 Q52 35.5 54 33.5"
          stroke="#7c2d12"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
      )}

      {mouth === "neutral" && (
        <path
          d="M45 35 L55 35"
          stroke="#7c2d12"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      )}

      {shield === "custom" && shieldUrl ? (
        <g>
          <rect x="35" y="46.5" width="11" height="14" rx="2" fill="#111827" />
          <image
            href={shieldUrl}
            x="36"
            y="47.5"
            width="9"
            height="12"
            preserveAspectRatio="xMidYMid meet"
          />
        </g>
      ) : shield !== "none" ? (
        <g>
          <path
            d="M35.5 47 H44.5 V51.5 C44.5 55 43 57.5 40 59 C37 57.5 35.5 55 35.5 51.5 Z"
            fill="#111827"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.8"
          />
          <text x="40" y="56.5" textAnchor="middle" fontSize="8.5">
            {shieldEmoji}
          </text>
        </g>
      ) : null}

      <text
        x="57.5"
        y="56.5"
        textAnchor="middle"
        fontSize="13"
        fontWeight="900"
        fill={numColor}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="0.4"
        paintOrder="stroke"
      >
        {number}
      </text>

      {accessory === "ball" && (
        <g>
          <circle cx="50" cy="55" r="7" fill="#ffffff" stroke="#111827" strokeWidth="1.3" />
          <path d="M50 51.5 L53.8 54 L52.3 58.5 L47.7 58.5 L46.2 54 Z" fill="#111827" />
          <path
            d="M50 51.5 L50 48.5 M50 58.5 L50 61.5 M46.2 54 L43.8 54.5 M53.8 54 L56.2 54.5 M47.7 58.5 L45.5 60.5 M52.3 58.5 L54.5 60.5"
            stroke="#111827"
            strokeWidth="1.1"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )}

      {accessory === "headband" && (
        <path d="M34 16 Q50 12 66 16 L66 21 Q50 17 34 21 Z" fill="#f8fafc" />
      )}

      {accessory === "cap" && (
        <g>
          <path
            d="M33 14 Q33 0.5 50 0.5 Q67 0.5 67 14 L67 17 Q61 20 50 20 Q39 20 33 17 Z"
            fill={jersey}
          />
          <path
            d="M28 16 Q50 22.5 72 16"
            stroke="#111827"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="50" cy="2" r="1.6" fill="#111827" />
        </g>
      )}

      {accessory === "beanie" && (
        <g>
          <path
            d="M33 15 Q33 0.5 50 0.5 Q67 0.5 67 15 Z"
            fill={hairColor}
          />
          <rect x="31.5" y="12" width="37" height="6.5" rx="3" fill={hairColor} />
          <rect x="31.5" y="12" width="37" height="2.4" rx="1.2" fill="rgba(255,255,255,0.22)" />
        </g>
      )}

      <circle cx="43" cy="18" r="3" fill="rgba(255,255,255,0.2)" />
    </svg>
  );
}
