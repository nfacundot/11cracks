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

export function IconSearch(p: P) {
  return (
    <S {...p}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
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

export function IconBall(p: P) {
  return (
    <S {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.4 15.9 10.2 14.4 14.8H9.6L8.1 10.2 12 7.4Z" fill="currentColor" stroke="none" />
      <path d="M12 3v4.4M15.9 10.2l4-1.1M14.4 14.8l2.5 3.4M9.6 14.8l-2.5 3.4M8.1 10.2l-4-1.1" />
    </S>
  );
}
