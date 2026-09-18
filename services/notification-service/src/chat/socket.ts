import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { redis } from "./redis";
import { fetchMatch } from "./matchClient";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

// Chat is only open for this long after a match is created — long enough to
// swap the MLBB room code and coordinate, not meant to be a persistent chat.
const CHAT_WINDOW_MS = 40 * 60 * 1000;
const CHAT_WINDOW_SECONDS = CHAT_WINDOW_MS / 1000;
const MAX_HISTORY = 100;
const MAX_MESSAGE_LENGTH = 500;

// Once the match reaches one of these, both players have reported a result
// (agreeing or not) and the lobby is considered closed — chat stops too.
const CLOSED_STATUSES = ["COMPLETED", "DISPUTED", "CANCELLED"];

interface AuthedSocket extends Socket {
  userId?: string;
  token?: string;
}

interface ChatMessage {
  userId: string;
  text: string;
  at: string;
}

function roomFor(matchId: string) {
  return `match:${matchId}`;
}

export function attachChat(io: Server) {
  io.use((socket: AuthedSocket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("missing token"));
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
      socket.userId = payload.userId;
      socket.token = token;
      next();
    } catch {
      next(new Error("invalid token"));
    }
  });

  io.on("connection", (socket: AuthedSocket) => {
    socket.on("join", async (matchId: string) => {
      if (typeof matchId !== "string" || !matchId) return;

      let match;
      try {
        match = await fetchMatch(socket.token!, matchId);
      } catch {
        socket.emit("chat_error", "Match мэдээлэл татаж чадсангүй.");
        return;
      }

      if (match.playerAId !== socket.userId && match.playerBId !== socket.userId) {
        socket.emit("chat_error", "Та энэ тоглолтод оролцоогүй байна.");
        return;
      }

      if (CLOSED_STATUSES.includes(match.status)) {
        socket.emit("chat_error", "Лобби хаагдсан байна — үр дүн бүрдсэн.");
        return;
      }

      const elapsed = Date.now() - new Date(match.createdAt).getTime();
      if (elapsed > CHAT_WINDOW_MS) {
        socket.emit("chat_error", "Чатны хугацаа дууссан байна.");
        return;
      }

      socket.join(roomFor(matchId));

      const key = `chat:${matchId}:messages`;
      const raw = await redis.lrange(key, -MAX_HISTORY, -1);
      const history: ChatMessage[] = raw.map((r) => JSON.parse(r));

      socket.emit("history", { history, remainingMs: CHAT_WINDOW_MS - elapsed });
    });

    socket.on("message", async ({ matchId, text }: { matchId: string; text: string }) => {
      if (!matchId || !text || !text.trim()) return;

      const room = roomFor(matchId);
      if (!socket.rooms.has(room)) return; // must join() first — join already checked eligibility

      const message: ChatMessage = {
        userId: socket.userId!,
        text: text.trim().slice(0, MAX_MESSAGE_LENGTH),
        at: new Date().toISOString(),
      };

      const key = `chat:${matchId}:messages`;
      await redis.rpush(key, JSON.stringify(message));

      // Only set the TTL once, on the first message — a sliding TTL would let
      // active chatting extend the window indefinitely, defeating the point.
      const ttl = await redis.ttl(key);
      if (ttl === -1) {
        await redis.expire(key, CHAT_WINDOW_SECONDS);
      }

      io.to(room).emit("message", message);
    });
  });
}
