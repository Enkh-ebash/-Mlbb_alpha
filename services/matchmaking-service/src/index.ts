import "dotenv/config";
import express from "express";
import cors from "cors";
import { matchmakingRouter } from "./routes/matchmaking.routes";
import { startMatchingJob } from "./jobs/matching.job";

// Without this, an unhandled promise rejection in any async route handler
// (e.g. a Prisma error) crashes the whole process instead of just failing
// that one request.
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

const app = express();
const PORT = process.env.PORT || 4002;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ service: "matchmaking-service", status: "ok" }));

app.use("/matchmaking", matchmakingRouter);

app.listen(PORT, () => {
  console.log(`matchmaking-service listening on port ${PORT}`);
  startMatchingJob();
});
