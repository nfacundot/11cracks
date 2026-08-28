import Link from "next/link";

export type PlayerRpgData = {
  level: number;
  xp: number;
  xpToNext: number;
  streakCurrent: number;
  streakBest: number;
  nextMilestone: number;
  nextRewardTitle: string;
  nextActionTitle?: string;
};

function percent(value: number, target: number): number {
  return Math.min(100, Math.round((value / Math.max(1, target)) * 100));
}

function RpgProgress({ value, target, label }: { value: number; target: number; label: string }) {
  const current = percent(value, target);
  return (
    <div className="player-rpg__progress-wrap">
      <div className="player-rpg__progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={target} aria-valuenow={value}>
        <span style={{ width: `${current}%` }} />
      </div>
      <small>{value} / {target}</small>
    </div>
  );
}

export function PlayerRpgHomeHud({ rpg }: { rpg: PlayerRpgData }) {
  const remaining = Math.max(0, rpg.xpToNext - rpg.xp);
  const daysToReward = Math.max(0, rpg.nextMilestone - rpg.streakCurrent);
  return (
    <section className="player-home__rpg">
      <section className="player-rpg-home" aria-labelledby="player-rpg-home-title">
        <div className="player-rpg-home__level">
          <span className="player-rpg__label">Tu progresión</span>
          <h2 id="player-rpg-home-title">Nivel {rpg.level}</h2>
          <p>{rpg.xp} XP · faltan {remaining} XP para nivel {rpg.level + 1}</p>
          <div className="player-rpg__home-bar" role="progressbar" aria-label="Progreso de experiencia" aria-valuemin={0} aria-valuemax={rpg.xpToNext} aria-valuenow={rpg.xp}>
            <span style={{ width: `${percent(rpg.xp, rpg.xpToNext)}%` }} />
          </div>
        </div>

        <div className="player-rpg-home__streak">
          <span className="player-rpg__label">Racha activa</span>
          <strong>{rpg.streakCurrent} días</strong>
          <RpgProgress value={rpg.streakCurrent} target={rpg.nextMilestone} label="Racha hacia el próximo hito" />
          <small>Próximo hito: {rpg.nextMilestone} días</small>
        </div>

        <div className="player-rpg-home__reward">
          <span className="player-rpg__label">Próxima recompensa</span>
          <div className="player-rpg-home__reward-mark" aria-hidden="true">{rpg.nextRewardTitle.slice(0, 1)}</div>
          <strong>{rpg.nextRewardTitle}</strong>
          <small>{daysToReward} días más y alcanzas tu próximo hito.</small>
        </div>

        <div className="player-rpg-home__action">
          <span>Próxima acción</span>
          <strong>{rpg.nextActionTitle ?? "Continúa tu recorrido"}</strong>
          <small>Actividad validada · sin contar apertura de la app</small>
          <Link href="/jugador/progress">Ver mi continuidad</Link>
        </div>
      </section>

      <RachaJourney rpg={rpg} />
    </section>
  );
}

function RachaJourney({ rpg }: { rpg: PlayerRpgData }) {
  const milestones = Array.from(new Set([5, rpg.nextMilestone, rpg.streakBest])).filter((value) => value >= 1).sort((a, b) => a - b);
  return (
    <section className="player-rpg-racha-journey" aria-labelledby="player-rpg-racha-journey-title">
      <div className="player-rpg__section-heading">
        <div>
          <span className="player-rpg__label">RACHA · CAMINO COMPETITIVO</span>
          <h2 id="player-rpg-racha-journey-title">Tu siguiente marca</h2>
        </div>
        <span>{rpg.streakCurrent} / {rpg.nextMilestone} días</span>
      </div>
      <div className="player-rpg-racha-journey__path" aria-label={`Racha actual ${rpg.streakCurrent} días, mejor racha ${rpg.streakBest} días`}>
        {milestones.map((milestone) => (
          <div className="player-rpg-racha-journey__node" data-state={rpg.streakCurrent >= milestone ? "done" : milestone === rpg.nextMilestone ? "next" : "locked"} key={milestone}>
            <span>{milestone}</span>
            <small>{rpg.streakCurrent >= milestone ? "Superado" : milestone === rpg.nextMilestone ? "Próximo hito" : "Récord a batir"}</small>
          </div>
        ))}
      </div>
      <p>Actividad registrada → Racha → XP y nivel → Objetivos → Recompensas. Tu mejor marca es <strong>{rpg.streakBest} días</strong>; cada actividad cuenta, abrir la app no.</p>
    </section>
  );
}
