"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { NavBar } from "@/components/NavBar";

interface HeroRow {
  id: string;
  name: string;
  imageUrl: string | null;
  winRate: number | null;
  pickRate: number | null;
  banRate: number | null;
}

function pct(v: number | null): string {
  return v === null ? "—" : `${(v * 100).toFixed(1)}%`;
}

export default function HeroesPage() {
  const { token, loading } = useAuth();
  const router = useRouter();
  const [heroes, setHeroes] = useState<HeroRow[] | null>(null);

  useEffect(() => {
    if (!loading && !token) router.replace("/login");
  }, [loading, token, router]);

  useEffect(() => {
    api.hero.list().then(setHeroes).catch(() => setHeroes([]));
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <NavBar />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold text-text-primary">Баатрууд</h1>
        <p className="mt-2 text-text-secondary">Win rate-ээр эрэмбэлсэн (7 хоногийн статистик)</p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-surface">
          {heroes === null && (
            <p className="px-5 py-8 text-center text-text-secondary">Ачаалж байна…</p>
          )}
          {heroes?.length === 0 && (
            <p className="px-5 py-8 text-center text-text-secondary">
              Дата хараахан sync хийгдээгүй байна — эхний sync хийгдэхийг хүлээгээрэй.
            </p>
          )}
          {heroes && heroes.length > 0 && (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-sm text-text-secondary">
                  <th className="px-5 py-3 font-normal">Баатар</th>
                  <th className="px-5 py-3 text-right font-normal">Win rate</th>
                  <th className="px-5 py-3 text-right font-normal">Pick rate</th>
                  <th className="px-5 py-3 text-right font-normal">Ban rate</th>
                </tr>
              </thead>
              <tbody>
                {heroes.map((h) => (
                  <tr key={h.id} className="border-b border-white/5 last:border-0">
                    <td className="flex items-center gap-3 px-5 py-3">
                      {h.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={h.imageUrl} alt={h.name} className="h-8 w-8 rounded-full" />
                      )}
                      <span className="font-medium text-text-primary">{h.name}</span>
                    </td>
                    <td className="px-5 py-3 text-right text-teal">{pct(h.winRate)}</td>
                    <td className="px-5 py-3 text-right text-text-primary">{pct(h.pickRate)}</td>
                    <td className="px-5 py-3 text-right text-coral">{pct(h.banRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
