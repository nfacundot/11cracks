import { requireSection } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClubRankingPanel } from "@/components/admin-demo/club-ranking-panel";
import { CertificateWorkspace } from "@/components/admin-demo/certificate-workspace";
import { getCertificateOperationsView } from "@/lib/certificates/read-model";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

interface ClubScore {
  general: number;
  constancia: number;
  formacion: number;
  desarrollo: number;
  planeta: number;
  impacto: number;
}

interface ClubWithScore {
  id: string;
  name: string;
  code: string;
  logoUrl: string | null;
  members: number;
  activeMembers: number;
  score: ClubScore;
  hasData: boolean;
}

async function fetchClubRankingData() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [clubs, lessonTotal, completedByUserRaw] = await Promise.all([
    prisma.team.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        logoUrl: true,
        members: {
          select: {
            role: true,
            user: { select: { id: true, xp: true, currentStreak: true, lastActiveAt: true } },
          },
        },
      },
    }),
    prisma.lesson.count({ where: { type: "LESSON" } }),
    prisma.lessonProgress.groupBy({
      by: ["userId"],
      where: { completed: true },
      _count: { _all: true },
    }),
  ]);

  const completedByUser = new Map<string, number>();
  for (const row of completedByUserRaw) completedByUser.set(row.userId, row._count._all);

  const avgXpByClub = clubs.map((club) => {
    const playerIds = club.members.map((m) => m.user.id);
    const totalXp = club.members.reduce((sum, m) => sum + m.user.xp, 0);
    const count = playerIds.length;
    return count === 0 ? 0 : totalXp / count;
  });
  const avgXpMax = Math.max(1, ...avgXpByClub);

  const clubRows: ClubWithScore[] = clubs.map((club, clubIndex) => {
    const users = club.members.map((m) => m.user);
    const playerIds = users.map((u) => u.id);
    const count = playerIds.length;
    const playersWithLessons = playerIds.filter((id) => (completedByUser.get(id) ?? 0) > 0).length;

    const avgStreak = count === 0 ? 0 : users.reduce((sum, u) => sum + u.currentStreak, 0) / count;
    const constancia = clamp((avgStreak / 7) * 100);
    let clubCompleted = 0;
    for (const id of playerIds) clubCompleted += completedByUser.get(id) ?? 0;
    const formacion = lessonTotal > 0 ? clamp((clubCompleted / lessonTotal) * 100) : 0;
    const desarrollo = clamp((avgXpByClub[clubIndex] / avgXpMax) * 100);
    const activeMembers = users.filter((u) => u.lastActiveAt && u.lastActiveAt >= thirtyDaysAgo).length;
    const planeta = count === 0 ? 0 : clamp((activeMembers / count) * 100);
    const withStreak = users.filter((u) => u.currentStreak > 0).length;
    const impacto = count === 0 ? 0 : clamp((withStreak / count) * 100);
    const general = clamp((constancia + formacion + desarrollo + planeta + impacto) / 5);

    return {
      id: club.id,
      name: club.name,
      code: club.code,
      logoUrl: club.logoUrl,
      members: count,
      activeMembers,
      score: { general, constancia, formacion, desarrollo, planeta, impacto },
      hasData: playersWithLessons > 0 || activeMembers > 0 || avgStreak > 0,
    };
  });

  const withScore = clubRows.filter((club) => club.hasData).length;
  const ranked = [...clubRows].sort((a, b) => b.score.general - a.score.general);
  const rankByClub = new Map<string, { general: number; constancia: number; formacion: number }>();
  const rankScores: Record<string, keyof ClubScore> = {
    general: "general",
    constancia: "constancia",
    formacion: "formacion",
  };
  for (const [dim, key] of Object.entries(rankScores)) {
    [...clubRows]
      .sort((a, b) => b.score[key] - a.score[key])
      .forEach((club, index) => {
        const entry = rankByClub.get(club.id) ?? { general: 0, constancia: 0, formacion: 0 };
        entry[dim as keyof typeof entry] = index + 1;
        rankByClub.set(club.id, entry);
      });
  }

  return { clubRows, ranked, rankByClub, withScore, clubCount: clubs.length, lessonTotal };
}

export const metadata = { title: "Reportes | Admin" };

export default async function ReportsPage() {
  await requireSection("ADMIN");

  const [clubData, certView] = await Promise.all([
    fetchClubRankingData(),
    getCertificateOperationsView(),
  ]);

  const { clubRows, ranked, rankByClub, withScore, clubCount, lessonTotal } = clubData;

  return (
    <article className="admin-page">
      <header className="admin-page__header">
        <span>ADMIN · LECTURA OPERATIVA</span>
        <h1>Reportes</h1>
        <p>Paneles con datos reales de tu organización.</p>
      </header>

      <section className="admin-panel" data-tone="gold">
        <h2>Progresión institucional</h2>
        <div className="admin-kpis">
          <div><strong>{clubCount}</strong><span>clubes en alcance</span></div>
          <div><strong>{withScore}</strong><span>con score disponible</span></div>
          <div><strong>{lessonTotal}</strong><span>lecciones en catálogo</span></div>
        </div>
        <p className="admin-note">Score general = media de Constancia, Formación, Desarrollo, Planeta, Impacto.</p>
      </section>

      <ClubRankingPanel
        clubs={clubRows}
        ranked={ranked}
        rankByClub={rankByClub}
        withScore={withScore}
        clubCount={clubCount}
        lessonTotal={lessonTotal}
      />

      <section className="admin-panel" data-tone="cyan">
        <h2>Certificaciones y horas</h2>
        <div className="admin-kpis">
          <div><strong>{certView.certificates.length}</strong><span>jugadores en alcance</span></div>
          <div><strong>{certView.certificates.filter((c) => c.status === "ELIGIBLE").length}</strong><span>elegibles para revisión</span></div>
          <div><strong>{certView.certificates.filter((c) => c.status === "ISSUED").length}</strong><span>certificados emitidos</span></div>
          <div><strong>{certView.certificates.filter((c) => c.status === "REJECTED").length}</strong><span>rechazados</span></div>
        </div>
        <p className="admin-note">Umbral canónico: {certView.targetHours} h validadas habilita revisión; no emite automáticamente.</p>
      </section>

      <CertificateWorkspace view={certView} />

      <section className="admin-panel">
        <h2>Paneles pendientes (requieren port desde edtech11)</h2>
        <ul className="admin-alerts">
          <li>Billetera Solidaria · movimientos, beneficios, Class Economy, Club Support</li>
          <li>Impacto · métricas de adopción, retención, salud de clubes</li>
          <li>Facturación · facturas, pagos, conciliación, términos versionados</li>
        </ul>
        <p className="admin-note">Estos paneles necesitan read-models, componentes y CSS portados desde edtech11.</p>
      </section>
    </article>
  );
}