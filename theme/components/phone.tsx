import type { ReactNode } from "react";

/* Lime contour lines flowing across the sage backdrop */
export function Contours({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1440 1024"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <g stroke="#d3f95c" strokeWidth="1.6">
        <path d="M-80 250 C 240 110, 430 430, 770 330 S 1330 110, 1560 260" opacity=".55" />
        <path d="M-80 330 C 260 190, 470 490, 810 390 S 1350 190, 1560 330" opacity=".4" />
        <path d="M880 1090 C 980 830, 1250 870, 1330 650 C 1390 490, 1550 530, 1600 430" opacity=".5" />
        <path d="M1010 1110 C 1090 890, 1310 930, 1410 710" opacity=".35" />
        <path d="M-100 780 C 190 720, 300 910, 620 870" opacity=".3" />
        <ellipse cx="1270" cy="110" rx="230" ry="95" opacity=".28" />
      </g>
    </svg>
  );
}

/* Hardware-style phone frame with home indicator */
export function PhoneFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-[58px] bg-[#0e0e0c] p-[10px] ring-1 ring-black/50 shadow-[0_60px_120px_-40px_rgba(25,35,5,0.65)] ${className}`}
    >
      <div className="relative h-[824px] w-[380px] overflow-hidden rounded-[48px] bg-ink">
        {children}
        <div className="pointer-events-none absolute bottom-2 left-1/2 z-50 h-[5px] w-[118px] -translate-x-1/2 rounded-full bg-white/70" />
      </div>
    </div>
  );
}

/* Route wrapper: edge-to-edge on phones, framed on desktop */
export function ScreenShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-dvh bg-sage sm:grid sm:place-items-center sm:overflow-hidden sm:py-12">
      <Contours className="pointer-events-none absolute inset-0 hidden h-full w-full sm:block" />
      <div className="hidden sm:block">
        <div className="fit-phone">
          <PhoneFrame>{children}</PhoneFrame>
        </div>
      </div>
      <div className="h-dvh w-full sm:hidden">{children}</div>
    </main>
  );
}
