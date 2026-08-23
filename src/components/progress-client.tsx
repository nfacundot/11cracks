"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";
import { RadarEvolucionPanel } from "@/components/radar-evolucion-panel";

type CharacteristicData = {
  id: string;
  name: string;
  percentage: number;
};

type IndicatorData = {
  id: string;
  name: string;
  category: string;
  percentage: number;
};

const CHART_DATA = [
  { month: "Abr", value: 68 },
  { month: "May", value: 70 },
  { month: "Jun", value: 73 },
  { month: "Jul", value: 71 },
  { month: "Ago", value: 72 },
];

const FORTALEZAS = [
  { label: "Velocidad", value: 68, note: "Evolución positiva" },
  { label: "Resistencia", value: 81, note: "Sostienes el ritmo" },
];

const PARA_MEJORAR = [
  { label: "Decisión", value: 66, note: "Objetivo actual" },
  { label: "Planificación", value: 63, note: "Reforzar en sesión" },
];

const EVALUACIONES_RECIENTES = [
  { title: "Entrenamiento técnico", subtitle: "Técnica · sesión de campo", date: "12 ago 2026" },
  { title: "Evaluación de rendimiento", subtitle: "Deporte · período anterior", date: "29 jul 2026" },
  { title: "Revisión NeuroCracks", subtitle: "Atención y decisión", date: "15 jul 2026" },
];

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6 ${className}`}>
      <h3
        className="text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ fontFamily: S.barlow, color: S.textSecondary }}
      >
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub: string }) {
  return (
    <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6 flex-1 min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
        {label}
      </p>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <span style={{ fontFamily: S.barlow, fontWeight: 800, fontSize: "clamp(28px, 3vw, 40px)", color: S.textPrimary }}>
          {value}
        </span>
        <span className="text-[11px] font-medium text-[#686862] shrink-0" style={{ fontFamily: S.barlow }}>
          {sub}
        </span>
      </div>
    </section>
  );
}

function MetricRow({ label, value, note, good = true }: { label: string; value: number; note: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.05]">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium truncate" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
          {label}
        </p>
        <p className="text-[11px] font-medium text-[#686862] truncate" style={{ fontFamily: S.barlow }}>
          {note}
        </p>
      </div>
      <span className="shrink-0 text-[15px] font-extrabold" style={{ fontFamily: S.barlow, color: good ? "#22c55e" : "#ef4444" }}>
        {value}%
      </span>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â• Vista principal â•â•â•â•â•â•â•â•â•â•â• */
export function ProgressClient({
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
  return (
    <div className="flex flex-col gap-6 pt-12">
      {/* ─── Hero ─── */}
      <GlobalHero
        eyebrow="PLAYER · ANÁLISIS PERSONAL"
        title="Mi progreso"
        subtitle="Lee tu evolución y decide el siguiente foco de entrenamiento."
      />

      {/* ─── Panel de radar restaurado ─── */}
      <RadarEvolucionPanel characteristics={characteristics} indicators={indicators} />

      {/* ─── 4 Paneles de métricas ─── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Asistencia" value="92%" sub="último período" />
        <StatCard label="Consistencia" value="4" sub="días" />
        <StatCard
          label="Horas validadas"
          value={
            <>
              130 <span style={{ fontWeight: 400, fontSize: "0.6em", color: S.textSecondary }}>/ 540 h</span>
            </>
          }
          sub=""
        />
        <StatCard label="Evaluaciones" value="4" sub="registradas" />
      </div>

      {/* ─── Gráfico de línea + Lectura actual ─── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Panel title="CAMBIO EN EL TIEMPO">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[15px] font-bold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                Evolución del período
              </p>
              <p className="text-[13px] font-medium text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
                72 / 100
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={CHART_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#686862", fontFamily: S.barlow }} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} tickLine={false} />
              <YAxis domain={[60, 85]} tick={{ fontSize: 11, fill: "#686862", fontFamily: S.barlow }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#080909",
                  border: "1px solid rgba(201,162,74,0.3)",
                  borderRadius: 10,
                  color: S.textPrimary,
                  fontFamily: S.barlow,
                }}
                labelStyle={{ color: S.textPrimary, fontFamily: S.barlow }}
              />
              <Line type="monotone" dataKey="value" stroke="#C9A24A" strokeWidth={3} dot={{ fill: "#C9A24A", strokeWidth: 2, r: 5 }} activeDot={{ r: 7, stroke: "#C9A24A", strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="LECTURA ACTUAL" className="lg:h-[420px] flex flex-col justify-between">
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#22c55e]" style={{ fontFamily: S.barlow }}>
                Fortalezas
              </p>
              <div className="mt-3 space-y-3">
                {FORTALEZAS.map((f) => (
                  <MetricRow key={f.label} label={f.label} value={f.value} note={f.note} good />
                ))}
              </div>
            </div>
            <div className="border-t border-white/[0.05] pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ef4444]" style={{ fontFamily: S.barlow }}>
                Para mejorar
              </p>
              <div className="mt-3 space-y-3">
                {PARA_MEJORAR.map((p) => (
                  <MetricRow key={p.label} label={p.label} value={p.value} note={p.note} good={false} />
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* ─── Seguimiento + Certificación ─── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="SEGUIMIENTO">
          <div className="space-y-4">
            <blockquote className="text-[14px] font-medium italic text-[#F2F0E9]" style={{ fontFamily: S.barlow }}>
              "Trabaja recepción orientada con pierna izquierda."
            </blockquote>
            <p className="text-[12px] font-medium text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
              Seguimiento técnico · última sesión · 12 ago 2026
            </p>
            <div className="mt-4 border-t border-white/[0.05] pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#686862]" style={{ fontFamily: S.barlow }}>
                Técnica
              </p>
            </div>
          </div>
        </Panel>

        <Panel title="CERTIFICACIÓN">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
              Tu recorrido
            </p>
            <div className="flex items-baseline gap-2">
              <span style={{ fontFamily: S.barlow, fontWeight: 800, fontSize: "clamp(36px, 4vw, 48px)", color: S.textPrimary }}>
                130
              </span>
              <span className="text-[13px] font-medium text-[#C9A24A]" style={{ fontFamily: S.barlow }}>
                h validadas
              </span>
            </div>
            <div className="flex items-center gap-2 text-[12px] font-medium text-[#686862]" style={{ fontFamily: S.barlow }}>
              <span>24% de 540 h</span>
              <span className="text-[#C9A24A]">·</span>
              <span>410 h por completar</span>
            </div>
            <p className="text-[11px] font-medium text-[#686862]" style={{ fontFamily: S.barlow }}>
              Última validación · 4 h
            </p>
          </div>
        </Panel>
      </div>

      {/* ─── NeuroCracks + Registro reciente ─── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="NEUROCRACKS">
          <div className="space-y-3">
            <p className="text-[13px] font-bold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
              Bilingüismo Sport
            </p>
            <div className="flex items-center justify-between border-b border-white/[0.05] py-2">
              <span className="text-[13px] font-medium" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                objetivos aprendidos
              </span>
              <span className="text-[20px] font-extrabold text-[#C9A24A]" style={{ fontFamily: S.barlow }}>
                0
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[13px] font-medium" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                para reforzar
              </span>
              <span className="text-[20px] font-extrabold text-[#ef4444]" style={{ fontFamily: S.barlow }}>
                0
              </span>
            </div>
          </div>
        </Panel>

        <Panel title="REGISTRO RECIENTE">
          <div className="space-y-3">
            {EVALUACIONES_RECIENTES.map((e, i) => (
              <div key={i} className="border-b border-white/[0.05] py-3 last:border-0">
                <p className="text-[13px] font-bold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                  {e.title}
                </p>
                <p className="text-[11px] font-medium text-[#686862]" style={{ fontFamily: S.barlow }}>
                  {e.subtitle}
                </p>
                <p className="text-[10px] font-medium text-[#C9A24A]" style={{ fontFamily: S.barlow }}>
                  {e.date}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
