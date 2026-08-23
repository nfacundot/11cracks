const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "Superadministrador",
  ADMIN: "Administrador",
  ENTRENADOR: "Entrenador",
  JUGADOR: "Jugador",
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}
