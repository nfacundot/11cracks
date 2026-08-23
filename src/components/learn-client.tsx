"use client";

import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons";
import { DashboardClient } from "@/components/dashboard-client";
import {
  RadarEvolucionPanel,
  type CharacteristicData,
  type IndicatorData,
} from "@/components/radar-evolucion-panel";

export function LearnClient({
  userName,
  userUsername,
  avatarUrl,
  userRole,
  characteristics,
  indicators,
}: {
  userName: string;
  userUsername: string;
  avatarUrl: string | null;
  userRole: string;
  characteristics: CharacteristicData[];
  indicators: IndicatorData[];
}) {
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col gap-6 pt-12">
      {/* ─── Content ─── */}
      <div className="flex flex-col gap-6">
        {/* Player info — outside the card */}
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName}
                className="h-[72px] w-[72px] rounded-full border-2 border-[#C9A24A]/40 object-cover sm:h-[90px] sm:w-[90px]"
              />
            ) : (
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-[#C9A24A]/40 bg-[#C9A24A]/10 sm:h-[90px] sm:w-[90px]">
                <span className="text-2xl font-bold text-[#C9A24A] sm:text-3xl">
                  {initials}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-[26px] font-bold uppercase leading-none tracking-wide text-[#F2F0E9] sm:text-[32px] md:text-[40px]">
              {userName}
            </h1>
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#C9A24A] sm:text-sm">
              {userRole}
            </span>
            <span className="text-[10px] font-medium text-[#686862] sm:text-xs">
              Forjadores Pro
            </span>
          </div>
        </div>

        {/* ─── Panel Tu Evolución (idéntico al de Mi Progreso) ─── */}
        <RadarEvolucionPanel characteristics={characteristics} indicators={indicators} />

        {/* Link a Mi Progreso */}
        <div className="flex justify-center">
          <Link
            href="/jugador/progress"
            className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#F2F0E9] transition hover:text-[#00C8F5]"
          >
            Ver mi progreso
            <ChevronRightIcon className="h-4 w-4 text-[#00C8F5]" />
          </Link>
        </div>
      </div>

      {/* ─── Dashboard ─── */}
      <DashboardClient />
    </div>
  );
}