import { describe, it, expect } from 'vitest';
import { api, registerUser, findKey } from './helpers';

describe('team-service', () => {
  it('баг үүсгэхэд токен шаардана (401)', async () => {
    const r = await api('team', 'POST', '/teams', { body: { name: 'NoAuth', tag: 'NA' } });
    expect(r.status).toBe(401);
  });

  it('баг үүсгэнэ, нэр давхцахыг татгалзана', async () => {
    const cap = await registerUser('qa_cap');
    const name = `QA ${Date.now().toString(36)}`.slice(0, 20);
    const tag = `Q${Math.floor(Math.random() * 900 + 100)}`;
    const ok = await api('team', 'POST', '/teams', { token: cap.token, body: { name, tag } });
    expect(ok.status).toBeLessThan(300);

    const other = await registerUser('qa_cap2');
    const dup = await api('team', 'POST', '/teams', { token: other.token, body: { name, tag: `Z${tag}`.slice(0, 5) } });
    expect([400, 409]).toContain(dup.status);
  });

  it('нэг тоглогч зөвхөн нэг багт байна', async () => {
    const cap = await registerUser('qa_one');
    const t1 = await api('team', 'POST', '/teams', {
      token: cap.token, body: { name: `A${Date.now().toString(36)}`.slice(0, 20), tag: `A${Math.floor(Math.random() * 90 + 10)}` },
    });
    expect(t1.status).toBeLessThan(300);
    const t2 = await api('team', 'POST', '/teams', {
      token: cap.token, body: { name: `B${Date.now().toString(36)}`.slice(0, 20), tag: `B${Math.floor(Math.random() * 90 + 10)}` },
    });
    expect([400, 409]).toContain(t2.status);
  });

  it('капитан биш хүн гишүүн нэмж болохгүй (403)', async () => {
    const cap = await registerUser('qa_c');
    const intr = await registerUser('qa_i');
    const victim = await registerUser('qa_v');
    const t = await api('team', 'POST', '/teams', {
      token: cap.token, body: { name: `C${Date.now().toString(36)}`.slice(0, 20), tag: `C${Math.floor(Math.random() * 90 + 10)}` },
    });
    const teamId = findKey(t.body, 'id');
    const r = await api('team', 'POST', `/teams/${teamId}/members`, { token: intr.token, body: { userId: victim.id, position: 'GOLD' } });
    expect(r.status).toBe(403);
  });
});

describe('hero-service', () => {
  it('/heroes нийтэд нээлттэй, массив буцаана', async () => {
    const r = await api('hero', 'GET', '/heroes');
    expect(r.status).toBe(200);
    const list = Array.isArray(r.body) ? r.body : (findKey(r.body, 'heroes') ?? []);
    expect(Array.isArray(list)).toBe(true);
  });
});
