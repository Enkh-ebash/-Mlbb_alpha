import { Response } from "express";
import { prisma } from "../config/db";
import { AuthedRequest } from "../middleware/auth.middleware";
import { fetchCurrentMmr } from "../services/auth-client";

export async function joinQueue(req: AuthedRequest, res: Response) {
  const userId = req.userId!;

  const existing = await prisma.queueEntry.findFirst({
    where: { userId, status: "SEARCHING" },
  });
  if (existing) {
    return res.status(409).json({ error: "Already searching for a match", entry: existing });
  }

  let mmr: number;
  try {
    mmr = await fetchCurrentMmr(req.authToken!);
  } catch (err) {
    return res.status(502).json({ error: "Could not reach auth-service to fetch MMR" });
  }

  const entry = await prisma.queueEntry.create({
    data: { userId, mmr, status: "SEARCHING" },
  });

  return res.status(201).json(entry);
}

export async function leaveQueue(req: AuthedRequest, res: Response) {
  const userId = req.userId!;

  const entry = await prisma.queueEntry.findFirst({
    where: { userId, status: "SEARCHING" },
  });
  if (!entry) {
    return res.status(404).json({ error: "Not currently in queue" });
  }

  const updated = await prisma.queueEntry.update({
    where: { id: entry.id },
    data: { status: "CANCELLED" },
  });

  return res.json(updated);
}

export async function queueStatus(req: AuthedRequest, res: Response) {
  const userId = req.userId!;

  const entry = await prisma.queueEntry.findFirst({
    where: { userId, status: { in: ["SEARCHING", "MATCHED"] } },
    orderBy: { queuedAt: "desc" },
  });

  if (!entry) {
    return res.json({ status: "IDLE" });
  }

  return res.json(entry);
}
