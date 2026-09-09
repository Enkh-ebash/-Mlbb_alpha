import "dotenv/config";
import express from "express";
import cors from "cors";
import { matchRouter } from "./routes/match.routes";
import { internalRouter } from "./routes/internal.routes";

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
