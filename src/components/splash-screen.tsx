"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHidden(true), 1200);
    return () => clearTimeout(t);
  }, []);

  if (hidden) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-emerald-950">
      <div
        className="h-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/img/back/splasher1.png)" }}
      />
    </div>
  );
}
