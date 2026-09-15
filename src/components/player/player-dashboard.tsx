import type { CSSProperties } from "react";
import Link from "next/link";
import { GlassCard } from "@glinui/ui";
import { NavigationIcon } from "@/components/shell/navigation-icon";
import type { NavigationIcon as NavigationIconName } from "@/lib/shell/navigation";
import { PlayerEvolutionPreview, type PlayerHomeEvolution } from "@/components/player/player-evolution-preview";
import { PlayerHomeScene } from "@/components/player/player-home-scene";
import { PlayerHomeReveal } from "@/components/player/player-home-reveal";
import { getPlayerHomeScene } from "@/lib/player/scene-home";
import type { PlayerRpgData } from "@/components/player/player-rpg-home";

export type PlayerDashboardCard = {
  state: "earned" | "next";
  eyebrow: string;
  badge: string;
  rarity: string;
  category: string;
  title: string;
  reason: string;
  progress?: string | null;
  art?: "training" | "kit" | "stadium" | "team" | "scout" | "international";
  rarityTone?: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC";
  href: string;
  ctaLabel: string;
};

export type PlayerDashboardVideo = {
  state: "available" | "empty";
  thumbnailUrl?: string | null;
  title?: string;
  area?: string;
  durationLabel?: string;
  description?: string;
  completionPercent?: number;
  href?: string;
  ctaLabel?: string;
};

export type PlayerDashboardRacha = {
  streak: number;
  best: number;
  state: string;
  nextMilestone: number | null;
};

export type PlayerDashboardHours = {
  value: string;
  detail: string;
} | null;

export type PlayerDashboardNextStep = {
  kind: string;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
};

export type PlayerDashboardPending = {
  id: string;
  actionLabel: string;
  title: string;
  description: string;
  href: string;
};

export type PlayerDashboardProps = {
  name: string;
  avatarUrl: string | null;
  position: string | null;
  scopeLabel: string;
  evolution: PlayerHomeEvolution;
  racha: PlayerDashboardRacha;
  hours: PlayerDashboardHours;
  nextStep: PlayerDashboardNextStep;
  pending: readonly PlayerDashboardPending[];
  rpg?: PlayerRpgData;
  card?: PlayerDashboardCard;
  video?: PlayerDashboardVideo;
};

const quickAccess = [
  { label: "Mi progreso", href: "/jugador/progress", icon: "progress" as NavigationIconName, tone: "progress" },
  { label: "Entrenamiento", href: "/jugador/training", icon: "training" as NavigationIconName, tone: "training" },
  { label: "El Camino", href: "/jugador/neurocracks", icon: "learning" as NavigationIconName, tone: "neurocracks" },
] as const;

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>;
}

function CalendarIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" /><path d="M8 13h3m2 0h3m-8 4h3" /></svg>;
}

function CollectionIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 7 4v10l-7 4-7-4V7l7-4Z" /><path d="m5 7 7 4 7-4M12 11v10" /></svg>;
}

function VideoIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h8A2.5 2.5 0 0 1 17 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-8A2.5 2.5 0 0 1 4 17.5v-11Z" /><path d="m17 9 3-2v10l-3-2M8 9v6l5-3-5-3Z" /></svg>;
}

function CardArtwork({ card }: { card: PlayerDashboardCard }) {
  const art = card.art ?? "international";
  const label = art === "international" ? "Ruta" : art === "scout" ? "Ojo" : art === "stadium" ? "Estadio" : art === "team" ? "Equipo" : art === "kit" ? "Kit" : "Entreno";
  return <div className="player-rpg-card__art" data-art={art} data-rarity={card.rarityTone ?? "RARE"}><svg viewBox="0 0 120 96" role="img" aria-label={`Emblema visual de ${card.rarity}`}>{art === "kit" ? <><path className="player-rpg-card__art-line" d="M28 24 43 15l17 12 17-12 15 9-7 20v32H35V44Z" /><path className="player-rpg-card__art-line" d="M43 15v18h34V15M48 55h24M48 65h24" /></> : art === "stadium" ? <><path className="player-rpg-card__art-line" d="M15 78V45c0-20 20-34 45-34s45 14 45 34v33M27 78V48c0-12 14-22 33-22s33 10 33 22v30M48 78V58c0-5 5-9 12-9s12 4 12 9v20" /><path className="player-rpg-card__art-line" d="M10 78h100" /></> : art === "scout" ? <><path className="player-rpg-card__art-line" d="M14 48c18-24 42-24 58 0-16 24-40 24-58 0Z" /><circle className="player-rpg-card__art-dot" cx="43" cy="48" r="8" /><path className="player-rpg-card__art-line" d="m76 24 25 25M92 18l10 10M84 32l10 10" /></> : art === "international" ? <><circle className="player-rpg-card__art-ring" cx="56" cy="48" r="34" /><path className="player-rpg-card__art-line" d="M22 48h68M56 14c12 10 17 21 17 34s-5 24-17 34M56 14c-12 10-17 21-17 34s5 24 17 34M27 28c18 8 40 8 58 0M27 68c18-8 40-8 58 0" /><path className="player-rpg-card__art-line" d="M91 75h19M100 66v18" /></> : art === "team" ? <><path className="player-rpg-card__art-line" d="M20 72c0-18 14-32 32-32s32 14 32 32M44 72c0-10 8-18 18-18s18 8 18 18M12 78h96" /><circle className="player-rpg-card__art-dot" cx="52" cy="27" r="9" /><circle className="player-rpg-card__art-dot" cx="84" cy="38" r="6" /></> : <><path className="player-rpg-card__art-line" d="M12 78 38 28l24 18 24-28 22 60" /><path className="player-rpg-card__art-line" d="M12 78h96M26 62l18-18 16 12 18-20 16 18" /><circle className="player-rpg-card__art-dot" cx="38" cy="28" r="6" /><circle className="player-rpg-card__art-dot" cx="86" cy="18" r="6" /><path className="player-rpg-card__art-ring" d="M86 18c14 0 24 10 24 24s-10 24-24 24-24-10-24-24 10-24 24-24Z" /></>}</svg><span>{label}</span></div>;
}

