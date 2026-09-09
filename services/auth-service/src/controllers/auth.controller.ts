import { Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../config/db";
import { AuthedRequest } from "../middleware/auth.middleware";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const TOKEN_TTL = "7d";

function signToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

const registerSchema = z.object({
  username: z.string().min(3).max(24),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function register(req: AuthedRequest, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { username, email, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    return res.status(409).json({ error: "Username or email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { username, email, passwordHash },
  });

  const token = signToken(user.id);
  return res.status(201).json({
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role },
  });
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(req: AuthedRequest, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken(user.id);
  return res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role },
  });
}

export async function me(req: AuthedRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { mlbbProfile: true },
  });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const { passwordHash: _omit, ...safeUser } = user;
  return res.json(safeUser);
}

const mlbbLinkSchema = z.object({
  mlbbId: z.string().min(1),
  zoneId: z.string().min(1),
  inGameName: z.string().min(1),
});

export async function linkMlbbProfile(req: AuthedRequest, res: Response) {
  const parsed = mlbbLinkSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { mlbbId, zoneId, inGameName } = parsed.data;

  const profile = await prisma.mlbbProfile.upsert({
    where: { userId: req.userId! },
    update: { mlbbId, zoneId, inGameName },
    create: { userId: req.userId!, mlbbId, zoneId, inGameName },
  });

  return res.json(profile);
}
