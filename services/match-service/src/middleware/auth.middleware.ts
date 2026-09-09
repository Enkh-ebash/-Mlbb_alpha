import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:4001";

export interface AuthedRequest extends Request {
  userId?: string;
  authToken?: string;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = payload.userId;
    req.authToken = token;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export async function requireModerator(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const meRes = await fetch(`${AUTH_SERVICE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${req.authToken}` },
    });
    if (!meRes.ok) {
      return res.status(502).json({ error: "Could not verify role with auth-service" });
    }
    const me = (await meRes.json()) as { role: string };
    if (me.role !== "MODERATOR" && me.role !== "ADMIN") {
      return res.status(403).json({ error: "Moderator or admin role required" });
    }
    next();
  } catch {
    return res.status(502).json({ error: "Could not reach auth-service" });
  }
}
