import { Router } from "express";
import { createTeam, listTeams, getTeam, addMember, removeMember } from "../controllers/team.controller";
import { requireAuth } from "../middleware/auth.middleware";

export const teamRouter = Router();

teamRouter.post("/", requireAuth, createTeam);
teamRouter.get("/", listTeams);
teamRouter.get("/:id", getTeam);
teamRouter.post("/:id/members", requireAuth, addMember);
teamRouter.delete("/:id/members/:userId", requireAuth, removeMember);
