import "dotenv/config";
import express from "express";
import cors from "cors";

// Without this, an unhandled promise rejection in any async route handler
// (e.g. a Prisma error) crashes the whole process instead of just failing
// that one request.
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

const app = express();
const PORT = process.env.PORT || 4005;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ service: "hero-service", status: "ok" }));

// TODO: mount routes here as this service is filled in

app.listen(PORT, () => {
  console.log(`hero-service listening on port ${PORT}`);
});
