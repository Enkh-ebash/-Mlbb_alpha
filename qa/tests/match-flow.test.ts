import { describe, it, expect } from 'vitest';
import {
  api, pairPlayers, getElo, findKey, registerUser, dockerAvailable, promoteToModerator, waitFor,
} from './helpers';

describe('matchmaking → match → голосолт → Elo (end-to-end)', () => {
  it('хоёр тоглогч хосолж, матч үүснэ', async () => {
    const { a, b, matchId } = await pairPlayers();
    const r = await api('match', 'GET', `/matches/${matchId}`, { token: a.token });
    expect(r.status).toBe(200);
    const ids = [findKey(r.body, 'playerAId'), findKey(r.body, 'playerBId')];
    expect(ids).toContain(a.id);
    expect(ids).toContain(b.id);
    // нөгөө тоглогч мөн адил матчаа харна
    const sb = await api('matchmaking', 'GET', '/matchmaking/status', { token: b.token });
    expect(String(findKey(sb.body, 'matchId'))).toBe(matchId);
  });

  it('оролцогч өрөөний код оруулна', async () => {
    const { a, matchId } = await pairPlayers();
    const r = await api('match', 'PATCH', `/matches/${matchId}/room-code`, { token: a.token, body: { roomCode: 'ABC123' } });
    expect(r.status).toBeLessThan(300);
    const m = await api('match', 'GET', `/matches/${matchId}`, { token: a.token });
    expect(findKey(m.body, 'roomCode')).toBe('ABC123');
  });

  it('гуравдагч этгээд санал өгөх боломжгүй (403)', async () => {
    const { a, matchId } = await pairPlayers();
    const stranger = await registerUser('qa_x');
    const r = await api('match', 'POST', `/matches/${matchId}/result`, { token: stranger.token, body: { winnerId: a.id } });
    expect(r.status).toBe(403);
  });

  it('ижил санал → автоматаар батлагдаж, Elo ялагчид нэмэгдэж, ялагдагчид буурна', async () => {
    const { a, b, matchId } = await pairPlayers();
    const [eloA0, eloB0] = [await getElo(a), await getElo(b)];

    const v1 = await api('match', 'POST', `/matches/${matchId}/result`, { token: a.token, body: { winnerId: a.id } });
    expect(v1.status).toBeLessThan(300);
    const v2 = await api('match', 'POST', `/matches/${matchId}/result`, { token: b.token, body: { winnerId: a.id } });
    expect(v2.status).toBeLessThan(300);

    // Elo шинэчлэлт асинхрон байж болох тул хүлээнэ
    await waitFor(async () => ((await getElo(a)) !== eloA0 ? true : undefined), 20_000);
    const [eloA1, eloB1] = [await getElo(a), await getElo(b)];
    expect(eloA1).toBeGreaterThan(eloA0);
    expect(eloB1).toBeLessThan(eloB0);
  });

  it('хаагдсан матчид дахин санал өгөх 409', async () => {
    const { a, b, matchId } = await pairPlayers();
    await api('match', 'POST', `/matches/${matchId}/result`, { token: a.token, body: { winnerId: a.id } });
    await api('match', 'POST', `/matches/${matchId}/result`, { token: b.token, body: { winnerId: a.id } });
    const late = await api('match', 'POST', `/matches/${matchId}/result`, { token: a.token, body: { winnerId: b.id } });
    expect(late.status).toBe(409);
  });

  it.skipIf(!dockerAvailable())('санал зөрвөл маргаан → модераторын жагсаалтад гарна', async () => {
    const { a, b, matchId } = await pairPlayers();
    await api('match', 'POST', `/matches/${matchId}/result`, { token: a.token, body: { winnerId: a.id } });
    await api('match', 'POST', `/matches/${matchId}/result`, { token: b.token, body: { winnerId: b.id } });

    const mod = await registerUser('qa_mod');
    promoteToModerator(mod.username);
    const pending = await api('match', 'GET', '/matches/results/pending', { token: mod.token });
    expect(pending.status).toBe(200);
    expect(JSON.stringify(pending.body)).toContain(matchId);

    // энгийн тоглогч модераторын жагсаалтыг харж болохгүй
    const denied = await api('match', 'GET', '/matches/results/pending', { token: a.token });
    expect(denied.status).toBe(403);
  });
});
