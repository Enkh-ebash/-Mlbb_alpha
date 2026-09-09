import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4009;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ service: "notification-service", status: "ok" }));

// TODO: mount routes here as this service is filled in

app.listen(PORT, () => {
  console.log(`notification-service listening on port ${PORT}`);
});
