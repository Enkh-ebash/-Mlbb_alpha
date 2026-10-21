# mlbb_play — Auto QA (API автомат тест)

Vitest + Node 20 fetch. Бүх тест нь **сервисүүдийн HTTP API-г гаднаас нь** (black-box) шалгана.

## Ажиллуулах
```powershell
# 1) Сервисүүдээ асаа (төслийн үндсэн хавтсанд)
docker compose up -d

# 2) qa/ хавтсанд
cd qa
npm install
npm run test:smoke     # зөвхөн /health (30 сек)
npm test               # бүх тест (~3–5 мин, подбор 5 сек тутамд ажилладаг)
```
Тайлан: `qa/reports/junit.xml`.

## Тохиргоо (орчны хувьсагч)
| Хувьсагч | Утга |
|---|---|
| `AUTH_URL`, `MATCH_URL`, ... | Сервисийн хаяг (анхдагч `http://localhost:400x`) |
| `PG_SERVICE` | docker compose дахь Postgres-ийн нэр (анхдагч `postgres`) |
| `REPO_DIR` | docker-compose.yml байгаа хавтас (анхдагч `..`) |

## Тестийн бүтэц
| Файл | Юуг шалгана |
|---|---|
| `health.test.ts` | SMOKE: 9 сервисийн /health |
| `auth.test.ts` | бүртгэл, нэвтрэлт, валидаци, 401, Elo=1000, leaderboard |
| `matchmaking.test.ts` | очередь, давхар орох 409, төлөв |
| `match-flow.test.ts` | хос олох → код → санал → Elo, 403/409, маргаан→модератор |
| `security.test.ts` | **Илэрсэн дефектүүд** (`it.fails`): #2 эрхийн шалгалт, #3 `/internal` |
| `team-hero.test.ts` | баг, нэг баг дүрэм, капитан эрх, героин жагсаалт |

## Чухал
- Хариуны талбарын нэр (`token`, `matchId`, `winnerId`, `roomCode`...) AI_CONTEXT.md-ээс таамагласан.
  Эхний ажиллуулалтад унавал `tests/helpers.ts` ба хүсэлтийн бие (`body`) тулгаж засна.
- `it.fails` = дефект байгаа үед тест ногоон. Дефект засагдвал тест **улаан** болно → `it`-ээр солино.
- Модераторын тест нь docker шаардана (DB дээр role-ыг `MODERATOR` болгоно). Docker байхгүй бол алгасна.
