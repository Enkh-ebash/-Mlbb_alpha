import "dotenv/config";
import express from "express";
import cors from "cors";
import { matchRouter } from "./routes/match.routes";
import { internalRouter } from "./routes/internal.routes";

// Without this, an unhandled promise rejection in any async route handler
// (e.g. a Prisma error) crashes the whole process instead of just failing
// that one request.
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

const app = express();
const PORT = process.env.PORT || 4004;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ service: "match-service", status: "ok" }));

app.use("/matches", matchRouter);
app.use("/internal", internalRouter);

app.listen(PORT, () => {
  console.log(`match-service listening on port ${PORT}`);
});
