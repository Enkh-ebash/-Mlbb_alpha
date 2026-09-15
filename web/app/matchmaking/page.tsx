"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/Button";

type QueueState = "IDLE" | "SEARCHING" | "MATCHED";

interface MatchInfo {
  id: string;
  roomCode: string | null;
  status: string;
  opponentId: string;
}

export default function MatchmakingPage() {
  const { token, loading } = useAuth();
  const router = useRouter();

  const [queueState, setQueueState] = useState<QueueState>("IDLE");
  const [waitedSeconds, setWaitedSeconds] = useState(0);
  const [match, setMatch] = useState<MatchInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!loading && !token) router.replace("/login");
  }, [loading, token, router]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  async function handleJoinQueue() {
    if (!token) return;
    setError(null);
    try {
      await api.matchmaking.joinQueue(token);
      setQueueState("SEARCHING");
      setWaitedSeconds(0);

      timerRef.current = setInterval(() => setWaitedSeconds((s) => s + 1), 1000);

      pollRef.current = setInterval(async () => {
        try {
          const status = await api.matchmaking.status(token);
          if (status.status === "MATCHED" && status.matchId) {
            stopPolling();
            const m = await api.match.get(token, status.matchId);
            setMatch({
              id: m.id,
              roomCode: m.roomCode,
              status: m.status,
              opponentId: m.playerAId === status.matchedWith ? m.playerAId : m.playerBId,
            });
            setQueueState("MATCHED");
          }
        } catch {
          // transient poll failure — try again on the next tick
        }
      }, 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Queue-д орж чадсангүй.");
    }
  }

  async function handleLeaveQueue() {
    if (!token) return;
    stopPolling();
    try {
      await api.matchmaking.leaveQueue(token);
    } finally {
      setQueueState("IDLE");
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <NavBar />
      <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-20 text-center">
        {queueState === "IDLE" && (
          <>
            <h1 className="font-display text-3xl font-bold text-text-primary">Тоглоход бэлэн үү?</h1>
            <p className="mt-3 max-w-sm text-text-secondary">
              Queue-д ортол, эрэмбэ ойролцоо тоглогчтой автоматаар тохируулна.
            </p>
            <div className="mt-8 w-full max-w-xs">
              <Button onClick={handleJoinQueue}>Queue-д орох</Button>
            </div>
          </>
        )}

        {queueState === "SEARCHING" && (
          <>
            <div className="h-16 w-16 animate-pulse rounded-full border-4 border-primary border-t-transparent" />
            <h1 className="mt-6 font-display text-2xl font-bold text-text-primary">Тоглогч хайж байна…</h1>
            <p className="mt-2 text-text-secondary">{waitedSeconds} секунд хүлээж байна</p>
            <div className="mt-8 w-full max-w-xs">
              <Button variant="outline" onClick={handleLeaveQueue}>
                Цуцлах
              </Button>
            </div>
          </>
        )}

        {queueState === "MATCHED" && match && (
          <>
            <span className="font-display text-sm font-medium text-teal">Тохирол олдлоо!</span>
            <h1 className="mt-2 font-display text-2xl font-bold text-text-primary">Тоглолтод бэлдэнэ үү</h1>
            <div className="mt-8 w-full rounded-2xl border border-teal/30 bg-surface p-6 text-left">
              <p className="text-sm text-text-secondary">Match ID</p>
              <p className="font-mono text-text-primary">{match.id}</p>
              <p className="mt-4 text-sm text-text-secondary">Room code</p>
              <p className="font-mono text-text-primary">
                {match.roomCode ?? "Хараахан тохируулаагүй — MLBB дотор custom room үүсгээд код-оо нэмнэ үү"}
              </p>
            </div>
          </>
        )}

        {error && <p className="mt-6 text-sm text-coral">{error}</p>}
      </main>
    </div>
  );
}
