import { Router } from "express";
import { getUserElo, setUserElo } from "../controllers/internal.controller";

// NOTE: these routes are meant to be reachable only from other services on the
// Docker internal network (no public port should ever expose them directly in
// production). For a stronger guarantee later, add a shared internal API key
// checked via middleware here.
export const internalRouter = Router();

internalRouter.get("/users/:id", getUserElo);
internalRouter.patch("/users/:id/elo", setUserElo);
