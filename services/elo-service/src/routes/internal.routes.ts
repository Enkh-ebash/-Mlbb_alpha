import { Router } from "express";
import { applyResult } from "../controllers/elo.controller";

// Reachable only from other services on the Docker internal network (see the
// same note in auth-service's internal.routes.ts about adding a shared key).
export const internalRouter = Router();

internalRouter.post("/apply-result", applyResult);
