"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { NavBar } from "@/components/NavBar";
import { LevelBadge } from "@/components/LevelBadge";

interface LeaderboardRow {
  rank: number;
  id: string;
  username: string;
  eloRating: number;
  avatarUrl: string | null;
}

export default function LeaderboardPage() {
  const { token, loading } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !token) router.replace("/login");
  }, [loading, token, router]);

  useEffect(() => {
    api.leaderboard
      .top(50)
      .then(setRows)
      .catch(() => setError("Лидерборд ачаалж чадсангүй."));
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <NavBar />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold text-text-primary">Лидерборд</h1>
        <p className="mt-2 text-text-secondary">Elo рейтингээр эрэмбэлсэн тэргүүлэгчид</p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-surface">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-sm text-text-secondary">
                <th className="px-5 py-3 font-normal">#</th>
                <th className="px-5 py-3 font-normal">Тоглогч</th>
                <th className="px-5 py-3 font-normal">Level</th>
                <th className="px-5 py-3 text-right font-normal">Elo</th>
              </tr>
            </thead>
            <tbody>
              {rows?.map((row) => (
                <tr key={row.id} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-4 text-text-secondary">{row.rank}</td>
                  <td className="px-5 py-4 font-medium text-text-primary">{row.username}</td>
                  <td className="px-5 py-4">
                    <LevelBadge mmr={row.eloRating} />
                  </td>
                  <td className="px-5 py-4 text-right font-display font-bold text-text-primary">
                    {row.eloRating}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rows === null && !error && (
            <p className="px-5 py-8 text-center text-text-secondary">Ачаалж байна…</p>
          )}
          {error && <p className="px-5 py-8 text-center text-coral">{error}</p>}
          {rows?.length === 0 && (
            <p className="px-5 py-8 text-center text-text-secondary">Одоогоор тоглогч алга.</p>
          )}
        </div>
      </main>
    </div>
  );
}
