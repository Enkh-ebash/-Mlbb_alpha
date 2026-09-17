"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/Button";
import { ChatPanel } from "@/components/ChatPanel";

type QueueState = "IDLE" | "SEARCHING" | "MATCHED";

interface MatchInfo {
  id: string;
  roomCode: string | null;
  status: string;
  opponentId: string;
}

export default function MatchmakingPage() {
  const { token, user, loading } = useAuth();
  const router = useRouter();

  const [queueState, setQueueState] = useState<QueueState>("IDLE");
  const [waitedSeconds, setWaitedSeconds] = useState(0);
  const [match, setMatch] = useState<MatchInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [savingRoomCode, setSavingRoomCode] = useState(false);
  const [roomCodeError, setRoomCodeError] = useState<string | null>(null);

  const [resultSubmitted, setResultSubmitted] = useState(false);
  const [submittingResult, setSubmittingResult] = useState(false);
  const [resultError, setResultError] = useState<string | null>(null);

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

  async function handleSaveRoomCode() {
    if (!token || !match || !roomCodeInput.trim()) return;
    setSavingRoomCode(true);
    setRoomCodeError(null);
    try {
      const updated = await api.match.setRoomCode(token, match.id, roomCodeInput.trim());
      setMatch({ ...match, roomCode: updated.roomCode, status: updated.status });
    } catch (err) {
      setRoomCodeError(err instanceof ApiError ? err.message : "Room code хадгалж чадсангүй.");
    } finally {
      setSavingRoomCode(false);
    }
  }

  async function handleReportResult(won: boolean) {
    if (!token || !match || !user) return;
    setSubmittingResult(true);
    setResultError(null);
    try {
      const winnerId = won ? user.id : match.opponentId;
      await api.match.submitResult(token, match.id, winnerId);
      setResultSubmitted(true);
    } catch (err) {
      setResultError(
        err instanceof ApiError
          ? "Илгээхэд алдаа гарлаа — үр дүн аль хэдийн илгээгдсэн байж магадгүй."
          : "Сервертэй холбогдож чадсангүй."
      );
    } finally {
      setSubmittingResult(false);
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

        {queueState === "MATCHED" && match && token && user && (
          <div className="w-full">
            <span className="font-display text-sm font-medium text-teal">Тохирол олдлоо!</span>
            <h1 className="mt-2 font-display text-2xl font-bold text-text-primary">Тоглолтод бэлдэнэ үү</h1>

            <div className="mt-8 rounded-2xl border border-teal/30 bg-surface p-6 text-left">
              <p className="text-sm text-text-secondary">Match ID</p>
              <p className="font-mono text-text-primary">{match.id}</p>

              <p className="mt-4 text-sm text-text-secondary">Room code</p>
              {match.roomCode ? (
                <p className="font-mono text-lg text-text-primary">{match.roomCode}</p>
              ) : (
                <div className="mt-2 flex gap-2">
                  <input
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value)}
                    placeholder="MLBB дотор custom room үүсгээд код-оо энд бич"
                    className="flex-1 rounded-lg border border-white/10 bg-bg px-3 py-2 text-sm text-text-primary focus:border-teal focus:outline-none"
                  />
                  <button
                    onClick={handleSaveRoomCode}
                    disabled={savingRoomCode || !roomCodeInput.trim()}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
                  >
                    Хадгалах
                  </button>
                </div>
              )}
              {roomCodeError && <p className="mt-2 text-sm text-coral">{roomCodeError}</p>}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-surface p-6 text-left">
              <h3 className="font-display text-sm font-bold text-text-primary">Тоглолт дууссан уу?</h3>
              {resultSubmitted ? (
                <p className="mt-2 text-sm text-teal">
                  Илгээгдлээ — moderator баталгаажуулахыг хүлээж байна.
                </p>
              ) : (
                <>
                  <p className="mt-1 text-sm text-text-secondary">
                    Тоглолт дуусмагц хэн хожсоноо тэмдэглээрэй.
                  </p>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => handleReportResult(true)}
                      disabled={submittingResult}
                      className="flex-1 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-bg hover:bg-teal/90 disabled:opacity-50"
                    >
                      Би яллаа
                    </button>
                    <button
                      onClick={() => handleReportResult(false)}
                      disabled={submittingResult}
                      className="flex-1 rounded-xl border border-coral/40 px-4 py-2.5 text-sm font-semibold text-coral hover:bg-coral/10 disabled:opacity-50"
                    >
                      Би хожигдлоо
                    </button>
                  </div>
                  {resultError && <p className="mt-3 text-sm text-coral">{resultError}</p>}
                </>
              )}
            </div>

            <ChatPanel token={token} matchId={match.id} selfUserId={user.id} />
          </div>
        )}

        {error && <p className="mt-6 text-sm text-coral">{error}</p>}
      </main>
    </div>
  );
}
