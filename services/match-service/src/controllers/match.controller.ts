import { Response } from "express";
import { prisma } from "../config/db";
import { AuthedRequest } from "../middleware/auth.middleware";
import { notifyEloService } from "../services/elo-client";

export async function createMatch(req: AuthedRequest, res: Response) {
  const { matchType, playerAId, playerBId, matchId } = req.body as {
    matchType?: "SOLO_1V1" | "TEAM_5V5";
    playerAId: string;
    playerBId: string;
    matchId?: string; // optional: reuse the id matchmaking-service already generated
  };

  if (!playerAId || !playerBId) {
    return res.status(400).json({ error: "playerAId and playerBId are required" });
  }

  const match = await prisma.match.create({
    data: {
      id: matchId,
      matchType: matchType ?? "SOLO_1V1",
      playerAId,
      playerBId,
      status: "PENDING",
    },
  });

  return res.status(201).json(match);
}

export async function getMatch(req: AuthedRequest, res: Response) {
  const { id } = req.params;
  const match = await prisma.match.findUnique({
    where: { id },
    include: { result: { include: { review: true } }, stats: true },
  });
  if (!match) return res.status(404).json({ error: "Match not found" });
  return res.json(match);
}

export async function setRoomCode(req: AuthedRequest, res: Response) {
  const { id } = req.params;
  const { roomCode } = req.body as { roomCode: string };
  if (!roomCode) return res.status(400).json({ error: "roomCode is required" });

  const match = await prisma.match.update({
    where: { id },
    data: { roomCode, status: "ONGOING" },
  });
  return res.json(match);
}

interface StatInput {
  userId: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  isMvp?: boolean;
  heroId?: string;
}

export async function submitResult(req: AuthedRequest, res: Response) {
  const { id } = req.params;
  const { winnerId, scoreA, scoreB, screenshotUrl, stats } = req.body as {
    winnerId: string;
    scoreA?: number;
    scoreB?: number;
    screenshotUrl?: string;
    stats?: StatInput[];
  };

  if (!winnerId) return res.status(400).json({ error: "winnerId is required" });

  const match = await prisma.match.findUnique({ where: { id }, include: { result: true } });
  if (!match) return res.status(404).json({ error: "Match not found" });

  if (match.result) {
    // A result already exists. If the new submission disagrees, flag as disputed
    // instead of silently overwriting — a moderator needs to look at it.
    if (match.result.winnerId !== winnerId) {
      await prisma.match.update({ where: { id }, data: { status: "DISPUTED" } });
      return res.status(409).json({
        error: "Conflicting result already submitted — match marked as disputed for moderator review",
      });
    }
    return res.status(409).json({ error: "Result already submitted for this match" });
  }

  const result = await prisma.matchResult.create({
    data: {
      matchId: id,
      winnerId,
      scoreA,
      scoreB,
      screenshotUrl,
      submittedBy: req.userId!,
      status: "PENDING",
    },
  });

  if (stats && stats.length > 0) {
    await prisma.matchPlayerStat.createMany({
      data: stats.map((s) => ({
        matchId: id,
        userId: s.userId,
        kills: s.kills ?? 0,
        deaths: s.deaths ?? 0,
        assists: s.assists ?? 0,
        isMvp: s.isMvp ?? false,
        heroId: s.heroId,
      })),
    });
  }

  await prisma.match.update({ where: { id }, data: { status: "COMPLETED" } });

  return res.status(201).json(result);
}

export async function listPendingResults(_req: AuthedRequest, res: Response) {
  const results = await prisma.matchResult.findMany({
    where: { status: "PENDING" },
    include: { match: { include: { stats: true } } },
    orderBy: { submittedAt: "asc" },
  });
  return res.json(results);
}

export async function reviewResult(req: AuthedRequest, res: Response) {
  const { resultId } = req.params;
  const { decision, notes } = req.body as { decision: "APPROVED" | "REJECTED"; notes?: string };

  if (decision !== "APPROVED" && decision !== "REJECTED") {
    return res.status(400).json({ error: "decision must be APPROVED or REJECTED" });
  }

  const result = await prisma.matchResult.findUnique({
    where: { id: resultId },
    include: { match: { include: { stats: true } } },
  });
  if (!result) return res.status(404).json({ error: "Result not found" });

  const review = await prisma.moderatorReview.create({
    data: {
      matchResultId: resultId,
      moderatorId: req.userId!,
      decision,
      notes,
    },
  });

  await prisma.matchResult.update({ where: { id: resultId }, data: { status: decision } });

  if (decision === "APPROVED") {
    await notifyEloService({
      matchId: result.matchId,
      matchType: result.match.matchType,
      winnerId: result.winnerId,
      playerAId: result.match.playerAId,
      playerBId: result.match.playerBId,
      stats: result.match.stats.map((s: (typeof result.match.stats)[number]) => ({
        userId: s.userId,
        kills: s.kills,
        deaths: s.deaths,
        assists: s.assists,
        isMvp: s.isMvp,
      })),
    });
  } else {
    await prisma.match.update({ where: { id: result.matchId }, data: { status: "DISPUTED" } });
  }

  return res.json(review);
}
