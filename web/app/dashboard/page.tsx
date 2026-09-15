"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { NavBar } from "@/components/NavBar";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/Button";

export default function DashboardPage() {
  const { token, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) router.replace("/login");
  }, [loading, token, router]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-text-secondary">Ачаалж байна…</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <NavBar />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-text-secondary">Тавтай морил</p>
        <h1 className="font-display text-3xl font-bold text-text-primary">{user.username}</h1>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Elo Rating" value={user.eloRating} accent="primary" />
          <StatCard label="Role" value={user.role} accent="teal" />
          <StatCard label="MLBB ID" value={user.mlbbProfile?.mlbbId ?? "—"} accent="gold" />
        </div>

        <div className="mt-10 rounded-2xl border border-primary/30 bg-gradient-to-br from-surface to-surface-variant p-8">
          <h2 className="font-display text-xl font-bold text-text-primary">Тоглох бэлэн үү?</h2>
          <p className="mt-2 max-w-md text-text-secondary">
            Matchmaking queue-д орж, өөрийн эрэмбэтэй тэнцүү тоглогчтой тохирооройоо.
          </p>
          <Link href="/matchmaking" className="mt-6 inline-block max-w-xs">
            <Button>Тоглох</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
