import { Router } from "express";
import {
  createMatch,
  getMatch,
  setRoomCode,
  submitResult,
  listPendingResults,
  reviewResult,
} from "../controllers/match.controller";
import { requireAuth, requireModerator } from "../middleware/auth.middleware";

export const matchRouter = Router();

matchRouter.post("/", requireAuth, createMatch);
matchRouter.get("/:id", requireAuth, getMatch);
matchRouter.patch("/:id/room-code", requireAuth, setRoomCode);
matchRouter.post("/:id/result", requireAuth, submitResult);

matchRouter.get("/results/pending", requireAuth, requireModerator, listPendingResults);
matchRouter.post("/results/:resultId/review", requireAuth, requireModerator, reviewResult);
