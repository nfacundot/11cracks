export type ShellRole = "player" | "coach" | "admin" | "superadmin";

export type NavigationIcon =
  | "home"
  | "progress"
  | "training"
  | "learning"
  | "lineup"
  | "achievements"
  | "wallet"
  | "profile"
  | "settings"
  | "players"
  | "evaluations"
  | "attendance"
  | "reports"
  | "payments"
  | "impact"
  | "messages"
  | "clubs"
  | "users"
  | "content"
  | "audit"
  | "organizations"
  | "permissions"
  | "catalogs"
  | "integrations"
  | "system";

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: NavigationIcon;
}

export interface NavigationGroup {
  id: string;
  label: string;
  items: NavigationItem[];
}

export const navigationByRole: Record<ShellRole, NavigationGroup[]> = {
  player: [
    {
      id: "player-main",
      label: "Tu recorrido",
      items: [
        { id: "dashboard", label: "Inicio", href: "/jugador", icon: "home" },
        { id: "progress", label: "Mi progreso", href: "/jugador/progress", icon: "progress" },
        { id: "training", label: "Entrenamiento", href: "/jugador/training", icon: "training" },
        { id: "neurocracks", label: "NeuroCracks", href: "/jugador/neurocracks", icon: "learning" },
      ],
    },
    {
      id: "player-team",
      label: "Tu mundo",
      items: [
        { id: "lineup", label: "Alineación", href: "/jugador/alineacion", icon: "lineup" },
        { id: "achievements", label: "Logros", href: "/jugador/logros", icon: "achievements" },
        { id: "games", label: "Juegos", href: "/jugador/games", icon: "achievements" },
        { id: "ranking", label: "Ranking", href: "/jugador/ranking", icon: "impact" },
        { id: "wallet", label: "Billetera Solidaria", href: "/jugador/billetera-solidaria", icon: "wallet" },
      ],
    },
    {
      id: "player-account",
      label: "Cuenta",
      items: [
        { id: "profile", label: "Mi perfil", href: "/jugador/profile", icon: "profile" },
        { id: "settings", label: "Configuración", href: "/jugador/configuracion", icon: "settings" },
      ],
    },
  ],
  coach: [
    {
      id: "coach-daily",
      label: "Trabajo diario",
      items: [
        { id: "dashboard", label: "Inicio", href: "/coach", icon: "home" },
        { id: "players", label: "Equipo", href: "/coach/equipo", icon: "players" },
        { id: "evaluations", label: "Evaluaciones", href: "/coach/evaluaciones", icon: "evaluations" },
        { id: "attendance", label: "Asistencia", href: "/coach/asistencia", icon: "attendance" },
        { id: "lineup", label: "Cancha", href: "/coach/cancha", icon: "lineup" },
        { id: "campus", label: "Campus", href: "/coach/campus", icon: "learning" },
      ],
    },
    {
      id: "coach-operations",
      label: "Operación",
      items: [
        { id: "reports", label: "Reportes", href: "/coach/reportes", icon: "reports" },
        { id: "wallet", label: "Billetera", href: "/coach/billetera", icon: "wallet" },
        { id: "impact", label: "Impacto", href: "/coach/impacto", icon: "impact" },
        { id: "messages", label: "Mensajes", href: "/coach/mensajes", icon: "messages" },
      ],
    },
    {
      id: "coach-account",
      label: "Cuenta",
      items: [
        { id: "profile", label: "Perfil", href: "/coach/perfil", icon: "profile" },
        { id: "settings", label: "Configuración", href: "/coach/configuracion", icon: "settings" },
      ],
    },
  ],
  admin: [
    {
      id: "admin-core",
      label: "Organización",
      items: [
        { id: "dashboard", label: "Inicio", href: "/admin", icon: "home" },
        { id: "users", label: "Usuarios", href: "/admin/users", icon: "users" },
        { id: "teams", label: "Equipos", href: "/admin/teams", icon: "clubs" },
        { id: "catalogos", label: "Catálogos", href: "/admin/catalogos", icon: "catalogs" },
        { id: "reportes", label: "Reportes", href: "/admin/reportes", icon: "reports" },
        { id: "contenido", label: "Contenido", href: "/admin/contenido", icon: "content" },
      ],
    },
    {
      id: "admin-content",
      label: "Contenido educativo",
      items: [
        { id: "indicators", label: "Indicadores", href: "/admin/indicators", icon: "impact" },
        { id: "caracteristicas", label: "Características", href: "/admin/caracteristicas", icon: "reports" },
        { id: "etapas", label: "Etapas", href: "/admin/etapas", icon: "catalogs" },
        { id: "asignaturas", label: "Asignaturas", href: "/admin/asignaturas", icon: "content" },
        { id: "caminos", label: "Caminos", href: "/admin/caminos", icon: "learning" },
        { id: "lessons", label: "Lecciones", href: "/admin/lessons", icon: "content" },
        { id: "juegos", label: "Juegos", href: "/admin/juegos", icon: "achievements" },
      ],
    },
    {
      id: "admin-account",
      label: "Cuenta",
      items: [
        { id: "profile", label: "Perfil", href: "/admin/perfil", icon: "profile" },
        { id: "settings", label: "Configuración", href: "/admin/configuracion", icon: "settings" },
      ],
    },
  ],
  superadmin: [
    {
      id: "super-governance",
      label: "Gobierno global",
      items: [
        { id: "dashboard", label: "Vista global", href: "/superadmin", icon: "home" },
        { id: "users", label: "Usuarios", href: "/superadmin/users", icon: "users" },
        { id: "teams", label: "Equipos", href: "/superadmin/teams", icon: "clubs" },
        { id: "organizaciones", label: "Organizaciones", href: "/superadmin/organizaciones", icon: "organizations" },
        { id: "catalogos", label: "Catálogos", href: "/superadmin/catalogos", icon: "catalogs" },
      ],
    },
    {
      id: "super-content",
      label: "Contenido",
      items: [
        { id: "indicators", label: "Indicadores", href: "/superadmin/indicators", icon: "impact" },
        { id: "caracteristicas", label: "Características", href: "/superadmin/caracteristicas", icon: "reports" },
        { id: "etapas", label: "Etapas", href: "/superadmin/etapas", icon: "catalogs" },
        { id: "asignaturas", label: "Asignaturas", href: "/superadmin/asignaturas", icon: "content" },
        { id: "caminos", label: "Caminos", href: "/superadmin/caminos", icon: "learning" },
        { id: "lessons", label: "Lecciones", href: "/superadmin/lessons", icon: "content" },
        { id: "juegos", label: "Juegos", href: "/superadmin/juegos", icon: "achievements" },
        { id: "contenido", label: "Contenido", href: "/superadmin/contenido", icon: "content" },
      ],
    },
    {
      id: "super-account",
      label: "Cuenta",
      items: [
        { id: "profile", label: "Perfil", href: "/superadmin/perfil", icon: "profile" },
      ],
    },
  ],
};

export function getNavigationForRole(role: ShellRole): NavigationGroup[] {
  return navigationByRole[role];
}
