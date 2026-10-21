import { execSync } from 'node:child_process';

export const PORTS = {
  auth: 4001, matchmaking: 4002, elo: 4003, match: 4004, hero: 4005,
  team: 4006, tournament: 4007, news: 4008, notification: 4009,
} as const;
export type Svc = keyof typeof PORTS;

export const baseUrl = (svc: Svc) =>
  process.env[`${svc.toUpperCase()}_URL`] ?? `http://localhost:${PORTS[svc]}`;

export interface Res { status: number; body: any }

export async function api(
  svc: Svc, method: string, path: string,
  opts: { token?: string; body?: unknown; headers?: Record<string, string> } = {},
): Promise<Res> {
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const r = await fetch(baseUrl(svc) + path, {
    method, headers, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const text = await r.text();
  let body: any = text;
  try { body = text ? JSON.parse(text) : null; } catch { /* не JSON */ }
  return { status: r.status, body };
}

/** Объектын гүнээс түлхүүрийг хайна (хариуны бүтэц өөр байж болох тул тэсвэртэй). */
export function findKey(obj: any, key: string): any {
  if (obj === null || typeof obj !== 'object') return undefined;
  if (key in obj) return obj[key];
  for (const v of Object.values(obj)) {
    const r = findKey(v, key);
    if (r !== undefined) return r;
  }
  return undefined;
}

export interface TestUser { username: string; email: string; password: string; token: string; id: string }

let counter = 0;
export async function registerUser(prefix = 'qa'): Promise<TestUser> {
  const uniq = `${Date.now().toString(36)}${(counter++).toString(36)}`;
  const username = `${prefix}_${uniq}`.slice(0, 24);
  const email = `${username}@test.mn`;
  const password = 'Passw0rd123';
  const r = await api('auth', 'POST', '/auth/register', { body: { username, email, password } });
  if (r.status >= 300) throw new Error(`register failed ${r.status}: ${JSON.stringify(r.body)}`);
  const token = findKey(r.body, 'token') ?? findKey(r.body, 'accessToken');
  const id = findKey(r.body?.user ?? r.body, 'id');
  if (!token || !id) throw new Error(`token/id олдсонгүй: ${JSON.stringify(r.body)}`);
  return { username, email, password, token, id };
}

export async function getElo(u: TestUser): Promise<number> {
  const r = await api('auth', 'GET', '/auth/me', { token: u.token });
  return Number(findKey(r.body, 'eloRating'));
}

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function waitFor<T>(fn: () => Promise<T | undefined>, timeoutMs = 40_000, everyMs = 1_500): Promise<T> {
  const end = Date.now() + timeoutMs;
  for (;;) {
    const v = await fn();
    if (v !== undefined) return v;
    if (Date.now() > end) throw new Error('waitFor: хугацаа дууслаа');
    await sleep(everyMs);
  }
}

/** Хоёр шинэ тоглогчийг очередьд оруулж, подбор хийгдэх хүртэл хүлээнэ. */
export async function pairPlayers() {
  const a = await registerUser('qa_a');
  const b = await registerUser('qa_b');
  const qa = await api('matchmaking', 'POST', '/matchmaking/queue', { token: a.token });
  const qb = await api('matchmaking', 'POST', '/matchmaking/queue', { token: b.token });
  if (qa.status >= 300 || qb.status >= 300) throw new Error(`queue failed ${qa.status}/${qb.status}`);
  const matchId = await waitFor(async () => {
    const s = await api('matchmaking', 'GET', '/matchmaking/status', { token: a.token });
    return findKey(s.body, 'matchId') ?? s.body?.match?.id ?? undefined;
  });
  return { a, b, matchId: String(matchId) };
}

export async function leaveQueue(...users: TestUser[]) {
  for (const u of users) await api('matchmaking', 'DELETE', '/matchmaking/queue', { token: u.token });
}

/** Тестэд модератор хэрэгтэй: DB дотор role-ыг шууд солино (docker compose шаардана). */
export function dockerAvailable(): boolean {
  try { execSync('docker compose version', { stdio: 'ignore' }); return true; } catch { return false; }
}
export function promoteToModerator(username: string) {
  const svc = process.env.PG_SERVICE ?? 'postgres';
  const cwd = process.env.REPO_DIR ?? '..';
  const sql = `UPDATE auth."User" SET role='MODERATOR' WHERE username='${username}';`;
  execSync(`docker compose exec -T ${svc} psql -U mlbb -d mlbb_play -c "${sql.replace(/"/g, '\\"')}"`, { cwd, stdio: 'pipe' });
}
