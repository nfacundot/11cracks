export default function RootLoading() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        backgroundColor: "var(--bg-base, #0b0d0c)",
        color: "var(--text-strong, #f2f5f2)",
        fontFamily: "var(--font-barlow)",
      }}
    >
      <img
        src="/img/icons/faviconlit.png"
        alt="11Cracks"
        width={72}
        height={72}
        style={{
          objectFit: "contain",
          animation: "cracks-loading-pulse 1.1s ease-in-out infinite",
        }}
      />
      <span
        style={{
          fontSize: 18,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--action-lime, #c3f53c)",
        }}
      >
        Cargando…
      </span>
      <style>{`
        @keyframes cracks-loading-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.86); opacity: 0.55; }
        }
      `}</style>
    </div>
  );
}
