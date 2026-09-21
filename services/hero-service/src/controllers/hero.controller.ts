import { Request, Response } from "express";
import { prisma } from "../config/db";
import { syncHeroes } from "../sync/heroSync";

export async function listHeroes(_req: Request, res: Response) {
  const heroes = await prisma.hero.findMany({ orderBy: { winRate: "desc" } });
  return res.json(heroes);
}

export async function getHero(req: Request, res: Response) {
  const { id } = req.params;
  const hero = await prisma.hero.findUnique({ where: { id } });
  if (!hero) return res.status(404).json({ error: "Hero not found" });
  return res.json(hero);
}

export async function triggerSync(_req: Request, res: Response) {
  await syncHeroes();
  const count = await prisma.hero.count();
  return res.json({ message: "Sync triggered", heroCount: count });
}
