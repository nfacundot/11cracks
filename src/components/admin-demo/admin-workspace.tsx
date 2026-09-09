import Image from "next/image";
import Link from "next/link";
import { adminDemoState, certificationTargetHours, type AdminDemoIdentity } from "@/lib/admin-demo/state";
import { ClubEditForm } from "@/components/admin-demo/club-edit-form";

export interface AdminWorkspaceClub {
  id: string;
  name: string;
  code: string;
  description: string;
  players: number;
  coaches: number;
  logoUrl: string | null;
  logoAlt?: string;
  accent?: string;
  status: "active" | "paused";
  responsibleNames?: string[];
}

const copyBySection: Record<string, string> = {
  dashboard: "Estado operativo dentro del alcance autorizado.",
  clubs: "Gestiona los clubes dentro de tu alcance.",
  users: "Administra jugadores y entrenadores autorizados.",
  content: "Gestiona el contenido operativo sin intervenir el motor de Bilingüismo Sport.",
  certifications: "Revisa horas y avance hacia la certificación.",
  nominations: "Revisa decisiones propuestas por los entrenadores.",
  reports: "Consulta señales útiles de tu organización.",
  profile: "Consulta tu identidad y alcance administrativo.",
  settings: "Administra tus preferencias de cuenta.",
};

function statusLabel(status: string): string {
  return ({ active: "Activo", paused: "Pausado", pending: "Pendiente", published: "Publicado", draft: "Borrador", pendiente: "Pendiente", revisada: "Revisada", aprobada: "Aprobada", rechazada: "Rechazada" } as Record<string, string>)[status] ?? status;
}