function CardPreview({ card, rpg }: { card?: PlayerDashboardCard; rpg?: PlayerRpgData }) {
  const state = card?.state ?? "next";
  const earned = state === "earned";
  const eyebrow = card?.eyebrow ?? (earned ? "ÚLTIMA CARTA GANADA" : "TU PRÓXIMA CARTA");
  const badge = card?.badge ?? (earned ? "Ganada" : "En camino");
  const rarity = card?.rarity ?? "Por descubrir";
  const category = card?.category ?? "Camino de Crack";
  const title = card?.title ?? (earned ? "Tu última recompensa" : rpg?.nextRewardTitle ?? "Tu próxima recompensa");
  const reason = card?.reason ?? (earned ? "Una recompensa que ya forma parte de tu recorrido." : "Sigue con tu actividad validada para acercarte.");
  const ctaLabel = card?.ctaLabel ?? (earned ? "Ver mi colección" : "Ver progreso");
  const href = card?.href ?? "/jugador/progress";
  return (
    <GlassCard className="player-home-130c__card-slot" data-reveal data-card-state={state} aria-labelledby="player-home-card-title">
      <div className="player-home-130c__card-heading"><div><span className="player-home-130c__eyebrow">{eyebrow}</span><h2 id="player-home-card-title">Tu colección sigue creciendo.</h2></div><span className="player-home-130c__card-state">{badge}</span></div>
      <div className="player-home-130c__card-body"><div className="player-home-130c__card-art">{card?.art ? <CardArtwork card={card} /> : <span><CollectionIcon /></span>}</div><div className="player-home-130c__card-copy"><span>{rarity} · {category}</span><strong>{title}</strong><p>{reason}</p>{!earned && rpg ? <small>{rpg.streakProgress}% hacia tu próximo hito · {Math.max(0, rpg.nextMilestone - rpg.streakCurrent)} días por completar</small> : null}</div></div>
      <Link href={href} className="player-home-130c__text-link player-home-130h__text-link">{ctaLabel}<ArrowIcon /></Link>
    </GlassCard>
  );
}

function VideoPreview({ video }: { video?: PlayerDashboardVideo }) {
  const state = video?.state ?? "empty";
  const ctaLabel = video?.completionPercent && video.completionPercent > 0 ? "Continuar video" : "Ver video";
  return (
    <GlassCard className="player-home-130c__video" data-reveal aria-labelledby="player-home-video-title" data-video-state={state}>
      <div className="player-home-130c__section-heading"><div><span className="player-home-130c__eyebrow">PARA MEJORAR TU JUEGO</span><h2 id="player-home-video-title">Un foco para hoy.</h2></div><span className="player-home-130c__section-note">Contenido aprobado</span></div>
      {video && state === "available" ? (
        <Link href={video.href ?? "#"} className="player-home-130c__video-link">
          <span className="player-home-130c__video-thumb">
            {video.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={video.thumbnailUrl} alt="" />
            ) : (
              <VideoIcon />
            )}
            <i>▶</i>
          </span>
          <span className="player-home-130c__video-copy">
            <strong>{video.title}</strong>
            <span>{video.area} · {video.durationLabel}</span>
            <small>{video.description}</small>
            <span className="player-home-130c__video-progress" aria-label={`${video.completionPercent ?? 0}% completado`}>
              <span style={{ width: `${video.completionPercent ?? 0}%` }} />
            </span>
            <em>{video.completionPercent ?? 0}% completado</em>
            <b>{ctaLabel} <ArrowIcon /></b>
          </span>
        </Link>
      ) : (
        <p className="player-home-130c__empty">Aún no tienes un video recomendado.</p>
      )}
    </GlassCard>
  );
}

