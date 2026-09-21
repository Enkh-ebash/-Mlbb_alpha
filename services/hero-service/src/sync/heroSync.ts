import { prisma } from "../config/db";

// IMPORTANT: the exact base URL for this specific API fork
// (api-mobilelegends.vercel.app, per the project's README) could not be
// verified from this environment — its network isn't reachable from here.
// The field shapes below (main_heroid, main_hero.data.name,
// main_hero_win_rate, etc.) ARE verified against a live sibling fork's
// OpenAPI schema (rone-arena-api, same fork family, same underlying MLBB
// data source), so the parsing logic should be correct even if the base
// URL needs adjusting. If sync logs "0 records" or 404s, check this URL
// first — override it with the HERO_API_BASE_URL env var without touching
// code.
const HERO_API_BASE_URL = process.env.HERO_API_BASE_URL || "https://api-mobilelegends.vercel.app/api";

interface HeroRankRecord {
  data: {
    main_heroid: number;
    main_hero: { data: { name: string; head?: string } };
    main_hero_win_rate?: number;
    main_hero_ban_rate?: number;
    main_hero_appearance_rate?: number;
  };
}

interface HeroRankResponse {
  data?: { records?: HeroRankRecord[] };
}

export async function syncHeroes(): Promise<void> {
  try {
    const res = await fetch(`${HERO_API_BASE_URL}/heroes/rank?days=7&rank=all&size=150`);
    if (!res.ok) {
      console.error(`hero-service: sync fetch failed with status ${res.status}`);
      return;
    }

    const json = (await res.json()) as HeroRankResponse;
    const records = json?.data?.records ?? [];

    if (records.length === 0) {
      console.warn(
        "hero-service: sync got 0 records — check HERO_API_BASE_URL or the response shape (API may have changed)"
      );
      return;
    }

    let synced = 0;
    for (const record of records) {
      const d = record.data;
      if (!d?.main_heroid || !d.main_hero?.data?.name) continue;

      await prisma.hero.upsert({
        where: { externalId: d.main_heroid },
        update: {
          name: d.main_hero.data.name,
          imageUrl: d.main_hero.data.head,
          winRate: d.main_hero_win_rate,
          banRate: d.main_hero_ban_rate,
          pickRate: d.main_hero_appearance_rate,
        },
        create: {
          externalId: d.main_heroid,
          name: d.main_hero.data.name,
          imageUrl: d.main_hero.data.head,
          winRate: d.main_hero_win_rate,
          banRate: d.main_hero_ban_rate,
          pickRate: d.main_hero_appearance_rate,
        },
      });
      synced++;
    }

    console.log(`hero-service: synced ${synced} heroes`);
  } catch (err) {
    // Network hiccups or an API shape change should never crash the service
    // — just log and try again on the next scheduled sync.
    console.error("hero-service: sync failed:", err);
  }
}

const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // once a day

export function startHeroSyncJob() {
  // First sync shortly after boot, not instantly — give the container a
  // moment to settle — then repeat on the interval.
  setTimeout(() => syncHeroes(), 5_000);
  setInterval(() => syncHeroes(), SYNC_INTERVAL_MS);
  console.log(`hero-service: sync job scheduled (every ${SYNC_INTERVAL_MS / 3_600_000}h)`);
}
