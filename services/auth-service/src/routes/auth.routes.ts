import { Router } from "express";
import { register, login, me, linkMlbbProfile } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", requireAuth, me);
authRouter.post("/mlbb-link", requireAuth, linkMlbbProfile);
