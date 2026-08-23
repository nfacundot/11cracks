"use client";

import Link from "next/link";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";
import { BallIcon, BookIcon, EyeIcon } from "@/components/icons";

const RUTAS = [
  { nombre: "Liderazgo", desc: "Decide, comunica y guía al equipo." },
  { nombre: "Bienestar emocional", desc: "Compite con equilibrio." },
  { nombre: "Educación financiera", desc: "Construye hábitos para tu futuro." },
  { nombre: "Tecnología", desc: "Muévete con confianza en el mundo digital." },
  { nombre: "Emprendimiento", desc: "Convierte ideas en oportunidades." },
  { nombre: "Sostenibilidad", desc: "Cuida el planeta desde tu equipo." },
  { nombre: "Proyecto de vida", desc: "Diseña tu siguiente capítulo." },
];

const DESAFIOS = [
  { icono: <EyeIcon className="h-5 w-5" />, nombre: "Oído de Crack", desc: "Escucha y reconoce" },
  { icono: <BallIcon className="h-5 w-5" />, nombre: "Gol de Palabra", desc: "Escucha y entiende" },
  { icono: <BookIcon className="h-5 w-5" />, nombre: "Letras de Crack", desc: "Escucha y construye" },
];

export function NeurocracksView() {
  return (
    <div className="flex flex-col gap-6 pt-12">
      {/* ─── Hero con contador ─── */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <GlobalHero
          eyebrow="UNIVERSO FORMATIVO"
          title="NeuroCracks"
          subtitle="Aprende nuevas herramientas para crecer como jugador y como persona."
        />
        <div className="shrink-0 rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 px-6 py-4 text-right">
          <p style={{ fontFamily: S.barlow, fontWeight: 800, fontSize: "clamp(30px, 3vw, 40px)", lineHeight: 1, color: S.textPrimary }}>
            1
          </p>
          <p className="text-[11px] font-medium uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
            experiencia
            <br />
            disponible
          </p>
        </div>
      </div>

      {/* ─── Explora tus áreas ─── */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-[16px] font-extrabold uppercase tracking-tight" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
            Explora tus áreas
          </h3>
          <p className="text-[12px] font-medium" style={{ fontFamily: S.barlow, color: "#686862" }}>
            7 rutas que vienen en camino
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RUTAS.map((r) => (
            <div key={r.nombre} className="rounded-[14px] border border-white/[0.05] bg-[#080909]/85 p-4">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: "#686862" }}>
                <span style={{ color: S.gold }}>✦</span> Próximamente
              </span>
              <p className="mt-2 text-[14px] font-bold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                {r.nombre}
              </p>
              <p className="mt-1 text-[11px] font-medium leading-snug" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-white/[0.06]" />

      {/* ─── Experiencia disponible ─── */}
      <section>
        <span className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ fontFamily: S.barlow, color: S.gold }}>
          Experiencia disponible
        </span>
        <h3 className="mt-1 text-[26px] font-extrabold uppercase tracking-tight" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
          Bilingüismo Sport
        </h3>
        <p className="mt-1 text-[13px] font-medium" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
          El idioma se entrena como el juego: escucha, decide y avanza.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {/* Lado 1: tarjeta principal */}
          <div className="relative overflow-hidden rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: "#686862" }}>
              NeuroCracks · entrenamiento de idioma
            </p>
            <p className="mt-3 font-extrabold uppercase leading-[0.95] tracking-tight" style={{ fontFamily: S.barlow, fontSize: "clamp(28px, 3vw, 38px)", color: S.textPrimary }}>
              Bilingüismo
              <br />
              Sport
            </p>
            <p className="mt-2 text-[13px] font-medium" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
              Entrena el idioma como entrenas en la cancha.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: "#686862" }}>
                Idioma
              </span>
              <span className="rounded-full border border-[#C9A24A]/30 bg-[#C9A24A]/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#E3C065]" style={{ fontFamily: S.barlow }}>
                Inglés
              </span>
              <Link
                href="/jugador/game/word"
                className="ml-auto inline-flex items-center gap-1.5 rounded-[10px] border border-[#C9A24A]/25 bg-transparent px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:border-[#C9A24A]/50 hover:bg-[#C9A24A]/10"
                style={{ fontFamily: S.barlow, color: S.textPrimary }}
              >
                Empezar →
              </Link>
            </div>
          </div>

          {/* Lado 2: siguientes desafíos */}
          <div className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: "#686862" }}>
              Siguiente desafío
            </p>
            <div className="mt-3 space-y-3">
              {DESAFIOS.map((d) => (
                <Link
                  key={d.nombre}
                  href="/jugador/game/word"
                  className="flex items-center gap-3 rounded-[12px] border border-white/[0.05] bg-white/[0.02] p-3 transition hover:border-[#C9A24A]/30"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#C9A24A]/30 bg-[#C9A24A]/10" style={{ color: "#E3C065" }}>
                    {d.icono}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                      {d.nombre}
                    </p>
                    <p className="text-[11px] font-medium" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
                      {d.desc}
                    </p>
                  </div>
                  <span className="shrink-0 text-[13px] font-bold" style={{ fontFamily: S.barlow, color: "#686862" }}>
                    →
                  </span>
                  <span className="shrink-0 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-400" style={{ fontFamily: S.barlow }}>
                    Disponible
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}