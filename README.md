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
| matchmaking-service | 4002 | matchmaking_queue | implemented |
| elo-service | 4003 | elo_history, performance_baselines | implemented |
| match-service | 4004 | matches, match_results, match_player_stats, moderator_reviews | implemented |
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

## End-to-end flow (what's wired up so far)

1. Player registers/logs in via **auth-service** → gets a JWT.
2. Player calls `POST /matchmaking/queue` (with that JWT) on **matchmaking-service**.
   It fetches the player's current elo from auth-service and stores them in the queue.
3. Every 5s, matchmaking-service's background job pairs waiting players whose MMR
   is within an expanding window and assigns them a shared `matchId`.
4. Someone (currently: any authenticated caller — a proper trigger from
   matchmaking-service is the next integration step) calls
   `POST /matches` on **match-service** with `{ matchId, playerAId, playerBId }`
   to create the actual match record.
5. A player calls `PATCH /matches/:id/room-code` once they've made a custom room in MLBB.
6. After the game, a player calls `POST /matches/:id/result` with the winner + optional
   per-player K/D/A stats.
7. A moderator (role `MODERATOR`/`ADMIN` on their auth-service account) reviews it:
   `GET /matches/results/pending`, then `POST /matches/results/:resultId/review`
   with `{ decision: "APPROVED" | "REJECTED" }`.
8. On approval, match-service calls **elo-service**'s
   `POST /internal/apply-result`, which computes the new Elo for both players
   (standard Elo formula + a KDA-based performance multiplier) and writes it
   back to auth-service.

## Known gaps / next steps

- matchmaking-service finding a pair doesn't yet automatically call
  `POST /matches` on match-service — that hand-off needs to be wired in
  `matching.job.ts`.
- The performance multiplier in elo-service uses flat KDA weights, not the
  per-position weights from the design doc (Gold/Jungle/Mid/Exp/Roam), because
  hero → position data isn't wired in from hero-service yet.
- `/internal/*` routes (auth-service, elo-service) have no service-to-service
  auth — fine on the Docker internal network for now, but should get a shared
  API key before this goes anywhere near the public internet.
- team-service, tournament-service, news-service, notification-service, and
  hero-service's sync job are still skeletons — see the "Services" table above.
