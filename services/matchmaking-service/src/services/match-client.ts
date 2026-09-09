const MATCH_SERVICE_URL = process.env.MATCH_SERVICE_URL || "http://match-service:4004";

export async function createMatchOnMatchService(params: {
  matchId: string;
  playerAId: string;
  playerBId: string;
}): Promise<void> {
  const res = await fetch(`${MATCH_SERVICE_URL}/internal/matches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      matchId: params.matchId,
      playerAId: params.playerAId,
      playerBId: params.playerBId,
      matchType: "SOLO_1V1",
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`match-service responded ${res.status}: ${body}`);
  }
}
