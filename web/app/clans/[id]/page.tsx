"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { NavBar } from "@/components/NavBar";

interface Member {
  id: string;
  userId: string;
  status: "STARTER" | "SUBSTITUTE";
  position: string | null;
}

interface TeamDetail {
  id: string;
  name: string;
  tag: string;
  captainUserId: string;
  eloRating: number;
  region: string | null;
  members: Member[];
}

export default function ClanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, user, loading } = useAuth();
  const router = useRouter();

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberSlot, setNewMemberSlot] = useState<"STARTER" | "SUBSTITUTE">("STARTER");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !token) router.replace("/login");
  }, [loading, token, router]);

  function load() {
    api.team
      .get(id)
      .then(setTeam)
      .catch(() => setError("Баг олдсонгүй."));
  }

  useEffect(load, [id]);

  const isCaptain = user && team && user.id === team.captainUserId;

  async function handleAddMember() {
    if (!token || !team || !newMemberId.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.team.addMember(token, team.id, { userId: newMemberId.trim(), status: newMemberSlot });
      setNewMemberId("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Гишүүн нэмж чадсангүй.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveMember(targetUserId: string) {
    if (!token || !team) return;
    setBusy(true);
    setError(null);
    try {
      await api.team.removeMember(token, team.id, targetUserId);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Гишүүнийг хасаж чадсангүй.");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !team) {
    return (
      <div className="min-h-screen bg-bg">
        <NavBar />
        <p className="px-6 py-10 text-text-secondary">{error ?? "Ачаалж байна…"}</p>
      </div>
    );
  }

  const starters = team.members.filter((m) => m.status === "STARTER");
  const substitutes = team.members.filter((m) => m.status === "SUBSTITUTE");

  return (
    <div className="min-h-screen bg-bg">
      <NavBar />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold text-text-primary">
          {team.name} <span className="text-text-secondary">[{team.tag}]</span>
        </h1>
        <p className="mt-2 text-text-secondary">
          Elo {team.eloRating} {team.region && `· ${team.region}`}
        </p>

        <section className="mt-8">
          <h2 className="font-display text-sm font-bold text-text-secondary">
            ҮНДСЭН ({starters.length}/5)
          </h2>
          <div className="mt-3 space-y-2">
            {starters.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                isCaptain={!!isCaptain}
                isCaptainRow={m.userId === team.captainUserId}
                isSelf={user?.id === m.userId}
                onRemove={() => handleRemoveMember(m.userId)}
                busy={busy}
              />
            ))}
            {starters.length === 0 && <p className="text-sm text-text-secondary">Гишүүн алга</p>}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="font-display text-sm font-bold text-text-secondary">
            СЭЛГЭЭ ({substitutes.length}/1)
          </h2>
          <div className="mt-3 space-y-2">
            {substitutes.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                isCaptain={!!isCaptain}
                isCaptainRow={false}
                isSelf={user?.id === m.userId}
                onRemove={() => handleRemoveMember(m.userId)}
                busy={busy}
              />
            ))}
            {substitutes.length === 0 && <p className="text-sm text-text-secondary">Сэлгээгүй</p>}
          </div>
        </section>

        {isCaptain && (
          <section className="mt-8 rounded-2xl border border-white/10 bg-surface p-6">
            <h3 className="font-display text-sm font-bold text-text-primary">Гишүүн нэмэх</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                value={newMemberId}
                onChange={(e) => setNewMemberId(e.target.value)}
                placeholder="Хэрэглэгчийн ID (user id)"
                className="min-w-[220px] flex-1 rounded-lg border border-white/10 bg-bg px-3 py-2 text-sm text-text-primary focus:border-teal focus:outline-none"
              />
              <select
                value={newMemberSlot}
                onChange={(e) => setNewMemberSlot(e.target.value as "STARTER" | "SUBSTITUTE")}
                className="rounded-lg border border-white/10 bg-bg px-3 py-2 text-sm text-text-primary"
              >
                <option value="STARTER">Үндсэн</option>
                <option value="SUBSTITUTE">Сэлгээ</option>
              </select>
              <button
                onClick={handleAddMember}
                disabled={busy || !newMemberId.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
              >
                Нэмэх
              </button>
            </div>
          </section>
        )}

        {error && <p className="mt-4 text-sm text-coral">{error}</p>}
      </main>
    </div>
  );
}

function MemberRow({
  member,
  isCaptain,
  isCaptainRow,
  isSelf,
  onRemove,
  busy,
}: {
  member: Member;
  isCaptain: boolean;
  isCaptainRow: boolean;
  isSelf: boolean;
  onRemove: () => void;
  busy: boolean;
}) {
  const canRemove = !isCaptainRow && (isCaptain || isSelf);

  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-surface px-4 py-3">
      <div>
        <p className="font-mono text-sm text-text-primary">{member.userId}</p>
        <p className="text-xs text-text-secondary">
          {isCaptainRow ? "Ахлагч" : member.position ?? "Байрлал тодорхойгүй"}
        </p>
      </div>
      {canRemove && (
        <button
          onClick={onRemove}
          disabled={busy}
          className="text-sm text-coral hover:underline disabled:opacity-50"
        >
          {isSelf ? "Гарах" : "Хасах"}
        </button>
      )}
    </div>
  );
}
