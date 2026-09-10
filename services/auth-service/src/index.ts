import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.routes";
import { internalRouter } from "./routes/internal.routes";
import { errorHandler } from "./middleware/error.middleware";

// Without this, an unhandled promise rejection in any async route handler
// (e.g. a Prisma error) crashes the whole process instead of just failing
// that one request.
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ service: "auth-service", status: "ok" }));

app.use("/auth", authRouter);
app.use("/internal", internalRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`auth-service listening on port ${PORT}`);
});
