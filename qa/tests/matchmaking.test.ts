import { describe, it, expect, afterAll } from 'vitest';
import { api, registerUser, leaveQueue, findKey, TestUser } from './helpers';

const created: TestUser[] = [];
afterAll(async () => { await leaveQueue(...created); });

describe('matchmaking-service', () => {
  it('очередь токенгүй 401', async () => {
    expect((await api('matchmaking', 'POST', '/matchmaking/queue')).status).toBe(401);
    expect((await api('matchmaking', 'GET', '/matchmaking/status')).status).toBe(401);
  });

  it('шинэ тоглогчийн төлөв IDLE', async () => {
    const u = await registerUser('qa_idle'); created.push(u);
    const r = await api('matchmaking', 'GET', '/matchmaking/status', { token: u.token });
    expect(r.status).toBe(200);
    expect(JSON.stringify(r.body)).toContain('IDLE');
  });

  it('очередьд орно → SEARCHING, давхар орох 409, гарна → IDLE', async () => {
    const u = await registerUser('qa_q'); created.push(u);
    const first = await api('matchmaking', 'POST', '/matchmaking/queue', { token: u.token });
    expect(first.status).toBeLessThan(300);

    const st = await api('matchmaking', 'GET', '/matchmaking/status', { token: u.token });
    expect(JSON.stringify(st.body)).toMatch(/SEARCHING|MATCHED/);

    const again = await api('matchmaking', 'POST', '/matchmaking/queue', { token: u.token });
    expect(again.status).toBe(409);

    const del = await api('matchmaking', 'DELETE', '/matchmaking/queue', { token: u.token });
    expect(del.status).toBeLessThan(300);
    const after = await api('matchmaking', 'GET', '/matchmaking/status', { token: u.token });
    expect(JSON.stringify(after.body)).toContain('IDLE');
    expect(findKey(after.body, 'matchId') ?? null).toBeNull();
  });
});
