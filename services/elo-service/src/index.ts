import "dotenv/config";
import express from "express";
import cors from "cors";
import { internalRouter } from "./routes/internal.routes";

const app = express();
const PORT = process.env.PORT || 4003;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ service: "elo-service", status: "ok" }));

app.use("/internal", internalRouter);

app.listen(PORT, () => {
  console.log(`elo-service listening on port ${PORT}`);
});
