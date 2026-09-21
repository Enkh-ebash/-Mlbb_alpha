import { Response } from "express";
import { prisma } from "../config/db";
import { AuthedRequest } from "../middleware/auth.middleware";

const MAX_STARTERS = 5;
const MAX_SUBSTITUTES = 1;

export async function createTeam(req: AuthedRequest, res: Response) {
  const { name, tag, region } = req.body as { name: string; tag: string; region?: string };
  const userId = req.userId!;

  if (!name || !tag) {
    return res.status(400).json({ error: "name and tag are required" });
  }

  try {
    const team = await prisma.team.create({
      data: {
        name,
        tag,
        region,
        captainUserId: userId,
        members: {
          create: { userId, status: "STARTER" },
        },
      },
      include: { members: true },
    });
    return res.status(201).json(team);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "P2002") {
      return res.status(409).json({
        error: "Баг үүсгэж чадсангүй — нэр/tag аль хэдийн авагдсан, эсвэл та өөр багт багтсан байна.",
      });
    }
    throw err;
  }
}

export async function listTeams(_req: AuthedRequest, res: Response) {
  const teams = await prisma.team.findMany({
    orderBy: { eloRating: "desc" },
    include: { _count: { select: { members: true } } },
  });
  return res.json(teams);
}

export async function getTeam(req: AuthedRequest, res: Response) {
  const { id } = req.params;
  const team = await prisma.team.findUnique({
    where: { id },
    include: { members: true },
  });
  if (!team) return res.status(404).json({ error: "Team not found" });
  return res.json(team);
}

export async function addMember(req: AuthedRequest, res: Response) {
  const { id } = req.params;
  const { userId: targetUserId, status, position } = req.body as {
    userId: string;
    status?: "STARTER" | "SUBSTITUTE";
    position?: "GOLD" | "JUNGLE" | "MID" | "EXP" | "ROAM";
  };

  if (!targetUserId) return res.status(400).json({ error: "userId is required" });

  const team = await prisma.team.findUnique({ where: { id }, include: { members: true } });
  if (!team) return res.status(404).json({ error: "Team not found" });

  if (team.captainUserId !== req.userId) {
    return res.status(403).json({ error: "Зөвхөн багийн ахлагч гишүүн нэмж чадна." });
  }

  const memberStatus = status ?? "STARTER";
  const starterCount = team.members.filter((m: (typeof team.members)[number]) => m.status === "STARTER").length;
  const substituteCount = team.members.filter((m: (typeof team.members)[number]) => m.status === "SUBSTITUTE").length;

  if (memberStatus === "STARTER" && starterCount >= MAX_STARTERS) {
    return res.status(409).json({ error: `Баг аль хэдийн ${MAX_STARTERS} үндсэн тоглогчтой.` });
  }
  if (memberStatus === "SUBSTITUTE" && substituteCount >= MAX_SUBSTITUTES) {
    return res.status(409).json({ error: `Баг аль хэдийн ${MAX_SUBSTITUTES} сэлгээтэй.` });
  }

  try {
    const member = await prisma.teamMember.create({
      data: { teamId: id, userId: targetUserId, status: memberStatus, position },
    });
    return res.status(201).json(member);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "P2002") {
      return res.status(409).json({ error: "Энэ тоглогч аль хэдийн өөр багт багтсан байна." });
    }
    throw err;
  }
}

export async function removeMember(req: AuthedRequest, res: Response) {
  const { id, userId: targetUserId } = req.params;
  const requesterId = req.userId!;

  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) return res.status(404).json({ error: "Team not found" });

  const isCaptain = team.captainUserId === requesterId;
  const isSelf = requesterId === targetUserId;

  if (!isCaptain && !isSelf) {
    return res.status(403).json({ error: "Зөвхөн ахлагч эсвэл өөрөө л гарч болно." });
  }

  if (targetUserId === team.captainUserId) {
    return res.status(400).json({
      error: "Ахлагч энэ аргаар гарч чадахгүй — багийг татан буулгах эсвэл ахлагчийг шилжүүлэх шаардлагатай.",
    });
  }

  await prisma.teamMember.deleteMany({ where: { teamId: id, userId: targetUserId } });
  return res.status(204).send();
}
