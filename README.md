# mlbb_play — MLBB competitive platform (diploma project)

FACEIT-style competitive platform for Mobile Legends: Bang Bang.
Backend: Node.js + TypeScript, one microservice per bounded context.
Data: single Postgres instance, one schema per service (logical separation,
cheap to run on a single free-tier VM — see docker-compose.yml).
Event bus / cache: Redis (pub/sub for cross-service events + shared cache).

## Services

| Service | Port | Owns | Status |
|---|---|---|---|
| auth-service | 4001 | users, mlbb_profiles | implemented |
| matchmaking-service | 4002 | matchmaking_queue | skeleton |
| elo-service | 4003 | elo_history, role_performance_baselines | skeleton |
| match-service | 4004 | matches, match_results, match_player_stats, moderator_reviews | skeleton |
| hero-service | 4005 | heroes, hero_rank_stats, hero_relations, hero_skill_combos | skeleton |
| team-service | 4006 | teams, team_members | skeleton |
| tournament-service | 4007 | tournaments, tournament_registrations | skeleton |
| news-service | 4008 | news | skeleton |
| notification-service | 4009 | none (event consumer only) | skeleton |

"skeleton" = boots, exposes `GET /health`, ready for real routes to be filled in.
"implemented" = has working routes described below.

## Run everything

```bash
docker compose up --build
```

Then check every service is alive:

```bash
for p in 4001 4002 4003 4004 4005 4006 4007 4008 4009; do
  curl -s http://localhost:$p/health; echo
done
```

## auth-service — what's implemented

- `POST /auth/register` — { username, email, password } → creates user, returns JWT
- `POST /auth/login` — { email, password } → returns JWT
- `GET /auth/me` — requires `Authorization: Bearer <token>` → current user + mlbb profile
- `POST /auth/mlbb-link` — requires auth → links { mlbbId, zoneId, inGameName } to the account

Passwords are hashed with bcrypt. JWT secret and DB URL come from environment
variables (see docker-compose.yml). Schema lives in
`services/auth-service/prisma/schema.prisma` — run `npx prisma migrate dev`
inside the container (or locally against DATABASE_URL) to create the tables.

## Next services to fill in (suggested order)

1. matchmaking-service — queue + expanding-window matching, talks to elo-service for MMR
2. elo-service — Elo formula + role-weighted performance multiplier (already designed)
3. match-service — result submission + moderator review workflow
4. hero-service — nightly sync job from the MLBB Hero Analytics API
5. team-service, tournament-service, news-service, notification-service
