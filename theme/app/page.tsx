'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bell, CalendarDays, ChevronRight, CircleUserRound, Home, Search, Trophy,
  Video, Volume2, Zap, Radio, X
} from 'lucide-react';

const competitions = [
  { label: 'FIFA World Cup 2026', icon: '🏆' },
  { label: 'Premier League', icon: '♛' },
  { label: 'La Liga', icon: '⚽' },
];

const matches = [
  { home: 'Spain', away: 'Cape Verde', homeMark: '🇪🇸', awayMark: '🌊', time: '10:00PM', date: 'Jun/15/2026', group: 'Group Stage · Group H' },
  { home: 'Portugal', away: 'Colombia', homeMark: '🇵🇹', awayMark: '🇨🇴', time: '2:00PM', date: 'Jun/16/2026', group: 'Group Stage · Group G' },
];

export default function HomePage() {
  const [splash, setSplash] = useState(true);
  const [activeCompetition, setActiveCompetition] = useState(0);
  const [feed, setFeed] = useState<'Latest' | 'Following' | 'Top News'>('Latest');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'home' | 'calendar' | 'video' | 'profile'>('home');
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setSplash(false), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  const visibleMatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return matches;
    return matches.filter(m => `${m.home} ${m.away} ${m.group}`.toLowerCase().includes(q));
  }, [search]);

  if (splash) return <Splash onSkip={() => setSplash(false)} />;

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="phone-notch" />

      <section className="screen">
        <header className="topbar">
          <div className="welcome">
            <div className="avatar">RS</div>
            <div><small>Hello Welcome</small><strong>Rudolph Schroeder</strong></div>
          </div>
          <button className="icon-button notification" aria-label="Notifications" onClick={() => setNotifications(!notifications)}>
            <Bell size={20} strokeWidth={1.7}/>{notifications && <i />}
          </button>
        </header>

        <div className="search-wrap">
          <Search size={21} strokeWidth={1.8}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" aria-label="Search matches" />
          {search && <button onClick={() => setSearch('')}><X size={16}/></button>}
        </div>

        <div className="chip-row no-scrollbar">
          {competitions.map((c, i) => (
            <button key={c.label} className={`competition-chip ${activeCompetition === i ? 'selected' : ''}`} onClick={() => setActiveCompetition(i)}>
              <span>{c.icon}</span>{c.label}
            </button>
          ))}
        </div>

        <section className="section-heading"><h2>Live Match</h2><button>See All <ChevronRight size={15}/></button></section>

        <article className="live-card glass-card">
          <div className="live-pill"><span/>Live</div>
          <div className="teams">
            <Team name="Brazil" mark="🇧🇷" />
            <div className="score"><div>0 - 0</div><small>29:38</small></div>
            <Team name="Morocco" mark="🇲🇦" />
          </div>
          <div className="match-controls"><span/><span/><span/><span/></div>
        </article>

        <div className="feed-tabs">
          {(['Latest', 'Following', 'Top News'] as const).map(f => <button key={f} className={feed === f ? 'active' : ''} onClick={() => setFeed(f)}>{f}</button>)}
        </div>

        <section className="section-heading upcoming-heading"><h2>Upcoming <em>(24)</em></h2><button>See All <ChevronRight size={15}/></button></section>

        <div className="match-list">
          {visibleMatches.map((m) => <Upcoming key={`${m.home}-${m.away}`} {...m} />)}
          {!visibleMatches.length && <div className="empty">No matches found</div>}
        </div>

        <nav className="bottom-nav" aria-label="Primary navigation">
          <NavButton active={tab === 'home'} onClick={() => setTab('home')}><Home/></NavButton>
          <NavButton active={tab === 'calendar'} onClick={() => setTab('calendar')}><CalendarDays/></NavButton>
          <NavButton active={tab === 'video'} onClick={() => setTab('video')}><Video/></NavButton>
          <NavButton active={tab === 'profile'} onClick={() => setTab('profile')}><CircleUserRound/></NavButton>
        </nav>
        <div className="home-indicator" />
      </section>
    </main>
  );
}

function Splash({ onSkip }: { onSkip: () => void }) {
  return <main className="splash" onClick={onSkip}>
    <div className="splash-glow"/>
    <div className="splash-logo">
      <div className="ball-mark">⚽</div><span>Goalify</span>
    </div>
    <small>V1.1</small>
  </main>;
}

function Team({name, mark}: {name:string; mark:string}) {
  return <div className="team"><div className="team-badge">{mark}</div><span>{name}</span></div>
}

function Upcoming({home, away, homeMark, awayMark, time, date, group}: typeof matches[number]) {
  return <article className="upcoming glass-card">
    <small>{group}</small>
    <div className="upcoming-main">
      <Team name={home} mark={homeMark}/>
      <div className="fixture-time"><strong>{time}</strong><span>{date}</span><button><Zap size={13} fill="currentColor"/> Watch</button></div>
      <Team name={away} mark={awayMark}/>
    </div>
  </article>
}

function NavButton({children, active, onClick}: {children:React.ReactNode; active:boolean; onClick:()=>void}) {
  return <button className={`nav-button ${active ? 'active' : ''}`} onClick={onClick}>{children}</button>
}
