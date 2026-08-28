import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { NavigationIcon } from "@/components/shell/navigation-icon";
import type { NavigationIcon as NavigationIconName } from "@/lib/shell/navigation";
import { PlayerEvolutionPreview, type PlayerHomeEvolution } from "@/components/player/player-evolution-preview";
import { PlayerRpgHomeHud, type PlayerRpgData } from "@/components/player/player-rpg-home";

export type PlayerHomeMetric = {
  id: string;
  icon: NavigationIconName;
  label: string;
  value: string;
  detail?: string;
};

export type PlayerHomeNextStep = {
  title: string;
  description: string;
  actionLabel: string;
  href: string;
};

export type PlayerHomeRacha = {
  streak: number;
  best: number;
  state: string;
  explanation: string;
  nextMilestone: number | null;
};

export type PlayerHomeProps = {
  name: string;
  avatarUrl?: string | null;
  roleLabel: string;
  scopeLabel: string;
  heroSrc: string;
  focal: { x: number; y: number };
  mobileFocal: { x: number; y: number };
  nextStep: PlayerHomeNextStep;
  racha: PlayerHomeRacha;
  metrics: readonly [PlayerHomeMetric, PlayerHomeMetric, PlayerHomeMetric];
  evolution: PlayerHomeEvolution;
  rpg?: PlayerRpgData;
};

const quickAccess = [
  { label: "Mi progreso", href: "/jugador/progress", icon: "progress", tone: "progress" },
  { label: "Entrenamiento", href: "/jugador/training", icon: "training", tone: "training" },
  { label: "NeuroCracks", href: "/jugador/neurocracks", icon: "learning", tone: "neurocracks" },
  { label: "Recompensas", href: "/jugador/logros", icon: "achievements", tone: "rewards" },
] as const;

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  );
}

function AchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" />
      <path d="M9 19h6M12 16v3" />
    </svg>
  );
}

function Metric({ metric }: { metric: PlayerHomeMetric }) {
  return (
    <div className="player-home__metric" data-metric={metric.id}>
      <span className="player-home__metric-icon" aria-hidden="true">
        <NavigationIcon name={metric.icon} />
      </span>
      <div>
        <dt>{metric.label}</dt>
        <dd>
          <strong>{metric.value}</strong>
          {metric.detail ? <span>{metric.detail}</span> : null}
        </dd>
      </div>
    </div>
  );
}

export function PlayerHome({ name, avatarUrl, roleLabel, scopeLabel, heroSrc, focal, mobileFocal, nextStep, racha, metrics, evolution, rpg }: PlayerHomeProps) {
  const heroStyle = {
    "--player-home-focal-mobile-x": `${mobileFocal.x * 100}%`,
    "--player-home-focal-mobile-y": `${mobileFocal.y * 100}%`,
    "--player-home-focal-desktop-x": `${focal.x * 100}%`,
    "--player-home-focal-desktop-y": `${focal.y * 100}%`,
  } as CSSProperties;

  const hasAvatar = Boolean(avatarUrl);
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <article className="player-home" style={heroStyle}>
      <div className="player-home__scene" aria-hidden="true">
        <Image
          className="player-home__scene-image"
          src={heroSrc}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) calc(100vw - 240px), 100vw"
        />
        <span className="player-home__scene-grade" />
        <span className="player-home__scene-light" />
        <span className="player-home__scene-depth" />
      </div>

      <div className="player-home__layout">
        <header className="player-home__identity">
          <span className="player-home__avatar">
            {hasAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl as string} alt={name} width={72} height={72} sizes="72px" />
            ) : (
              <span className="player-home__avatar-initials">{initials}</span>
            )}
          </span>
          <div className="player-home__identity-copy">
            <strong>{name}</strong>
            <span>{roleLabel}</span>
            <small>{scopeLabel}</small>
          </div>
        </header>

        <section className="player-home__hero-copy" aria-labelledby="player-home-title">
          <h1 id="player-home-title">Tu partido empieza aquí.</h1>
          <p>Entrena, aprende y sigue construyendo tu camino.</p>
        </section>

        <div className="player-home__immediate">
          <section className="player-home__next-step" aria-labelledby="next-step-title">
            <div className="player-home__next-copy">
              <span>Tu siguiente paso</span>
              <h2 id="next-step-title">{nextStep.title}</h2>
              <p>{nextStep.description}</p>
            </div>
            <Link href={nextStep.href} className="player-home__next-action">
              <span>{nextStep.actionLabel}</span>
              <ArrowIcon />
            </Link>
          </section>

          <section className="player-home__continuity" aria-labelledby="player-home-racha-title">
            <div>
              <span>RACHA · ACTIVIDAD VALIDADA</span>
              <h2 id="player-home-racha-title">{racha.streak === 0 ? "Aún no hay racha" : `${racha.streak} ${racha.streak === 1 ? "día" : "días"}`}</h2>
              <p>{racha.explanation}</p>
            </div>
            <div className="player-home__continuity-meta">
              <strong>{racha.state}</strong>
              <span>{racha.nextMilestone ? `Próximo hito · ${racha.nextMilestone} días` : "Consulta tu progreso"}</span>
              <Link href="/jugador/progress">Ver mi continuidad <ArrowIcon /></Link>
            </div>
          </section>
        </div>

        <div className="player-home__utility">
          <section className="player-home__progress-strip" aria-label="Resumen de progreso">
            <dl>
              {metrics.map((metric) => <Metric key={metric.id} metric={metric} />)}
            </dl>
          </section>
        </div>

        {rpg ? <PlayerRpgHomeHud rpg={rpg} /> : null}

        <PlayerEvolutionPreview evolution={evolution} />

        <nav className="player-home__quick-access" aria-label="Accesos esenciales">
          {quickAccess.map((item) => (
            <Link href={item.href} key={item.href} data-tone={item.tone}>
              <span aria-hidden="true"><NavigationIcon name={item.icon} /></span>
              <strong>{item.label}</strong>
              <i><AchIcon /></i>
            </Link>
          ))}
        </nav>
      </div>
    </article>
  );
}
