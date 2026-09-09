import { Router } from "express";
import { joinQueue, leaveQueue, queueStatus } from "../controllers/matchmaking.controller";
import { requireAuth } from "../middleware/auth.middleware";

export const matchmakingRouter = Router();

matchmakingRouter.post("/queue", requireAuth, joinQueue);
matchmakingRouter.delete("/queue", requireAuth, leaveQueue);
matchmakingRouter.get("/status", requireAuth, queueStatus);
