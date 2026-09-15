import { Request, Response } from "express";
import { prisma } from "../config/db";

export async function getUserElo(req: Request, res: Response) {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ id: user.id, eloRating: user.eloRating });
}

export async function setUserElo(req: Request, res: Response) {
  const { id } = req.params;
  const { eloRating } = req.body as { eloRating: number };
  if (typeof eloRating !== "number") {
    return res.status(400).json({ error: "eloRating must be a number" });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { eloRating: Math.max(0, Math.round(eloRating)) },
  });
  return res.json({ id: user.id, eloRating: user.eloRating });
}

export async function getUsersCount(_req: Request, res: Response) {
  const count = await prisma.user.count();
  return res.json({ count });
}
