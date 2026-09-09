"use client";

import { useMemo, useState } from "react";

const labels = { player: "Jugador", coach: "Entrenador" } as const;
const PAGE_SIZE = 12;

export interface OrganizationUserRecord {
  personId: string;
  displayName: string;
  roles: ("player" | "coach")[];
  accounts: { email: string }[];
  accessStatus: "active" | "pending-activation" | "suspended" | "no-account";
  clubId?: string;
  teamId?: string;
  hasPlayerProfile: boolean;
}

export interface OrganizationClubRecord {
  clubId: string;
  name: string;
}

export interface OrganizationTeamRecord {
  teamId: string;
  name: string;
}

export function OrganizationUsersExperience({
  users,
  clubs,
  teams,
}: {
  users: readonly OrganizationUserRecord[];
  clubs: readonly OrganizationClubRecord[];
  teams: readonly OrganizationTeamRecord[];
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    const matches = users.filter((user) => !q || [user.displayName, ...user.accounts.map((account) => account.email), ...user.roles.map((role) => labels[role] ?? role), user.clubId ?? "", user.teamId ?? "", user.accessStatus].some((value) => value.toLocaleLowerCase().includes(q)));
    return q ? [...matches].sort((left, right) => {
      const leftExact = String(left.displayName.toLocaleLowerCase() === q) === "true" || left.accounts.some((account) => String(account.email.toLocaleLowerCase() === q) === "true") ? 1 : 0;
      const rightExact = String(right.displayName.toLocaleLowerCase() === q) === "true" || right.accounts.some((account) => String(account.email.toLocaleLowerCase() === q) === "true") ? 1 : 0;
      return Number(rightExact) - Number(leftExact) || left.displayName.localeCompare(right.displayName);
    }) : matches;
  }, [query, users]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleUsers = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const setSearch = (value: string) => { setQuery(value); setPage(1); };

  const currentClub = (user: OrganizationUserRecord) => user.clubId ?? clubs[0]?.clubId ?? "";
  const currentTeam = (user: OrganizationUserRecord) => user.teamId ?? teams[0]?.teamId ?? "";

  return (
    <article className="admin-page">
      <header className="admin-page__header">
        <span>ADMIN · GOBIERNO ORGANIZACIONAL</span>
        <h1>Usuarios y membresías</h1>
        <p>Busca una persona, completa su perfil operativo y conserva el alcance de la organización.</p>
      </header>

      <section className="admin-panel" data-tone="cyan">
        <h2>Agregar o actualizar usuario</h2>
        <form className="admin-edit-form" onSubmit={(event) => event.preventDefault()}>
          <label>Persona existente (opcional)<input name="personId" placeholder="ID estable, si ya existe" /></label>
          <label>Nombre completo<input name="displayName" required /></label>
          <label>Correo de acceso<input name="email" type="email" required /></label>
          <label>Rol<select name="role" defaultValue="player"><option value="player">Jugador</option><option value="coach">Entrenador</option></select></label>
          <label>Nombre corto del jugador<input name="shortName" placeholder="Se muestra en roster" /></label>
          <label>Número<input name="number" type="number" min="0" max="99" defaultValue="0" /></label>
          <label>Posición<input name="position" placeholder="Mediocentro" /></label>
          <label>Categoría<input name="category" placeholder="Sub-17" /></label>
          <label>Club<select name="clubId" required>{clubs.map((club) => <option key={club.clubId} value={club.clubId}>{club.name}</option>)}</select></label>
          <label>Equipo<select name="teamId" required>{teams.map((team) => <option key={team.teamId} value={team.teamId}>{team.name}</option>)}</select></label>
          <label>Acceso inicial<select name="status" defaultValue="pending"><option value="pending">Invitación pendiente</option><option value="active">Activo</option></select></label>
          <button type="submit">Guardar identidad, perfil y membresía</button>
        </form>
        <p className="admin-note">Para Jugador son obligatorios el perfil deportivo, el club, el equipo y el acceso. El rol Admin se asigna únicamente desde Gobierno global.</p>
      </section>

      <section className="admin-panel">
        <div className="admin-section-heading"><h2>Personas en alcance</h2><span>{filtered.length} de {users.length}</span></div>
        <div className="admin-toolbar">
          <label className="admin-search"><span>Buscar por nombre, correo, club, equipo o estado</span><input type="search" value={query} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre o correo" /></label>
        </div>
        {selectedPersonId ? (() => {
          const selected = users.find((user) => user.personId === selectedPersonId);
          return selected ? (
            <aside className="admin-user-detail" aria-label={`Detalle de ${selected.displayName}`}>
              <strong>DETALLE INMEDIATO · {selected.displayName}</strong>
              <span>{selected.roles.map((role) => labels[role] ?? role).join(" · ") || "Sin rol"}</span>
              <span>{selected.accounts.map((account) => account.email).join(" · ") || "Sin cuenta"} · {selected.accessStatus}</span>
              <span>Club: {selected.clubId ?? "SIN DATOS"} · Equipo: {selected.teamId ?? "SIN DATOS"}</span>
              <button type="button" onClick={() => setSelectedPersonId(null)}>Cerrar detalle</button>
            </aside>
          ) : null;
        })() : null}
        <div className="admin-list">
          {visibleUsers.map((user) => {
            const currentRole = user.roles.includes("coach") ? "coach" : "player";
            return (
              <div className="admin-record" key={user.personId}>
                <div>
                  <button type="button" className="admin-user-detail-trigger" onClick={() => setSelectedPersonId(user.personId)}><strong>{user.displayName}</strong></button>
                  <small>{user.roles.map((role) => labels[role] ?? role).join(" · ") || "Sin rol"}</small>
                  <small>{user.accounts.map((account) => account.email).join(" · ") || "Sin cuenta"}</small>
                  <small>Acceso: {user.accessStatus === "active" ? "Activo" : user.accessStatus === "pending-activation" ? "Invitación pendiente" : user.accessStatus === "suspended" ? "Suspendido" : "Sin cuenta"}</small>
                  {user.roles.includes("player") && !user.hasPlayerProfile ? <small data-profile-status="incomplete">Perfil deportivo incompleto → completar número, posición y categoría</small> : null}
                </div>
                <form className="admin-inline-form" onSubmit={(event) => event.preventDefault()}>
                  <select aria-label={`Rol de ${user.displayName}`} name="role" defaultValue={currentRole}><option value="player">Jugador</option><option value="coach">Entrenador</option></select>
                  <select aria-label={`Club de ${user.displayName}`} name="clubId" defaultValue={currentClub(user)}>{clubs.map((club) => <option key={club.clubId} value={club.clubId}>{club.name}</option>)}</select>
                  <select aria-label={`Equipo de ${user.displayName}`} name="teamId" defaultValue={currentTeam(user)}>{teams.map((team) => <option key={team.teamId} value={team.teamId}>{team.name}</option>)}</select>
                  <select aria-label={`Acceso de ${user.displayName}`} name="status" defaultValue={user.accessStatus === "suspended" ? "suspended" : user.accessStatus === "active" ? "active" : "pending"}><option value="active">Activar</option><option value="pending">Invitación pendiente</option><option value="suspended">Suspender</option></select>
                  <button type="submit">Guardar cambio auditado</button>
                </form>
              </div>
            );
          })}
          {visibleUsers.length === 0 ? <p className="admin-note">No hay personas que coincidan con la búsqueda.</p> : null}
        </div>
        {totalPages > 1 ? (
          <nav className="admin-pagination" aria-label="Paginación de personas">
            <span>Página {safePage} de {totalPages} · {filtered.length} personas</span>
            <div>
              <button type="button" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>← Anterior</button>
              <button type="button" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>Siguiente →</button>
            </div>
          </nav>
        ) : null}
      </section>
    </article>
  );
}