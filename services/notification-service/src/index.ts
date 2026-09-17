import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { attachChat } from "./chat/socket";

// Without this, an unhandled promise rejection in any async handler crashes
// the whole process instead of just failing that one request.
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

const app = express();
const PORT = process.env.PORT || 4009;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ service: "notification-service", status: "ok" }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});
attachChat(io);

httpServer.listen(PORT, () => {
  console.log(`notification-service listening on port ${PORT} (http + websocket)`);
});
