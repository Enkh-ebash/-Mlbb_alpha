import "dotenv/config";
import express from "express";
import cors from "cors";
import { heroRouter } from "./routes/hero.routes";
import { startHeroSyncJob } from "./sync/heroSync";

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

const app = express();
const PORT = process.env.PORT || 4005;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ service: "hero-service", status: "ok" }));

app.use("/heroes", heroRouter);

app.listen(PORT, () => {
  console.log(`hero-service listening on port ${PORT}`);
  startHeroSyncJob();
});
