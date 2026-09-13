import { Request, Response } from "express";
import { prisma } from "../config/db";
import { getUserElo, setUserElo } from "../services/auth-client";
import {
  BASE_K,
  expectedScore,
  eloDelta,
  weightedScore,
  performanceMultiplier,
  updateBaseline,
} from "../services/elo-math";

interface PlayerStatInput {
  userId: string;
  kills: number;
  deaths: number;
  assists: number;
  isMvp: boolean;
}

interface ApplyResultBody {
  matchId: string;
  matchType: string;
  winnerId: string;
  playerAId: string;
  playerBId: string;
  stats: PlayerStatInput[];
}

const BASELINE_KEY = "global";

async function getBaseline() {
  return prisma.performanceBaseline.upsert({
    where: { key: BASELINE_KEY },
    update: {},
    create: { key: BASELINE_KEY, avgWeightedScore: 5.0, sampleSize: 0 },
  });
}

async function applyForPlayer(params: {
  userId: string;
  opponentId: string;
  won: boolean;
  matchId: string;
  stat?: PlayerStatInput;
}) {
  const { userId, opponentId, won, matchId, stat } = params;

  const [myElo, opponentElo] = await Promise.all([getUserElo(userId), getUserElo(opponentId)]);

  const expected = expectedScore(myElo, opponentElo);
  const actual = won ? 1 : 0;
  const baseDelta = eloDelta(BASE_K, actual, expected);

  let multiplier = 1;
  if (stat) {
    const baseline = await getBaseline();
    const score = weightedScore(stat.kills, stat.deaths, stat.assists);
    multiplier = performanceMultiplier(score, baseline.avgWeightedScore, stat.isMvp);

    const updated = updateBaseline(baseline.avgWeightedScore, baseline.sampleSize, score);
    await prisma.performanceBaseline.update({
      where: { key: BASELINE_KEY },
      data: { avgWeightedScore: updated.avg, sampleSize: updated.sampleSize },
    });
  }

  const finalDelta = Math.round(baseDelta * multiplier);
  const newElo = Math.max(0, myElo + finalDelta);

  await setUserElo(userId, newElo);

  await prisma.eloHistory.create({
    data: { userId, matchId, eloBefore: myElo, eloAfter: newElo, delta: finalDelta },
  });

  return { userId, eloBefore: myElo, eloAfter: newElo, delta: finalDelta, multiplier };
}

export async function applyResult(req: Request, res: Response) {
  const { matchId, winnerId, playerAId, playerBId, stats } = req.body as ApplyResultBody;

  if (!matchId || !winnerId || !playerAId || !playerBId) {
    return res.status(400).json({ error: "matchId, winnerId, playerAId, playerBId are required" });
  }

  const statByUser = new Map((stats ?? []).map((s) => [s.userId, s]));

  try {
    // Ensure the baseline row exists BEFORE the two applyForPlayer calls run
    // concurrently below — otherwise both can race to INSERT the same "global"
    // key at once, and Postgres rejects the loser with a unique constraint
    // error (P2002), silently dropping that player's Elo update.
    await getBaseline();

    const [resultA, resultB] = await Promise.all([
      applyForPlayer({
        userId: playerAId,
        opponentId: playerBId,
        won: winnerId === playerAId,
        matchId,
        stat: statByUser.get(playerAId),
      }),
      applyForPlayer({
        userId: playerBId,
        opponentId: playerAId,
        won: winnerId === playerBId,
        matchId,
        stat: statByUser.get(playerBId),
      }),
    ]);

    return res.json({ matchId, players: [resultA, resultB] });
  } catch (err) {
    console.error("elo-service: failed to apply result:", err);
    return res.status(502).json({ error: "Failed to apply result (auth-service unreachable?)" });
  }
}
