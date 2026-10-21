import { describe, it, expect } from 'vitest';
import { api, registerUser, findKey } from './helpers';

describe('auth-service', () => {
  it('амжилттай бүртгэл: токен ба хэрэглэгч буцаана', async () => {
    const u = await registerUser('qa_reg');
    expect(u.token.split('.')).toHaveLength(3);          // JWT бүтэц
  });

  it('нууц үг хариунд ил гарахгүй', async () => {
    const u = await registerUser('qa_pw');
    const r = await api('auth', 'GET', '/auth/me', { token: u.token });
    expect(JSON.stringify(r.body)).not.toContain(u.password);
    expect(JSON.stringify(r.body)).not.toMatch(/passwordHash/i);
  });

  it('давхар username/email-ийг татгалзана', async () => {
    const u = await registerUser('qa_dup');
    const r = await api('auth', 'POST', '/auth/register', {
      body: { username: u.username, email: u.email, password: u.password },
    });
    expect([400, 409]).toContain(r.status);
  });

  it.each([
    ['богино нууц үг', { username: 'qa_short', email: 'short@test.mn', password: '123' }],
    ['буруу имэйл', { username: 'qa_mail', email: 'not-an-email', password: 'Passw0rd123' }],
    ['богино username', { username: 'ab', email: 'ab@test.mn', password: 'Passw0rd123' }],
    ['хоосон бие', {}],
  ])('валидаци: %s → 400', async (_n, body) => {
    const r = await api('auth', 'POST', '/auth/register', { body });
    expect(r.status).toBe(400);
  });

  it('зөв нууц үгээр нэвтэрнэ', async () => {
    const u = await registerUser('qa_login');
    const r = await api('auth', 'POST', '/auth/login', { body: { email: u.email, password: u.password } });
    expect(r.status).toBe(200);
    expect(findKey(r.body, 'token') ?? findKey(r.body, 'accessToken')).toBeTruthy();
  });

  it('буруу нууц үгээр нэвтрэхгүй (401)', async () => {
    const u = await registerUser('qa_bad');
    const r = await api('auth', 'POST', '/auth/login', { body: { email: u.email, password: 'WrongPass999' } });
    expect(r.status).toBe(401);
  });

  it('/auth/me: токенгүй 401, хуурамч токен 401, зөв токен 200', async () => {
    const u = await registerUser('qa_me');
    expect((await api('auth', 'GET', '/auth/me')).status).toBe(401);
    expect((await api('auth', 'GET', '/auth/me', { token: 'aaa.bbb.ccc' })).status).toBe(401);
    const ok = await api('auth', 'GET', '/auth/me', { token: u.token });
    expect(ok.status).toBe(200);
    expect(findKey(ok.body, 'email')).toBe(u.email);
  });

  it('шинэ тоглогчийн Elo = 1000', async () => {
    const u = await registerUser('qa_elo');
    const r = await api('auth', 'GET', '/auth/me', { token: u.token });
    expect(Number(findKey(r.body, 'eloRating'))).toBe(1000);
  });

  it('leaderboard нийтэд нээлттэй, limit-ийг хүндэтгэнэ', async () => {
    const r = await api('auth', 'GET', '/auth/leaderboard?limit=3');
    expect(r.status).toBe(200);
    const list = Array.isArray(r.body) ? r.body : (findKey(r.body, 'leaderboard') ?? findKey(r.body, 'users') ?? []);
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeLessThanOrEqual(3);
  });
});
