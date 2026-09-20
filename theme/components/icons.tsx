import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function S({ children, ...p }: P) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...p}
    >
      {children}
    </svg>
  );
}

export function IconArrowRight(p: P) {
  return (
    <S {...p}>
      <path d="M4 12h15M13.5 6l6 6-6 6" />
    </S>
  );
}

export function IconArrowLeft(p: P) {
  return (
    <S {...p}>
      <path d="M20 12H5M10.5 6l-6 6 6 6" />
    </S>
  );
}

export function IconBell(p: P) {
  return (
    <S {...p}>
      <path d="M18 15v-4.5a6 6 0 1 0-12 0V15l-1.8 2.6h15.6L18 15Z" />
      <path d="M10 20.6a2.2 2.2 0 0 0 4 0" />
    </S>
  );
}

export function IconChat(p: P) {
  return (
    <S {...p}>
      <path d="M4 5.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-9l-4.5 3.6V16.5H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z" />
      <path d="M8.2 10h7.6M8.2 13h4.6" />
    </S>
  );
}

export function IconStar(p: P) {
  return (
    <S {...p}>
      <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8L12 3.5Z" />
    </S>
  );
}

export function IconSearch(p: P) {
  return (
    <S {...p}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </S>
  );
}

export function IconHome(p: P) {
  return (
    <S {...p}>
      <path d="M4 11l8-7 8 7v8.5a1.5 1.5 0 0 1-1.5 1.5H14.5v-6h-5v6H5.5A1.5 1.5 0 0 1 4 19.5V11Z" />
    </S>
  );
}

export function IconWallet(p: P) {
  return (
    <S {...p}>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
      <path d="M14.5 11.5H20v3.5h-5.5a1.75 1.75 0 0 1 0-3.5Z" />
    </S>
  );
}

export function IconFolder(p: P) {
  return (
    <S {...p}>
      <path d="M3.5 7A2.5 2.5 0 0 1 6 4.5h3.2c.72 0 1.4.31 1.88.85l.92 1.05H18A2.5 2.5 0 0 1 20.5 8.9V17a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 17V7Z" />
    </S>
  );
}

export function IconMenu(p: P) {
  return (
    <S {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </S>
  );
}

export function IconClose(p: P) {
  return (
    <S {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </S>
  );
}

export function IconCC(p: P) {
  return (
    <S {...p}>
      <rect x="2.5" y="5" width="19" height="14" rx="3.2" />
      <path d="M11 10.2a2.9 2.9 0 1 0 0 3.6M18 10.2a2.9 2.9 0 1 0 0 3.6" />
    </S>
  );
}

export function IconCast(p: P) {
  return (
    <S {...p}>
      <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-6.5" />
      <path d="M3 12.5a7.5 7.5 0 0 1 7.5 7.5M3 16.5a3.5 3.5 0 0 1 3.5 3.5" />
      <circle cx="3.6" cy="19.6" r="1" fill="currentColor" stroke="none" />
    </S>
  );
}

export function IconLiveCam(p: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...p}>
      <rect x="2" y="6.5" width="13" height="11" rx="3" fill="currentColor" />
      <path d="M15.5 10.9 22 7.3v9.4l-6.5-3.6z" fill="currentColor" />
    </svg>
  );
}

export function IconBall(p: P) {
  return (
    <S {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.4 15.9 10.2 14.4 14.8H9.6L8.1 10.2 12 7.4Z" fill="currentColor" stroke="none" />
      <path d="M12 3v4.4M15.9 10.2l4-1.1M14.4 14.8l2.5 3.4M9.6 14.8l-2.5 3.4M8.1 10.2l-4-1.1" />
    </S>
  );
}

export function IconBasketball(p: P) {
  return (
    <S {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3v18M5.7 5.7c3.5 3.5 9.1 3.5 12.6 0M5.7 18.3c3.5-3.5 9.1-3.5 12.6 0" />
    </S>
  );
}

export function IconFootball(p: P) {
  return (
    <S {...p}>
      <g transform="rotate(-45 12 12)">
        <ellipse cx="12" cy="12" rx="9.6" ry="5.9" />
        <path d="M8.6 12h6.8M10.6 10.3v3.4M13.4 10.3v3.4" />
      </g>
    </S>
  );
}

export function IconDart(p: P) {
  return (
    <S {...p}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5.4" />
      <circle cx="12" cy="12" r="1.9" fill="currentColor" stroke="none" />
    </S>
  );
}

export function IconClock(p: P) {
  return (
    <S {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.4 2" />
    </S>
  );
}

export function IconPause(p: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...p}>
      <rect x="6.5" y="5" width="3.6" height="14" rx="1.4" fill="currentColor" />
      <rect x="13.9" y="5" width="3.6" height="14" rx="1.4" fill="currentColor" />
    </svg>
  );
}

export function IconPlay(p: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...p}>
      <path d="M8.2 5.2a1.2 1.2 0 0 1 1.82-1.03l10 6.8a1.2 1.2 0 0 1 0 1.98l-10 6.8A1.2 1.2 0 0 1 8.2 18.7V5.2Z" fill="currentColor" />
    </svg>
  );
}