export function PlayerDashboard({ name, avatarUrl, position, scopeLabel, evolution, racha, hours, nextStep, card, video, rpg }: PlayerDashboardProps) {
  const heroStyle = {
    "--club-accent": "var(--brand-gold-bright)",
    "--club-accent-surface": "color-mix(in oklch, var(--brand-gold) 7%, transparent)",
  } as CSSProperties;

  const hasAvatar = Boolean(avatarUrl);
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const roleContext = [position].filter(Boolean).join(" · ");

  return (
    <article className="player-home player-home-130c player-home-130h" style={heroStyle} data-club-accent="11cracks">
      <PlayerHomeReveal>
        <PlayerHomeScene initialScene={getPlayerHomeScene("jugador01")} fixed />

        <div className="player-home-130c__canvas player-home-130h__canvas">
          <section className="player-home-130c__hero player-home-130h__hero" aria-labelledby="player-home-title">
            <header className="player-home-130c__identity player-home-130h__identity">
              <span className="player-home-130c__avatar player-home-130h__avatar">
                {hasAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl as string} alt={name} width={88} height={88} />
                ) : (
                  <span className="player-home-130c__avatar-initials">{initials}</span>
                )}
              </span>
              <div><span className="player-home-130c__identity-kicker player-home-130h__identity-kicker">{scopeLabel}</span><strong>{name}</strong>{roleContext ? <small>{roleContext}</small> : null}</div>
            </header>

            <div className="player-home-130c__evolution player-home-130h__evolution" data-reveal>
              <PlayerEvolutionPreview evolution={evolution} variant="home" />
            </div>

            <div className="player-home-130c__hud player-home-130h__hud" aria-label="Tu estado actual">
              <div data-reveal><span>Racha verificada</span><strong>{racha.streak > 0 ? `${racha.streak} días` : "—"}</strong><small>{racha.state}</small></div>
              <div data-reveal><span>Horas validadas</span><strong>{hours?.value ?? "—"}{hours ? <small>{hours.detail}</small> : null}</strong><small>Meta de certificación</small></div>
              <div data-reveal><span>Próximo hito</span><strong>{racha.nextMilestone ? `${racha.nextMilestone} días` : "—"}</strong><small>Continuidad validada</small></div>
            </div>

            <section className="player-home-130c__training player-home-130h__training player-home-130c__training--empty" data-reveal data-training-state="empty" aria-labelledby="next-training-title">
              <div className="player-home-130c__training-heading player-home-130h__training-heading"><span className="player-home-130c__eyebrow">PRÓXIMO ENTRENAMIENTO</span><CalendarIcon /></div>
              <p id="next-training-title" className="player-home-130c__empty player-home-130h__empty">Aún no tienes un próximo entrenamiento programado.</p>
            </section>

            <div className="player-home-130c__message player-home-130h__message" data-reveal><span className="player-home-130c__eyebrow">TU CAMINO DE CRACK</span><h1 id="player-home-title">Tu partido empieza aquí.</h1><p>Entrena, aprende y sigue construyendo tu camino.</p></div>

            <GlassCard className="player-home-130c__next player-home-130h__next" data-reveal data-next-step={nextStep.kind} aria-labelledby="next-step-title">
              <div><span className="player-home-130c__eyebrow">TU SIGUIENTE PASO</span><h2 id="next-step-title">{nextStep.title}</h2><p>{nextStep.description}</p></div>
              <Link href={nextStep.href} className="player-home-130c__primary-cta player-home-130h__primary-cta"><span>{nextStep.actionLabel}</span><ArrowIcon /></Link>
            </GlassCard>

            <nav className="player-home-130c__quick-access player-home-130h__quick-access" data-reveal aria-label="Accesos rápidos">
              {quickAccess.map((item) => (
                <Link href={item.href} key={item.href} data-tone={item.tone}>
                  <span><NavigationIcon name={item.icon} /></span>
                  <strong>{item.label}</strong>
                  <small>{item.label === "Mi progreso" ? "Evolución y XP" : item.label === "El Camino" ? "Actividad pendiente" : "Ver agenda"}</small>
                  <ArrowIcon />
                </Link>
              ))}
            </nav>
          </section>

          <div className="player-home-130c__secondary-grid player-home-130h__secondary-grid">
            <CardPreview card={card} rpg={rpg} />
            <VideoPreview video={video} />
          </div>
        </div>
      </PlayerHomeReveal>
    </article>
  );
}