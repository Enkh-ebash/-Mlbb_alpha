import { describe, it, expect } from 'vitest';
import { api, pairPlayers, registerUser, getElo } from './helpers';

/**
 * ИЛЭРСЭН ДЕФЕКТҮҮД (AI_CONTEXT.md §11).
 * it.fails — дефект оршин байгаа хугацаанд тест "ногоон" (хүлээгдсэн унал).
 * Дефектийг засмагц тест улаан болно → `it.fails`-ийг `it` болгож өөрчил.
 */
describe('Аюулгүй байдал: илэрсэн дефектүүд', () => {
  it.fails('#3: /internal/* маршрут гаднаас токен/түлхүүргүйгээр хаалттай байх ёстой', async () => {
    const victim = await registerUser('qa_victim');
    const r = await api('auth', 'PATCH', `/internal/users/${victim.id}/elo`, { body: { eloRating: 9999 } });
    expect([401, 403, 404]).toContain(r.status);
    expect(await getElo(victim)).toBe(1000);
  });

  it.fails('#2: матчийн оролцогч биш хүн өрөөний кодыг өөрчилж болохгүй (403)', async () => {
    const { matchId } = await pairPlayers();
    const stranger = await registerUser('qa_intruder');
    const r = await api('match', 'PATCH', `/matches/${matchId}/room-code`, { token: stranger.token, body: { roomCode: 'HACKED' } });
    expect(r.status).toBe(403);
  });

  it.fails('#2: оролцогч биш хүн чужой матчийн мэдээллийг харж болохгүй (403)', async () => {
    const { matchId } = await pairPlayers();
    const stranger = await registerUser('qa_peek');
    const r = await api('match', 'GET', `/matches/${matchId}`, { token: stranger.token });
    expect(r.status).toBe(403);
  });
});
