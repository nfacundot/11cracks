const S = {
  barlow: 'var(--font-barlow), "Barlow Condensed", sans-serif',
  textPrimary: "#F3F0E8",
  textSecondary: "#AAA69C",
  gold: "#C89B32",
};

export function GlobalHero({
  eyebrow = "ADMIN · ORGANIZACIÓN",
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="px-0 pt-2 md:pt-4">
      <span
        className="text-[11px] font-bold uppercase tracking-[0.22em]"
        style={{ fontFamily: S.barlow, color: S.gold }}
      >
        {eyebrow}
      </span>
      <h2
        style={{
          fontFamily: S.barlow,
          fontWeight: 800,
          fontSize: "clamp(42px, 5vw, 64px)",
          lineHeight: 0.9,
          letterSpacing: "-0.03em",
          textTransform: "uppercase",
          color: S.textPrimary,
        }}
      >
        {title}
      </h2>
      <p
        className="mt-4"
        style={{
          fontFamily: S.barlow,
          fontWeight: 400,
          fontSize: "clamp(16px, 2vw, 18px)",
          color: S.textSecondary,
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}

export { S as globalStyles };
