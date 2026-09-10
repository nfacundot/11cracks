export interface DemoWindowProps {
  section: string;
}

import Link from "next/link";

const labels: Record<string, { group: string; title: string; copy: string }> = {
  wallet: { group: "ADMIN · OPERACIÓN Y CONTROL", title: "Billetera Solidaria", copy: "Operación organizacional de Billetera Solidaria." },
  impact: { group: "ADMIN · OPERACIÓN Y CONTROL", title: "Impacto", copy: "Verifica actividades reconocidas, PET y resultados realizados de la organización." },
  audit: { group: "ADMIN · OPERACIÓN Y CONTROL", title: "Auditoría", copy: "Traza los cambios administrativos con origen, motivo y evidencia." },
  payments: { group: "ADMIN · OPERACIÓN Y CONTROL", title: "Pagos", copy: "Gestiona intercambios, cobros y conciliación de pagos." },
  cards: { group: "ADMIN · OPERACIÓN Y CONTROL", title: "Recompensas", copy: "Reglas, inventario y aprobaciones de recompensas de la organización." },
  economy: { group: "ADMIN · OPERACIÓN Y CONTROL", title: "Economía", copy: "Lanes de Class Economy, Club Support y beneficios con trazabilidad." },
  pet: { group: "ADMIN · OPERACIÓN Y CONTROL", title: "PET", copy: "Operación y trazabilidad PET de la organización." },
  imports: { group: "ADMIN · OPERACIÓN Y CONTROL", title: "Importaciones", copy: "Carga datos organizacionales con validación, confirmación y trazabilidad." },
  clubs: { group: "ADMIN · ORGANIZACIÓN", title: "Clubes", copy: "Gestiona los clubes dentro de tu alcance." },
  "club-ranking": { group: "ADMIN · ORGANIZACIÓN", title: "Ranking de clubes", copy: "Ranking, progresión y elegibilidad de los clubes de la organización." },
  content: { group: "ADMIN · ORGANIZACIÓN", title: "Contenido", copy: "Biblioteca editorial y contenido autorizado." },
  reports: { group: "ADMIN · ORGANIZACIÓN", title: "Reportes", copy: "Centro de reportes de la organización." },
  certifications: { group: "ADMIN · ORGANIZACIÓN", title: "Certificaciones", copy: "Revisa horas y avance hacia la certificación." },
  nominations: { group: "ADMIN · ORGANIZACIÓN", title: "Postulaciones", copy: "Revisa decisiones propuestas por los entrenadores." },
  activations: { group: "ADMIN · OPERACIÓN Y CONTROL", title: "Activaciones e Impacto", copy: "Campañas, eventos e impacto operativo dentro del alcance autorizado." },
  profile: { group: "ADMIN · CUENTA", title: "Perfil", copy: "Consulta tu identidad y alcance administrativo." },
  settings: { group: "ADMIN · CUENTA", title: "Configuración", copy: "Administra tus preferencias de cuenta." },
};

