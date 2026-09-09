"use client";

import type { PlayerProgressRpg, PlayerRpgQuest } from "@/lib/player/progress";

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

function QuestIcon({ state }: { state: PlayerRpgQuest["state"] }) {
  return (
    <span className="player-rpg-quest__icon" data-state={state} aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d={state === "VERIFIED" ? "m5 12 4 4L19 6" : "M12 3v18M3 12h18"} />
      </svg>
    </span>
  );
}

export function PlayerRpgProgressModules({ rpg }: { rpg: PlayerProgressRpg }) {
  return (
    <div className="player-rpg-progress-modules">
      <section className="player-rpg-quests" aria-labelledby="player-rpg-quests-title">
        <div className="player-rpg__section-heading">
          <div>
            <span className="player-rpg__label">ACCIONES VERIFICABLES</span>
            <h2 id="player-rpg-quests-title">Misiones de esta semana</h2>
          </div>
          <span>No cuenta abrir la app</span>
        </div>
        <div className="player-rpg-quest-list">
          {rpg.quests.map((quest) => (
            <article className="player-rpg-quest" key={quest.id} data-state={quest.state}>
              <div className="player-rpg-quest__objective">
                <QuestIcon state={quest.state} />
                <div>
                  <span className="player-rpg-quest__eyebrow">Objetivo {quest.state === "VERIFIED" ? "validado" : "activo"}</span>
                  <strong>{quest.title}</strong>
                  <span>{quest.sourceLabel}</span>
                  <small>{quest.detail}</small>
                </div>
              </div>
              <div className="player-rpg-quest__progress">
                <span className="player-rpg-quest__count">{quest.progress} / {quest.target}</span>
                <RpgProgress value={quest.progress} target={quest.target} label={`${quest.title}: ${quest.progress} de ${quest.target}`} />
                <b>{quest.state === "VERIFIED" ? "Verificada" : "En curso"}</b>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="player-rpg-next-reward" aria-labelledby="player-rpg-next-reward-title">
        <span className="player-rpg__label">PRÓXIMA RECOMPENSA</span>
        <h2 id="player-rpg-next-reward-title">{rpg.nextRewardTitle}</h2>
        <strong>{Math.max(0, rpg.nextMilestone - rpg.streakCurrent)} días más y alcanzas tu próximo hito.</strong>
        <RpgProgress value={rpg.streakCurrent} target={rpg.nextMilestone} label="Progreso hacia el próximo hito" />
        <p>{rpg.nextRewardDetail}</p>
        <small>Racha actual: {rpg.streakCurrent} · mejor racha: {rpg.streakBest}</small>
      </section>
    </div>
  );
}