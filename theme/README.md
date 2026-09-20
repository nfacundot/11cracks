# GOAL50 — Live Sports UI (Next.js)

Pixel-faithful Next.js replication of a sports betting / live-streaming mobile
concept: dark screens, volt-lime accents, condensed Oswald display type, three
fully interactive screens plus a showcase page that recreates the original
poster composition (sage backdrop, lime contour lines, overlapping phones).

## Run it

```bash
npm install   # already done once
npm run dev   # dev server with hot reload
```

Open the printed URL (defaults to http://localhost:3000, falls back to the next
free port — e.g. 3001 — if 3000 is taken).

Production: `npm run build && npm start`.

## Where to look

The project is split into two layout folders:

**`app/mobile/`** — the phone app (renders inside a phone frame on desktop, edge-to-edge on a real phone):

| URL | Screen |
| --- | --- |
| `/mobile/splash` | Splash — logo + loading bar, auto-advances to `/mobile/landing` |
| `/mobile/landing` | Landing / onboarding — intro slides |
| `/mobile/login` | Sign in → `/mobile` |
| `/mobile/register` | Create account → `/mobile` |
| `/mobile` | Home — categories, Soccer Leaders promo, favorites |
| `/mobile/soccer` | Schedule — week strip, league chips, live score cards |
| `/mobile/live` | Live match — running clock, scrubber, bet chips |

**`app/pc/`** — the web / desktop site (full-window, responsive down to mobile):

| URL | Screen |
| --- | --- |
| `/pc` | Dashboard (contract detail) — full window, no borders |
| `/pc/contract` | Copy of the dashboard window (linked as "My Teams") |
| `/pc/transfers` | Transfers — club budget, salary list, Cash In / Cash Out tables + sparklines |
| `/pc/schedule` | Schedule — upcoming fixtures with match-centre links |
| `/pc/auth` | Login and Register on the same page (tab toggle) |

`/` is the showcase listing every screen in both folders.

All flows are linked: splash → landing → login/register → home (mobile), and
PC auth → PC dashboard.

## Interactive bits

- Live screen: running match clock (starts 00:43:43), draggable timeline,
  play/pause toggle.
- Soccer screen: selectable day in the week strip.
- All buttons/pills have hover states.

## Notes on assets

Team badges (MU, Bayern, BVB, Barça, UEFA, Premier League, EFL…), avatars and
the live "footage" (gradient scene + stylised player silhouette) are drawn in
pure CSS/SVG — no copyrighted imagery. Swap them for real assets in
`components/ui.tsx` (badge map) and `components/screens/live-screen.tsx`
(`PlayerArt` / `.scene` in `app/globals.css`).

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS v4 ·
TypeScript · next/font (Oswald + Inter).
