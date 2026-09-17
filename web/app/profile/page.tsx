"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { NavBar } from "@/components/NavBar";
import { StatCard } from "@/components/StatCard";
import { LevelBadge } from "@/components/LevelBadge";
import { getLevel } from "@/lib/rank";

interface UserStats {
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  mvpRate: number;
}

export default function ProfilePage() {
  const { token, user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    if (!loading && !token) router.replace("/login");
  }, [loading, token, router]);

  useEffect(() => {
    if (user) {
      api.match
        .userStats(user.id)
        .then(setStats)
        .catch(() => setStats(null));
    }
  }, [user]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-text-secondary">Ачаалж байна…</p>
      </main>
    );
  }

  const level = getLevel(user.eloRating);

  return (
    <div className="min-h-screen bg-bg">
      <NavBar />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center gap-4">
          <LevelBadge mmr={user.eloRating} size="lg" />
          <div>
            <h1 className="font-display text-3xl font-bold text-text-primary">{user.username}</h1>
            <p className="text-text-secondary">
              Level {level} · {user.eloRating} MMR · {user.role}
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Elo Rating" value={user.eloRating} accent="primary" />
          <StatCard
            label="Win Rate"
            value={stats ? `${Math.round(stats.winRate * 100)}%` : "—"}
            accent="teal"
          />
          <StatCard
            label="Avg KDA"
            value={stats ? `${stats.avgKills}/${stats.avgDeaths}/${stats.avgAssists}` : "—"}
            accent="primary"
          />
          <StatCard
            label="MVP Rate"
            value={stats ? `${Math.round(stats.mvpRate * 100)}%` : "—"}
            accent="gold"
          />
          <StatCard label="Matches" value={stats?.matchesPlayed ?? "—"} accent="teal" />
          <StatCard
            label="W / L"
            value={stats ? `${stats.wins} / ${stats.losses}` : "—"}
            accent="coral"
          />
        </div>

        {user.mlbbProfile && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-surface p-6">
            <h2 className="font-display text-lg font-bold text-text-primary">MLBB профайл</h2>
            <p className="mt-2 text-text-secondary">
              {user.mlbbProfile.inGameName} · ID {user.mlbbProfile.mlbbId} · Zone{" "}
              {user.mlbbProfile.zoneId}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
