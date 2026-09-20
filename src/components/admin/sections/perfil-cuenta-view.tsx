"use client";

import Link from "next/link";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";
import { roleLabel } from "@/lib/roles";

interface UserData {
  name: string;
  role: string;
}

export function PerfilCuentaView({ title, user }: { title: "Perfil" | "Configuración"; user: UserData }) {
  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="ADMIN · CUENTA"
        title={title}
        subtitle="Operación autorizada · alcance administrativo de tu organización."
      />

      <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6 max-w-md">
        <div className="flex flex-col gap-1 text-center">
          <p
            className="text-[20px] font-bold"
            style={{ fontFamily: S.barlow, color: S.textPrimary }}
          >
            {user.name}
          </p>
          <p
            className="text-[13px] font-medium"
            style={{ fontFamily: S.barlow, color: S.textSecondary }}
          >
            {roleLabel(user.role)} · 11 Cracks
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[#C9A24A]/25 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] transition hover:border-[#C9A24A]/50 hover:bg-[#C9A24A]/10"
            style={{ fontFamily: S.barlow, color: S.textPrimary }}
          >
            Volver al dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}