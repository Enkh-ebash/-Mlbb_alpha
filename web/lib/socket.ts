import { io, Socket } from "socket.io-client";

const NOTIFICATION_URL = process.env.NEXT_PUBLIC_NOTIFICATION_URL ?? "http://localhost:4009";

export function connectChatSocket(token: string): Socket {
  return io(NOTIFICATION_URL, {
    auth: { token },
    transports: ["websocket"],
  });
}
