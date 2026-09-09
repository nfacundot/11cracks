export type AdminNominationStatus = "pendiente" | "revisada" | "aprobada" | "rechazada";

export interface AdminClub {
  id: string;
  name: string;
  location: string;
  status: "active" | "paused";
  players: number;
  coaches: number;
  logoSrc: string;
  logoAlt: string;
  accent: string;
  responsibleUserIds: string[];
}

export interface AdminUser {
  id: string;
  personId: string;
  name: string;
  role: "player" | "coach";
  clubId: string;
  club: string;
  status: "active" | "pending";
  accessStatus: "no-account" | "pending-activation" | "active";
  teamId?: string;
}

export interface AdminContent {
  id: string;
  title: string;
  area: string;
  module: string;
  kind: string;
  status: "published" | "draft";
  protected: boolean;
}

export interface AdminCertification {
  id: string;
  player: string;
  club: string;
  registered: number;
  pending: number;
  validated: number;
  target: number;
  source: string;
  status: "En curso" | "Lista para certificar";
}

export interface AdminNomination {
  id: string;
  player: string;
  coach: string;
  club: string;
  dateLabel: string;
  context: string;
  status: AdminNominationStatus;
  submittedBy: string;
}

export interface AdminAnalytics {
  attendance: string;
  evaluations: string;
  certification: string;
  neurocracks: string;
}

export interface AdminDemoState {
  clubs: AdminClub[];
  users: AdminUser[];
  content: AdminContent[];
  certifications: AdminCertification[];
  nominations: AdminNomination[];
  analytics: AdminAnalytics;
}

export interface AdminDemoIdentity {
  id: string;
  name: string;
  roleLabel: string;
  scopeLabel: string;
  organizationId: string;
  organizationName: string;
  clubId: string;
  clubName: string;
}

export const orgId = "org-demo-rionegro";
export const orgName = "Organización demo 11 Cracks";

export const adminIdentity: AdminDemoIdentity = {
  id: "admin-demo",
  name: "Víctor Córdoba",
  roleLabel: "Administrador",
  scopeLabel: "Forjadores Pro · Rionegro",
  organizationId: orgId,
  organizationName: orgName,
  clubId: "club-demo-forjadores",
  clubName: "Forjadores Pro",
};

export const certificationTargetHours = 520;

export function adminDemoState(): AdminDemoState {
  return {
    clubs: [
      {
        id: "club-demo-forjadores",
        name: "Forjadores Pro",
        location: "Rionegro · Colombia",
        status: "active",
        players: 1,
        coaches: 1,
        logoSrc: "/brand/11-cracks.svg",
        logoAlt: "Forjadores Pro",
        accent: "forjadores",
        responsibleUserIds: ["coach-demo"],
      },
    ],
    users: [
      {
        id: "player-club-demo",
        personId: "person-carlos-forjadores",
        name: "Carlos Herrera",
        role: "player",
        clubId: "club-demo-forjadores",
        club: "Forjadores Pro",
        status: "active",
        accessStatus: "active",
        teamId: "team-demo-forjadores",
      },
      {
        id: "coach-demo",
        personId: "person-mateo-forjadores",
        name: "Mateo Ríos",
        role: "coach",
        clubId: "club-demo-forjadores",
        club: "Forjadores Pro",
        status: "active",
        accessStatus: "active",
        teamId: "team-demo-forjadores",
      },
    ],
    content: [
      { id: "bilinguismo", title: "Bilingüismo Sport", area: "NeuroCracks", module: "Bilingüismo", kind: "Experiencia", status: "published", protected: true },
      { id: "recepcion", title: "Recepción orientada", area: "Entrenamiento", module: "Player", kind: "Video · 4 min", status: "published", protected: false },
      { id: "bienestar", title: "Rutina de foco pre-partido", area: "Bienestar emocional", module: "Player", kind: "Material", status: "draft", protected: false },
    ],
    certifications: [
      {
        id: "carlos-hours",
        player: "Carlos Herrera",
        club: "Forjadores Pro",
        registered: 130,
        pending: 2,
        validated: 128,
        target: certificationTargetHours,
        source: "Entrenamiento · Coach",
        status: "En curso",
      },
    ],
    nominations: [
      {
        id: "nom-1",
        player: "Carlos Herrera",
        coach: "Mateo Ríos",
        club: "Forjadores Pro",
        dateLabel: "18 ago 2026",
        context: "Propuesta de seguimiento · Forjadores Pro",
        status: "pendiente",
        submittedBy: "Mateo Ríos",
      },
    ],
    analytics: {
      attendance: "92% promedio del equipo",
      evaluations: "12 evaluaciones registradas",
      certification: "128 h validadas · 2 h pendientes",
      neurocracks: "Bilingüismo Sport · actividad registrada",
    },
  };
}
