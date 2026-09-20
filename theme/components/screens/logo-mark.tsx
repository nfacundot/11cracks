export function LogoMark({ className = "size-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={className}>
      <circle cx="32" cy="32" r="29" fill="none" stroke="#c6f232" strokeWidth="3" />
      <path d="M32 14l10.4 7.6-4 12.2H25.6l-4-12.2L32 14Z" fill="#c6f232" />
      <path
        d="M32 21.4v10.4M42.4 21.6l-8.6 6.2M23.6 21.6l8.2 6.4M38.4 34l3.4 10.4M25.6 34l-3.4 10.4M32 31.8l6.4 12.6H25.6L32 31.8Z"
        stroke="#c6f232"
        strokeWidth="2"
        fill="none"
      />
      <path d="M40 46l4-3.5 1 5 4.5-4" stroke="#c6f232" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}
