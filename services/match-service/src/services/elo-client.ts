const ELO_SERVICE_URL = process.env.ELO_SERVICE_URL || "http://elo-service:4003";

interface PlayerStatInput {
  userId: string;
  kills: number;
  deaths: number;
  assists: number;
  isMvp: boolean;
}

export async function notifyEloService(params: {
  matchId: string;
  matchType: string;
  winnerId: string;
  playerAId: string;
  playerBId: string;
  stats: PlayerStatInput[];
}) {
  try {
    const res = await fetch(`${ELO_SERVICE_URL}/internal/apply-result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      console.warn(`match-service: elo-service responded with status ${res.status}`);
    }
  } catch (err) {
    // elo-service may not have this endpoint yet (built next) — don't fail the review for it.
    console.warn("match-service: could not reach elo-service to apply result:", err);
  }
}
