# MLBB Play — Web app

Next.js 14 + TypeScript + Tailwind CSS client for the mlbb_play backend.
Separate project from the backend (`mlbb_play/`) and the old Android skeleton
(no longer the direction — see the backend's README for the decision history).

## What's implemented

- **Login / Register** — split hero+form layout, wired to `auth-service`
- **Dashboard** — profile stats (Elo rating, role, linked MLBB ID)
- **Matchmaking** — join queue, live polling while searching, shows the
  match + room code once matched (the full working backend flow: queue →
  auto-matched → real match record)
- JWT persisted in `localStorage`, so reloading the page keeps you logged in
- Dark theme matching the original design mockups: Unbounded (display) +
  Inter (body), both with full Cyrillic support for Mongolian text

## Project layout

```
app/
├── layout.tsx           — root layout, loads fonts, wraps app in AuthProvider
├── page.tsx              — redirects to /dashboard or /login
├── login/page.tsx
├── register/page.tsx
├── dashboard/page.tsx
└── matchmaking/page.tsx  — queue → poll → matched flow
lib/
├── api.ts                — typed fetch wrappers, one block per backend service
└── auth-context.tsx       — React context: token, current user, login/register/logout
components/
├── NavBar.tsx
├── Button.tsx
├── Field.tsx
└── StatCard.tsx
```

## Running it

1. `npm install`
2. Make sure the backend is running (`docker compose up` in `mlbb_play/`)
3. `npm run dev` — opens on `http://localhost:3000`
4. Register a new account, or log in with one you already created via
   curl/PowerShell during backend testing

No `.env.local` is required for local development — `lib/api.ts` defaults to
`http://localhost:4001`–`4004`, which matches the backend's docker-compose
port mapping exactly. Copy `.env.local.example` to `.env.local` only if you
need to point at a different backend (e.g. a deployed one).

## Known gaps / next steps

- Leaderboard, Tournaments, Clans, Heroes nav links exist but have no pages
  yet (map to the still-skeleton backend services)
- No match-result submission or moderator-review UI yet (the backend
  endpoints exist — see `match-service`'s README)
- No chat feature yet — the plan is to add it on `notification-service` via
  WebSocket (Socket.io) with Redis-backed, time-limited chat rooms opened
  once two players are matched
- Matchmaking page's polling stops on unmount but doesn't handle the
  "already in queue from a previous session" case gracefully yet
