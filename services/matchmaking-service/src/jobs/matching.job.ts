import { randomUUID } from "crypto";
import { prisma } from "../config/db";

const TICK_MS = 5_000;
const BASE_WINDOW = 50; // ± MMR at queue time
const EXPAND_RATE_PER_SEC = 5; // window grows by this much per second waited

function currentWindow(queuedAt: Date): number {
  const elapsedSeconds = (Date.now() - queuedAt.getTime()) / 1000;
  return BASE_WINDOW + elapsedSeconds * EXPAND_RATE_PER_SEC;
}

async function runMatchingTick() {
  const waiting = await prisma.queueEntry.findMany({
    where: { status: "SEARCHING" },
    orderBy: { queuedAt: "asc" },
  });

  const paired = new Set<string>();

  for (let i = 0; i < waiting.length; i++) {
    const a = waiting[i];
    if (paired.has(a.id)) continue;

    let bestMatch: (typeof waiting)[number] | null = null;
    let bestDiff = Infinity;

    for (let j = i + 1; j < waiting.length; j++) {
      const b = waiting[j];
      if (paired.has(b.id)) continue;

      const diff = Math.abs(a.mmr - b.mmr);
      const window = Math.min(currentWindow(a.queuedAt), currentWindow(b.queuedAt));

      if (diff <= window && diff < bestDiff) {
        bestMatch = b;
        bestDiff = diff;
      }
    }

    if (bestMatch) {
      const matchId = randomUUID();
      const matchedAt = new Date();

      await prisma.$transaction([
        prisma.queueEntry.update({
          where: { id: a.id },
          data: { status: "MATCHED", matchedWith: bestMatch.userId, matchId, matchedAt },
        }),
        prisma.queueEntry.update({
          where: { id: bestMatch.id },
          data: { status: "MATCHED", matchedWith: a.userId, matchId, matchedAt },
        }),
      ]);

      paired.add(a.id);
      paired.add(bestMatch.id);

      console.log(
        `matchmaking: paired ${a.userId} (mmr ${a.mmr}) with ${bestMatch.userId} (mmr ${bestMatch.mmr}), diff ${bestDiff}, matchId ${matchId}`
      );
    }
  }
}

export function startMatchingJob() {
  setInterval(() => {
    runMatchingTick().catch((err) => console.error("matchmaking tick failed:", err));
  }, TICK_MS);
  console.log(`matchmaking-service: matching job started (tick every ${TICK_MS}ms)`);
}
