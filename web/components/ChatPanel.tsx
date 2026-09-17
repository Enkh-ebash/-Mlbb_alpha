"use client";

import { useEffect, useRef, useState } from "react";
import { connectChatSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";

interface ChatMessage {
  userId: string;
  text: string;
  at: string;
}

interface ChatPanelProps {
  token: string;
  matchId: string;
  selfUserId: string;
}

export function ChatPanel({ token, matchId, selfUserId }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = connectChatSocket(token);
    socketRef.current = socket;

    socket.on("history", (data: { history: ChatMessage[]; remainingMs: number }) => {
      setMessages(data.history);
      setRemainingMs(data.remainingMs);
    });
    socket.on("message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });
    socket.on("chat_error", (msg: string) => setError(msg));

    socket.emit("join", matchId);

    return () => {
      socket.disconnect();
    };
  }, [token, matchId]);

  useEffect(() => {
    if (remainingMs === null || remainingMs <= 0) return;
    const interval = setInterval(() => {
      setRemainingMs((r) => (r !== null ? Math.max(0, r - 1000) : r));
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingMs !== null]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  function send() {
    if (!draft.trim() || !socketRef.current) return;
    socketRef.current.emit("message", { matchId, text: draft });
    setDraft("");
  }

  const expired = remainingMs !== null && remainingMs <= 0;
  const minutes = remainingMs !== null ? Math.floor(remainingMs / 60000) : null;
  const seconds = remainingMs !== null ? Math.floor((remainingMs % 60000) / 1000) : null;

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-surface p-4 text-left">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-text-primary">Түр зуурын чат</h3>
        {minutes !== null && !expired && (
          <span className="text-xs text-text-secondary">
            {minutes}:{seconds!.toString().padStart(2, "0")} үлдлээ
          </span>
        )}
        {expired && <span className="text-xs text-coral">Хугацаа дууссан</span>}
      </div>

      {error && <p className="mt-2 text-sm text-coral">{error}</p>}

      <div ref={scrollRef} className="mt-3 h-48 space-y-2 overflow-y-auto rounded-lg bg-bg p-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-lg px-3 py-1.5 text-sm ${
              m.userId === selfUserId
                ? "ml-auto bg-primary text-white"
                : "bg-surface-variant text-text-primary"
            }`}
          >
            {m.text}
          </div>
        ))}
        {messages.length === 0 && !error && (
          <p className="text-center text-sm text-text-secondary">Room code солилцоорой</p>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={expired}
          placeholder="Мессеж бичих…"
          className="flex-1 rounded-lg border border-white/10 bg-bg px-3 py-2 text-sm text-text-primary focus:border-teal focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={expired}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
        >
          Илгээх
        </button>
      </div>
    </div>
  );
}
