import "dotenv/config";
import express from "express";
import cors from "cors";
import { teamRouter } from "./routes/team.routes";

// Without this, an unhandled promise rejection in any async handler crashes
// the whole process instead of just failing that one request.
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

const app = express();
const PORT = process.env.PORT || 4006;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ service: "team-service", status: "ok" }));

app.use("/teams", teamRouter);

app.listen(PORT, () => {
  console.log(`team-service listening on port ${PORT}`);
});
