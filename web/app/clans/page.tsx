"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { NavBar } from "@/components/NavBar";
import { Field } from "@/components/Field";
import { Button } from "@/components/Button";

interface TeamRow {
  id: string;
  name: string;
  tag: string;
  eloRating: number;
  _count: { members: number };
}

export default function ClansPage() {
  const { token, loading } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<TeamRow[] | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [region, setRegion] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !token) router.replace("/login");
  }, [loading, token, router]);

  function loadTeams() {
    api.team.list().then(setTeams).catch(() => setTeams([]));
  }

  useEffect(loadTeams, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    setCreateError(null);
    try {
      const team = await api.team.create(token, { name, tag, region: region || undefined });
      router.push(`/clans/${team.id}`);
    } catch (err) {
      setCreateError(
        err instanceof ApiError ? err.message : "Баг үүсгэж чадсангүй."
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <NavBar />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-text-primary">Багууд</h1>
            <p className="mt-2 text-text-secondary">6 хүн: 5 үндсэн + 1 сэлгээ</p>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
          >
            {showForm ? "Болих" : "+ Баг үүсгэх"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mt-6 rounded-2xl border border-white/10 bg-surface p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field id="name" label="Багийн нэр" required value={name} onChange={(e) => setName(e.target.value)} />
              <Field
                id="tag"
                label="Tag"
                required
                maxLength={6}
                placeholder="жиш: DRGN"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              />
              <Field
                id="region"
                label="Бүс (заавал биш)"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </div>
            {createError && <p className="mt-3 text-sm text-coral">{createError}</p>}
            <div className="mt-4 max-w-xs">
              <Button type="submit" loading={creating}>
                Үүсгэх
              </Button>
            </div>
          </form>
        )}

        <div className="mt-8 space-y-3">
          {teams === null && <p className="text-text-secondary">Ачаалж байна…</p>}
          {teams?.length === 0 && <p className="text-text-secondary">Одоогоор баг алга.</p>}
          {teams?.map((team) => (
            <Link
              key={team.id}
              href={`/clans/${team.id}`}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-surface p-5 hover:border-primary/40"
            >
              <div>
                <p className="font-display font-bold text-text-primary">
                  {team.name} <span className="text-text-secondary">[{team.tag}]</span>
                </p>
                <p className="mt-1 text-sm text-text-secondary">{team._count.members} / 6 гишүүн</p>
              </div>
              <span className="font-display font-bold text-text-primary">{team.eloRating}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
