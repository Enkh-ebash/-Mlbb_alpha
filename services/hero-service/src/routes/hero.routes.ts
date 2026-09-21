import { Router } from "express";
import { listHeroes, getHero, triggerSync } from "../controllers/hero.controller";

export const heroRouter = Router();

heroRouter.get("/", listHeroes);
heroRouter.get("/:id", getHero);
heroRouter.post("/sync", triggerSync);
