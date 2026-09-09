import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ service: "auth-service", status: "ok" }));

app.use("/auth", authRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`auth-service listening on port ${PORT}`);
});