export async function AdminDemoWindow({ section }: DemoWindowProps) {
  const meta = labels[section];
  if (!meta) return null;

  const headerMeta =
    section === "club-ranking"
      ? { group: "PROGRESIÓN INSTITUCIONAL", title: "RANKING DE CLUBES", copy: "Lectura factual de score, logros y oportunidades habilitadas." }
      : meta;

  return (
    <article className="admin-page">
      <header className="admin-page__header">
        <span>{headerMeta.group}</span>
        <h1>{headerMeta.title}</h1>
        <p>{headerMeta.copy}</p>
      </header>

      {section === "wallet" ? (
        <div className="admin-wallet-page">
          <section className="admin-wallet-hero">
            <div>
              <span className="admin-wallet-hero__eyebrow">Balance del programa · Forjadores Pro</span>
              <strong className="admin-wallet-hero__balance">$ 1,248,500</strong>
              <small>Total disponible · demo</small>
            </div>
            <div className="admin-wallet-hero__stats">
              <span><strong>128</strong><small>actividades verificadas</small></span>
              <span><strong>3</strong><small>beneficios asignados</small></span>
              <span><strong>24</strong><small>movimientos del período</small></span>
            </div>
          </section>
          <section className="admin-panel">
            <h2>Movimientos recientes</h2>
            <div className="admin-list">
              {[
                { concept: "Apoyo de la comunidad · Cancha nueva", kind: "Aporte", amount: "+ $ 350,000", dir: "credit", actor: "Víctor Córdoba", date: "26 ago 2026", status: "Exitosa" },
                { concept: "Beneficio de desplazamiento · Jugador", kind: "Beneficio", amount: "- $ 68,000", dir: "debit", actor: "Carlos Herrera", date: "24 ago 2026", status: "Exitosa" },
                { concept: "Evento de franja · Clínica técnica", kind: "Recaudo", amount: "+ $ 215,000", dir: "credit", actor: "Mateo Ríos", date: "22 ago 2026", status: "Pendiente" },
                { concept: "Premio de compromiso · Jugador", kind: "Incentivo", amount: "- $ 40,000", dir: "debit", actor: "Carlos Herrera", date: "20 ago 2026", status: "Exitosa" },
              ].map((row, index) => (
                <div className="admin-record" key={index}>
                  <div><strong>{row.concept}</strong><small>{row.kind} · {row.actor} · {row.date}</small></div>
                  <span className={`admin-tx-amount admin-tx-amount--${row.dir}`}>{row.amount}</span>
                  <b data-status={row.dir === "credit" ? "active" : "pending"}>{row.status}</b>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : section === "impact" ? (
        <div className="admin-impact-page">
          <section className="admin-panel admin-impact-kpis">
            <div><strong>128</strong><span>actividades verificadas</span></div>
            <div><strong>32</strong><span>jugadores participantes</span></div>
            <div><strong>1,248</strong><span>cracksCoins aportados</span></div>
            <div><strong>3</strong><span>beneficios asignados</span></div>
          </section>
          <section className="admin-panel">
            <h2>Contribución por actividad</h2>
            <div className="admin-list">
              {[
                { activity: "Clínica de técnica individual", players: 18, coins: 420 },
                { activity: "Acompañamiento al entrenamiento", players: 24, coins: 360 },
                { activity: "Jornada recreativa familiar", players: 30, coins: 268 },
                { activity: "Torneo interno de barrio", players: 12, coins: 200 },
              ].map((row, index) => (
                <div className="admin-record" key={index}>
                  <div><strong>{row.activity}</strong><small>{row.players} jugadores participantes</small></div>
                  <span className="admin-tx-amount admin-tx-amount--credit">+ {row.coins} cracksCoins</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : section === "audit" ? (
        <div className="admin-audit-page">
          <section className="admin-panel">
            <h2>Registro de auditoría</h2>
            <div className="admin-list">
              {[
                { actor: "Víctor Córdoba", scope: "Forjadores Pro", action: "Actualizó el estado del club a Activo", at: "26 ago 2026 · 10:12", reason: "Verificación de estructura operativa" },
                { actor: "Víctor Córdoba", scope: "Forjadores Pro", action: "Registró horas de Carlos Herrera", at: "24 ago 2026 · 18:45", reason: "Sesión de entrenamiento validada" },
                { actor: "Sistema", scope: "Organización demo", action: "Creó la organización demo", at: "18 ago 2026 · 09:00", reason: "Inicialización del entorno demo" },
                { actor: "Mateo Ríos", scope: "Forjadores Pro", action: "Propuso postulación para Carlos Herrera", at: "18 ago 2026 · 11:30", reason: "Reconocimiento de compromiso" },
              ].map((row, index) => (
                <div className="admin-record" key={index}>
                  <div><strong>{row.actor}</strong><small>{row.scope} · {row.at}</small><small>{row.action}</small></div>
                  <details className="admin-detail"><summary>Ver motivo</summary><p className="admin-note">{row.reason}</p></details>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : section === "payments" ? (
        <div className="admin-payments-page">
          <section className="admin-panel">
            <h2>Intercambios y cobros</h2>
            <div className="admin-list">
              {[
                { period: "Agosto 2026", desc: "Cuota de participación · 24 jugadores", amount: "$ 1,200,000", status: "Pendiente" },
                { period: "Agosto 2026", desc: "Inscripción clínica técnica", amount: "$ 215,000", status: "Recibido" },
                { period: "Julio 2026", desc: "Aporte de aliado · Cancha nueva", amount: "$ 350,000", status: "Recibido" },
              ].map((row, index) => (
                <div className="admin-record" key={index}>
                  <div><strong>{row.desc}</strong><small>{row.period}</small></div>
                  <span className="admin-tx-amount admin-tx-amount--credit">{row.amount}</span>
                  <b data-status={row.status === "Recibido" ? "active" : "pending"}>{row.status}</b>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : section === "cards" ? (
        <div className="admin-rewards-page">
          <section className="admin-panel admin-impact-kpis">
            <div><strong>2</strong><span>pendientes de aprobación</span></div>
            <div><strong>1</strong><span>cupo limitado</span></div>
            <div><strong>12</strong><span>eventos auditados</span></div>
            <div><strong>4</strong><span>reglas activas</span></div>
          </section>
          <section className="admin-panel">
            <h2>Reglas de recompensa</h2>
            <div className="admin-list">
              {[
                { reward: "Beneficio de desplazamiento", category: "Movilidad", rarity: "Común", rule: "≥ 85% asistencia", value: "Cobertura de transporte", funding: "Billetera Solidaria" },
                { reward: "Jornada recreativa", category: "Comunidad", rarity: "Rara", rule: "≥ 10 actividades verificadas", value: "Entrada a evento", funding: "Aliados" },
                { reward: "Super recompensa · Plan Padrino", category: "Trayectoria", rarity: "Épica", rule: "Revisión Super Admin", value: "Cupo de alto valor", funding: "Plan Padrino" },
              ].map((row, index) => (
                <div className="admin-record" key={index}>
                  <div><strong>{row.reward}</strong><small>{row.category} · {row.rarity} · {row.rule}</small><small>Valor: {row.value} · Fuente: {row.funding}</small></div>
                  <b data-status="active">Activa</b>
                </div>
              ))}
            </div>
          </section>
          <section className="admin-panel" data-tone="gold">
            <h2>Candidatos en revisión</h2>
            <div className="admin-list">
              {[
                { player: "Carlos Herrera", reward: "Beneficio de desplazamiento · Movilidad", status: "Elegible", facts: "Asistencia 92% ≥ 85%" },
                { player: "Mariana López", reward: "Jornada recreativa · Comunidad", status: "Aprobada · revisión global", facts: "12 actividades ≥ 10" },
              ].map((row, index) => (
                <div className="admin-record" key={index}>
                  <div><strong>{row.player}</strong><small>{row.reward}</small><small>{row.facts}</small></div>
                  <b data-status={row.status.startsWith("Aprob") ? "active" : "pendiente"}>{row.status}</b>
                  {row.status === "Elegible" ? <details className="admin-detail"><summary>Aprobar</summary><div className="admin-edit-form"><button>Aprobar y asignar</button><button>Rechazar</button></div></details> : null}
                </div>
              ))}
            </div>
            <p className="admin-note">Las recompensas de alto valor requieren aprobación de Super Admin antes de reservar el cupo.</p>
          </section>
        </div>
      ) : section === "economy" ? (
        <div className="admin-economy-page">
          <section className="admin-panel admin-impact-kpis">
            <div><strong>$ 1,248,500</strong><span>valor del programa</span></div>
            <div><strong>24</strong><span>clases validadas</span></div>
            <div><strong>$ 350,000</strong><span>apoyo al club planificado</span></div>
            <div><strong>3</strong><span>beneficios en proceso</span></div>
          </section>
          <section className="admin-panel">
            <h2>Economía por clases</h2>
            <div className="admin-list">
              {[
                { payer: "Plan Padrino · fuente", facts: "14 hechos · 14 confirmados", status: "Confirmado" },
                { payer: "Familia / representante legal", facts: "10 hechos · 8 confirmados", status: "Pendiente" },
              ].map((row, index) => (
                <div className="admin-record" key={index}>
                  <div><strong>{row.payer}</strong><small>{row.facts}</small></div>
                  <b data-status={row.status === "Confirmado" ? "active" : "pending"}>{row.status}</b>
                </div>
              ))}
            </div>
            <p className="admin-note">Cada clase validada genera USD 1. El payer identifica la fuente sin crear un segundo hecho económico.</p>
          </section>
          <section className="admin-panel" data-tone="cyan">
            <h2>Apoyo mensual al club</h2>
            <div className="admin-list">
              <div className="admin-record">
                <div><strong>Forjadores Pro</strong><small>Agosto 2026 · valor planificado $ 350,000 · entregado $ 0</small></div>
                <b data-status="pending">Planificado</b>
              </div>
            </div>
            <p className="admin-note">Planificado no significa entregado. El valor entregado solo aumenta con un hecho confirmado.</p>
          </section>
          <section className="admin-panel">
            <h2>Separación financiera</h2>
            <p className="admin-note">PET real validado conserva su ciclo físico y financiero; Pagos concentra únicamente Platform Billing; CC y XP no son dinero.</p>
            <div className="admin-actions"><a href="/admin/pet">PET →</a><a href="/admin/payments">Pagos →</a><a href="/admin/audit">Auditoría →</a></div>
          </section>
        </div>
      ) : section === "pet" ? (
        <div className="admin-pet-page">
          <section className="admin-panel admin-impact-kpis">
            <div><strong>1,248</strong><span>PET validado</span></div>
            <div><strong>32</strong><span>jugadores participantes</span></div>
            <div><strong>6</strong><span>actividades verificadas</span></div>
            <div><strong>2,340 kg</strong><span>botellas recolectadas</span></div>
          </section>
          <section className="admin-panel">
            <h2>Ciclo de recolección</h2>
            <div className="admin-list">
              {[
                { activity: "Clínica de técnica individual", date: "22 ago 2026", pet: "480 botellas", status: "Verificado" },
                { activity: "Acompañamiento al entrenamiento", date: "18 ago 2026", pet: "360 botellas", status: "Verificado" },
                { activity: "Jornada recreativa familiar", date: "12 ago 2026", pet: "408 botellas", status: "Pendiente" },
              ].map((row, index) => (
                <div className="admin-record" key={index}>
                  <div><strong>{row.activity}</strong><small>{row.date}</small></div>
                  <span className="admin-tx-amount admin-tx-amount--credit">{row.pet}</span>
                  <b data-status={row.status === "Verificado" ? "active" : "pending"}>{row.status}</b>
                </div>
              ))}
            </div>
            <p className="admin-note">El PET validado conserva su ciclo físico y financiero separado de Pagos y de la economía por clases.</p>
          </section>
        </div>
      ) : section === "imports" ? (
        <div className="admin-imports-page">
          <header className="admin-page__eyebrow-row"><span className="admin-page__header-eyebrow">OPERACIÓN CONTROLADA · Administrador</span><a href="#" className="admin-imports__template">Descargar plantilla 11 Cracks</a></header>
          <section className="admin-panel">
            <h2>Subir archivo de mi club</h2>
            <p className="admin-note">Primero detectamos las columnas. Una hoja nunca elimina, desactiva ni limpia datos por ausencia.</p>
            <div className="admin-edit-form">
              <label>Tipo de datos<select><option value="clubes">Clubes</option><option value="equipos">Equipos</option><option value="jugadores">Jugadores</option><option value="entrenadores">Entrenadores</option><option value="pet">Recolección PET</option></select></label>
              <label>Qué quieres hacer<select><option value="create">Solo crear</option><option value="update">Solo actualizar</option><option value="both">Crear y actualizar</option></select></label>
              <label>Archivo<button type="button" className="admin-imports__file">Seleccionar archivo XLSX o CSV</button></label>
            </div>
            <p className="admin-note">Vista previa y confirmación se habilitan tras detectar las columnas del archivo.</p>
          </section>
          <section className="admin-panel" data-tone="cyan">
            <h2>Historial de cargas</h2>
            <div className="admin-list">
              {[
                { type: "Jugadores", file: "plantilla-2026.xlsx", at: "24 ago 2026 · 15:40", status: "Confirmada", rows: "2 procesadas" },
                { type: "Recolección PET", file: "pet-rionegro.csv", at: "20 ago 2026 · 11:12", status: "Cancelada", rows: "0 procesadas" },
              ].map((row, index) => (
                <div className="admin-record" key={index}>
                  <div><strong>{row.type}</strong><small>{row.file} · {row.at} · {row.rows}</small></div>
                  <b data-status={row.status === "Confirmada" ? "active" : "rechazada"}>{row.status}</b>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : section === "activations" ? (
        <div className="admin-activations-page">
          <section className="admin-panel admin-impact-kpis">
            <div><strong>1</strong><span>campana</span></div>
            <div><strong>1</strong><span>publicada</span></div>
            <div><strong>0</strong><span>en borrador</span></div>
            <div><strong>2</strong><span>entornos con colocacion</span></div>
          </section>
          <section className="admin-panel">
            <h2>Activaciones en alcance</h2>
            <div className="admin-list">
              {[
                { name: "Clínica de técnica individual", category: "Eventos", status: "Publicada", alias: "Aliado no registrado", scope: "Forjadores Pro", validity: "01/08/2026 → 31/08/2026", marker: "OPERATIVA" },
                { name: "Jornada recreativa familiar", category: "Eventos ambientales", status: "Borrador", alias: "Sin dato registrado", scope: "Forjadores Pro", validity: "01/09/2026 →", marker: "DEMO" },
              ].map((row, index) => (
                <div className="admin-record" key={index}>
                  <div><strong>{row.name}</strong><small>{row.category} · {row.status}</small><small>{row.alias} · {row.scope} · {row.validity}</small></div>
                  <b data-status={row.status === "Publicada" ? "active" : "pending"}>{row.status}</b>
                  <span className="admin-note">{row.marker}</span>
                </div>
              ))}
            </div>
            <p className="admin-note">Gestiona campanas, eventos e impacto operativo de la organizacion. Registro operativo separado de Billetera, PET y Pagos.</p>
          </section>
        </div>
      ) : section === "settings" ? (
        <div className="admin-settings-page">
          <section className="admin-panel">
            <h2>Configuración de la organización</h2>
            <div className="admin-list">
              <div className="admin-record">
                <div>
                  <strong>Configuración de Lecciones</strong>
                  <small>Configura las lecciones, los juegos de aprendizaje y las palabras de cada juego del software.</small>
                </div>
                <Link href="/admin/settings/lecciones" className="admin-panel__link">Configurar lecciones →</Link>
              </div>
              <div className="admin-record">
                <div>
                  <strong>Configuración de Materias</strong>
                  <small>Configura las materias (temas) de cada clase ya existentes en versiones anteriores del software.</small>
                </div>
                <Link href="/admin/settings/materias" className="admin-panel__link">Configurar materias →</Link>
              </div>
              <div className="admin-record">
                <div>
                  <strong>Configuración de Etapas</strong>
                  <small>Configura las etapas (clases) y sus temas ya existentes en versiones anteriores del software.</small>
                </div>
                <Link href="/admin/settings/etapas" className="admin-panel__link">Configurar etapas →</Link>
              </div>
            </div>
            <p className="admin-note">Los botones abren el configurador correspondiente con la data ya registrada.</p>
          </section>
        </div>
      ) : (
        <section className="admin-panel">
          <h2>{meta.title}</h2>
          <p className="admin-note">Esta ventana demo del menú de edtech11 se portó a 11cracks dentro de /admin. El contenido funcional completo requiere el backend de edtech11; aquí se mantiene la estructura de la ventana para el port «tal cual» del menú.</p>
        </section>
      )}
    </article>
  );
}
