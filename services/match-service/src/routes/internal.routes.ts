import { Router } from "express";
import { createMatch } from "../controllers/match.controller";

// Reachable only from other services on the Docker internal network — same
// caveat as auth-service's and elo-service's /internal/* routes about
// eventually adding a shared internal API key.
export const internalRouter = Router();

internalRouter.post("/matches", createMatch);
