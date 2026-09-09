import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4008;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ service: "news-service", status: "ok" }));

// TODO: mount routes here as this service is filled in

app.listen(PORT, () => {
  console.log(`news-service listening on port ${PORT}`);
});
