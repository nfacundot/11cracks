"use client";

import { Avatar } from "./dashboard-screen";

/* mancha orgánica verde sobre la retícula hexagonal */
const BLOB =
  "M150 90 C 175 55, 235 55, 258 85 C 288 92, 300 128, 282 152 C 296 176, 278 208, 248 210 C 236 238, 196 246, 168 228 C 140 244, 100 236, 90 206 C 62 198, 54 160, 74 140 C 58 116, 78 84, 108 86 C 122 68, 136 74, 150 90 Z";

export default function AnalysisScreen() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#f0f1ea] px-6 py-7">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-tight text-[#141414]">AI Analysis</h1>
        <span className="rounded-full bg-[#d9f2df] px-3.5 py-1.5 text-[12px] font-semibold text-[#141c10]">
          +10,2% bonus
        </span>
      </div>

      <div className="relative mx-auto mt-4 max-w-[440px]">
        {/* etiquetas de esquina */}
        {[
          ["01", "right-2 top-8"],
          ["02", "right-0 top-[46%]"],
          ["03", "right-4 bottom-10"],
          ["04", "left-1/2 -translate-x-1/2 bottom-2"],
          ["05", "left-4 bottom-10"],
          ["06", "left-0 top-[46%]"],
        ].map(([n, pos]) => (
          <span key={n} className={`absolute ${pos} text-[15px] font-semibold text-[#141414]`}>
            {n}
          </span>
        ))}

        <svg viewBox="0 0 360 300" className="block w-full">
          {/* marco exterior irregular */}
          <path
            d="M195 20 L320 45 L345 150 L300 262 L180 285 L60 258 L20 150 L45 42 Z"
            fill="none"
            stroke="#141414"
            strokeWidth="1.6"
          />
          {/* retícula hexagonal */}
          <g fill="none" stroke="rgba(20,20,20,0.28)" strokeWidth="0.8">
            <polygon points="180,60 265,105 265,195 180,240 95,195 95,105" />
            <line x1="180" y1="60" x2="180" y2="240" />
            <line x1="95" y1="105" x2="265" y2="195" />
            <line x1="265" y1="105" x2="95" y2="195" />
            <line x1="180" y1="150" x2="305" y2="20" />
          </g>
          {/* mancha verde */}
          <path d={BLOB} fill="#7ed491" stroke="#2f7d4f" strokeWidth="1.6" />
          {/* puntos de datos */}
          {[[268, 140], [288, 132], [308, 124], [328, 116]].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r="3" fill="#141414" />
          ))}
        </svg>

        {/* tooltip 156M € */}
        <div className="absolute right-[6%] top-[34%] flex -translate-y-1/2 items-center gap-1.5 rounded-full bg-[#141414] py-1.5 pl-1.5 pr-4">
          <Avatar i={5} size={22} />
          <Avatar i={3} size={22} />
          <span className="text-[13px] font-semibold text-white">156M €</span>
        </div>

        {/* avatares sobre la mancha */}
        <span className="absolute left-[22%] top-[30%] block size-16 rounded-full bg-white p-[3px] shadow-lg">
          <Avatar i={8} size={58} />
        </span>
        <span className="absolute left-[48%] top-[46%] block size-12 rounded-full bg-white p-[3px] shadow-lg">
          <Avatar i={7} size={42} />
        </span>
        <span className="absolute left-[30%] top-[62%] block size-12 rounded-full bg-white p-[3px] shadow-lg">
          <Avatar i={11} size={42} />
        </span>
      </div>
    </div>
  );
}