export async function AdminWorkspace({ identity, section, clubs }: { identity: AdminDemoIdentity; section: string; clubs?: AdminWorkspaceClub[] }) {
  const state = adminDemoState();
  const visibleClubs = clubs ?? state.clubs.map((club) => ({
    id: club.id,
    name: club.name,
    code: club.id.replace("club-demo-", "").toUpperCase(),
    description: club.location,
    players: club.players,
    coaches: club.coaches,
    logoUrl: club.logoSrc,
    logoAlt: club.logoAlt,
    accent: club.accent,
    status: club.status,
    responsibleNames: state.users.filter((user) => club.responsibleUserIds.includes(user.id)).map((user) => user.name),
  }));
  const clubProgression = {
    score: 87,
    status: "AVAILABLE",
    policyVersion: "3",
    rankingPosition: 1,
    dimensions: { CONSTANCIA: 84, FORMACION: 72, DESARROLLO_DEPORTIVO: 90, PLANETA: 68, IMPACTO_SOCIAL: 81 },
    cards: ["Racha de constancia · Semilla", "Formación en idiomas · Reto", "Planeta en juego · Meta"],
  };

  if (section === "clubs") {
    return <article className="admin-page"><header className="admin-page__header"><span>ADMIN · ORGANIZACIÓN</span><h1>Clubes</h1><p>{copyBySection.clubs}</p></header><section className="progression-summary" aria-label="Resumen de progresión">
    <div className="progression-summary__heading"><div><span className="progression-summary__eyebrow">CLUB · PROGRESIÓN</span><h2>Resumen de progresión</h2><p>{identity.clubName} · período ESTE MES</p></div><strong className="progression-summary__score">{clubProgression.score} / 100</strong></div>
    <div className="progression-summary__meta"><span data-status={clubProgression.status}>ACTIVO</span><span>Política v{clubProgression.policyVersion}</span><span>Ranking global #{clubProgression.rankingPosition}</span></div>
    <div className="progression-summary__dimensions">{Object.entries(clubProgression.dimensions).map(([name, value]) => <div key={name}><span>{name.replaceAll("_", " ")}</span><b>{value}%</b></div>)}</div>
    <div className="progression-summary__cards"><div><span>Cartas destacadas</span>{clubProgression.cards.map((card) => <b key={card}>{card}</b>)}</div><div><span>Elegibilidad</span><b>ACTIVA</b><small>La elegibilidad no asigna ni entrega beneficios.</small></div></div>
  </section><section className="admin-panel"><h2>Clubes en alcance</h2><div className="admin-list">{visibleClubs.map((club) => (
      <div className="admin-record" key={club.id}>
        <div className="admin-record__main">
          {club.logoUrl ? <Image className="admin-club__logo" src={club.logoUrl} alt={club.logoAlt ?? club.name} width={48} height={48} /> : <span className="admin-club__logo admin-club__logo--fallback">{club.name.charAt(0)}</span>}
          <span><strong>{club.name}</strong><small>{club.description} · {club.players} jugadores · {club.coaches} entrenadores</small><small>Responsables: {club.responsibleNames?.length ? club.responsibleNames.join(", ") : "Sin responsables"}</small></span>
        </div>
        <b data-status={club.status}>{statusLabel(club.status)}</b>
        <ClubEditForm club={club} />
      </div>))}</div>{visibleClubs.length === 0 ? <p className="admin-note">Aún no hay clubes registrados en este alcance.</p> : null}</section></article>;
  }

  if (section === "users") {
    return <article className="admin-page"><header className="admin-page__header"><span>ADMIN · ACCESOS</span><h1>Usuarios</h1><p>{copyBySection.users}</p></header><section className="admin-panel"><h2>Usuarios dentro del alcance</h2><div className="admin-list">{state.users.map((user) => (
      <div className="admin-record" key={user.id}>
        <div><strong>{user.name}</strong><small>{user.role === "player" ? "Jugador" : "Entrenador"} · {user.club}</small></div>
        <b data-status={user.status}>{statusLabel(user.status)}</b>
        <details className="admin-detail"><summary>Gestionar</summary>
          <div className="admin-edit-form">
            <label>Rol<select defaultValue={user.role}><option value="player">Jugador</option><option value="coach">Entrenador</option></select></label>
            <label>Club<select defaultValue={user.clubId}>{state.clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}</select></label>
            <label>Estado<select defaultValue={user.status}><option value="active">Activo</option><option value="pending">Pendiente</option></select></label>
          </div>
        </details>
      </div>))}</div><p className="admin-note">Los administradores no pueden asignar Super Admin ni operar fuera de su organización.</p></section></article>;
  }

  if (section === "content") {
    return <article className="admin-page"><header className="admin-page__header"><span>ADMIN · NEUROCRACKS</span><h1>Contenido</h1><p>{copyBySection.content}</p></header><section className="admin-panel"><h2>Biblioteca de contenido</h2><div className="admin-list">{state.content.map((item) => (
      <div className="admin-record" key={item.id}>
        <div><strong>{item.title}</strong><small>{item.module} · {item.area} · {item.kind}</small></div>
        <b data-status={item.status}>{statusLabel(item.status)}</b>
        {item.protected ? <span className="admin-protected">Protegido</span> : <details className="admin-detail"><summary>Editar</summary><div className="admin-edit-form"><label>Título<input value={item.title} readOnly /></label><label>Área<input value={item.area} readOnly /></label><label>Tipo<input value={item.kind} readOnly /></label><label>Estado<select defaultValue={item.status}><option value="published">Publicado</option><option value="draft">Borrador</option></select></label></div></details>}
      </div>))}</div></section></article>;
  }

  if (section === "certifications") {
    return <article className="admin-page"><header className="admin-page__header"><span>ADMIN · TRAZABILIDAD</span><h1>Certificaciones y horas</h1><p>{copyBySection.certifications}</p></header><section className="admin-panel" data-tone="gold"><h2>Horas bajo revisión</h2><div className="admin-list">{state.certifications.map((item) => (
      <div className="admin-record admin-record--cert" key={item.id}>
        <div><strong>{item.player}</strong><small>{item.club} · Fuente: {item.source}</small><b data-status={item.status}>{item.status}</b></div>
        <div className="admin-cert-summary"><span><strong>{item.registered} h</strong><small>Registradas</small></span><span><strong>{item.pending} h</strong><small>Pendientes</small></span><span><strong>{item.validated} h</strong><small>Validadas</small></span><span><strong>{item.target} h</strong><small>Objetivo</small></span></div>
        <progress className="admin-progress" value={item.validated} max={item.target} aria-label={`Progreso de certificación de ${item.player}`} />
        {item.pending > 0 ? <span className="admin-note">Hay {item.pending} h pendientes de validación.</span> : <span className="admin-note">Sin horas pendientes · lista para certificar</span>}
      </div>))}</div><p className="admin-target">Registradas = validadas + pendientes. Objetivo de certificación: <strong>{certificationTargetHours} h</strong></p></section></article>;
  }

  if (section === "nominations") {
    return <article className="admin-page"><header className="admin-page__header"><span>ADMIN · DECISIONES</span><h1>Postulaciones</h1><p>{copyBySection.nominations}</p></header><section className="admin-panel" data-tone="gold"><h2>Postulaciones recibidas</h2><div className="admin-list">{state.nominations.map((item) => (
      <div className="admin-record" key={item.id}>
        <div><strong>{item.player}</strong><small>{item.coach} · {item.club} · {item.dateLabel}</small><small>{item.context}</small></div>
        <b data-status={item.status}>{statusLabel(item.status)}</b>
      </div>))}</div><p className="admin-note">La decisión queda registrada en la postulación; no crea estados de jugador fuera del modelo actual.</p></section></article>;
  }

  if (section === "reports") {
    const playerCount = state.users.filter((item) => item.role === "player").length;
    const activeCount = state.users.filter((item) => item.status === "active").length;
    return <article className="admin-page"><header className="admin-page__header"><span>ADMIN · LECTURA OPERATIVA</span><h1>Reportes</h1><p>{copyBySection.reports}</p></header><div className="admin-report-grid"><section className="admin-panel"><h2>Alcance de la organización</h2><div className="admin-kpis"><div><strong>{state.clubs.length}</strong><span>clubes en alcance</span></div><div><strong>{state.users.length}</strong><span>usuarios registrados</span></div><div><strong>{activeCount}</strong><span>cuentas activas</span></div></div></section><section className="admin-panel"><h2>Señales operativas</h2><ul className="admin-alerts"><li>{state.analytics.attendance}</li><li>{state.analytics.evaluations}</li><li>{state.analytics.certification}</li><li>{state.analytics.neurocracks}</li></ul></section><section className="admin-panel" data-tone="cyan"><h2>Economía del programa</h2><div className="admin-kpis"><div><strong>{playerCount}</strong><span>jugadores en alcance</span></div><div><strong>{state.clubs[0].coaches}</strong><span>entrenadores en alcance</span></div><div><strong>{state.nominations.filter((item) => item.status === "pendiente").length}</strong><span>postulaciones pendientes</span></div></div><p className="admin-note">Class Economy y Club Support se operan en ventanas separadas con trazabilidad.</p></section></div></article>;
  }

  if (section === "profile" || section === "settings") {
    return <article className="admin-page"><header className="admin-page__header"><span>ADMIN · CUENTA</span><h1>{section === "profile" ? "Perfil" : "Configuración"}</h1><p>{copyBySection[section]}</p></header><section className="admin-panel"><h2>{identity.name}</h2><p className="admin-note">{identity.roleLabel} · {identity.scopeLabel}</p><div className="admin-actions"><Link href="/admin-demo">Volver al dashboard →</Link></div></section></article>;
  }

  const pendingHours = state.certifications.reduce((sum, item) => sum + item.pending, 0);
  const draftContent = state.content.filter((item) => item.status === "draft").length;
  const pendingNominations = state.nominations.filter((item) => item.status === "pendiente").length;
  return <article className="admin-page"><header className="admin-page__header"><span>{`ADMIN · ${identity.scopeLabel}`}</span><h1>Dashboard</h1><p>{copyBySection.dashboard}</p></header><div className="admin-dashboard"><section className="progression-summary" aria-label="Progresión del club">
    <div className="progression-summary__heading"><div><span className="progression-summary__eyebrow">CLUB · PROGRESIÓN</span><h2>Progresión del club</h2><p>{identity.clubName} · período ESTE MES</p></div><strong className="progression-summary__score">{clubProgression.score} / 100</strong></div>
    <div className="progression-summary__meta"><span data-status={clubProgression.status}>ACTIVO</span><span>Política v{clubProgression.policyVersion}</span><span>Ranking global #{clubProgression.rankingPosition}</span></div>
    <div className="progression-summary__dimensions">{Object.entries(clubProgression.dimensions).map(([name, value]) => <div key={name}><span>{name.replaceAll("_", " ")}</span><b>{value}%</b></div>)}</div>
    <div className="progression-summary__cards"><div><span>Cartas destacadas</span>{clubProgression.cards.map((card) => <b key={card}>{card}</b>)}</div><div><span>Elegibilidad</span><b>ACTIVA</b><small>La elegibilidad no asigna ni entrega beneficios.</small></div></div>
  </section><section className="admin-panel" data-tone="cyan"><h2>Resumen operativo</h2><div className="admin-kpis"><div><strong>{state.clubs.length}</strong><span>clubes en alcance</span></div><div><strong>{state.users.filter((item) => item.role === "player").length}</strong><span>jugadores en alcance</span></div><div><strong>{state.users.filter((item) => item.role === "coach").length}</strong><span>entrenadores en alcance</span></div></div></section><section className="admin-panel" data-tone="gold"><h2>Atención prioritaria</h2><ul className="admin-alerts"><li>{pendingHours} h pendientes de validación</li><li>{pendingNominations} postulación pendiente</li><li>{draftContent} contenido en borrador</li></ul></section><section className="admin-panel"><h2>Acciones rápidas</h2><div className="admin-actions"><Link href="/admin-demo/clubs">Gestionar clubes</Link><Link href="/admin-demo/certifications">Revisar horas</Link><Link href="/admin-demo/users">Administrar usuarios</Link><Link href="/admin-demo/reports">Abrir reportes</Link></div></section></div></article>;
}
