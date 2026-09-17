"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/Button";
import { HeroBackground } from "@/components/HeroBackground";
import { LevelBadge } from "@/components/LevelBadge";

interface LeaderRow {
  rank: number;
  id: string;
  username: string;
  eloRating: number;
}

export default function Home() {
  const { token, loading } = useAuth();
  const router = useRouter();

  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [matchesCount, setMatchesCount] = useState<number | null>(null);
  const [topPlayers, setTopPlayers] = useState<LeaderRow[] | null>(null);

  useEffect(() => {
    if (!loading && token) router.replace("/dashboard");
  }, [loading, token, router]);

  useEffect(() => {
    api.stats.usersCount().then((r) => setUsersCount(r.count)).catch(() => {});
    api.stats.matchesCount().then((r) => setMatchesCount(r.count)).catch(() => {});
    api.leaderboard.top(3).then(setTopPlayers).catch(() => {});
  }, []);

  if (loading || token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-text-secondary">Ачаалж байна…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg">
      {/* Nav */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-display text-lg font-bold text-text-primary">MLBB Play</span>
          <Link
            href="/login"
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-text-primary hover:border-teal hover:text-teal"
          >
            Нэвтрэх
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <HeroBackground />
        <div className="relative mx-auto max-w-6xl px-6 py-28 text-center">
          <h1 className="font-display text-6xl font-extrabold leading-[1.05] text-text-primary sm:text-7xl">
            MLBB PLAY
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-text-secondary">
            Монголын MLBB тоглогчдод зориулсан ранк тэмцээний платформ. Шударга matchmaking,
            бодит Elo, лидерборд.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register" className="w-full max-w-xs">
              <Button>⚔️ Дуэл эхлүүлэх</Button>
            </Link>
            <Link href="/leaderboard" className="w-full max-w-xs">
              <Button variant="outline">🏆 Лидерборд үзэх</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="mx-auto max-w-6xl px-6 pb-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-primary/30 bg-surface p-6 text-center">
            <div className="font-display text-3xl font-bold text-text-primary">
              {usersCount ?? "—"}
            </div>
            <div className="mt-1 text-sm text-text-secondary">Тоглогчид</div>
          </div>
          <div className="rounded-2xl border border-teal/30 bg-surface p-6 text-center">
            <div className="font-display text-3xl font-bold text-text-primary">
              {matchesCount ?? "—"}
            </div>
            <div className="mt-1 text-sm text-text-secondary">Дуэлүүд</div>
          </div>
        </div>
      </section>

      {/* Top players preview */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-text-primary">🏅 Топ тоглогчид</h2>
          <Link
            href="/leaderboard"
            className="rounded-lg border border-primary/40 px-4 py-2 text-sm text-primary hover:bg-primary/10"
          >
            Бүгд харах →
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-surface">
          {topPlayers === null && (
            <p className="px-5 py-8 text-center text-text-secondary">Ачаалж байна…</p>
          )}
          {topPlayers?.length === 0 && (
            <p className="px-5 py-8 text-center text-text-secondary">Одоогоор тоглогч алга.</p>
          )}
          {topPlayers?.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between border-b border-white/5 px-5 py-4 last:border-0"
            >
              <div className="flex items-center gap-4">
                <span className="w-5 text-text-secondary">{p.rank}</span>
                <span className="font-medium text-text-primary">{p.username}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-display font-bold text-text-primary">{p.eloRating}</span>
                <LevelBadge mmr={p.eloRating} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
