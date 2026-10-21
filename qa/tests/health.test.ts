import { describe, it, expect } from 'vitest';
import { PORTS, api, Svc } from './helpers';

describe('SMOKE: /health бүх сервис дээр', () => {
  for (const svc of Object.keys(PORTS) as Svc[]) {
    it(`${svc} (${PORTS[svc]}) хариу өгнө`, async () => {
      const r = await api(svc, 'GET', '/health');
      expect(r.status).toBe(200);
      expect(r.body).toMatchObject({ status: 'ok' });
    });
  }
});
