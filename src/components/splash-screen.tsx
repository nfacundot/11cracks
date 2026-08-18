"use client";

import { useEffect, useState } from "react";
import { BallLogo } from "@/components/ball-logo";

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
      >
        <div className="flex h-full flex-col items-end justify-end p-8">
          <BallLogo size={112} className="animate-wiggle" src="/img/icons/favicon.png" />
        </div>
      </div>
    </div>
  );
}
