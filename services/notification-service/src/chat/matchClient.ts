const MATCH_SERVICE_URL = process.env.MATCH_SERVICE_URL || "http://match-service:4004";

export interface MatchInfo {
  id: string;
  playerAId: string;
  playerBId: string;
  status: string;
  createdAt: string;
}

export async function fetchMatch(token: string, matchId: string): Promise<MatchInfo> {
  const res = await fetch(`${MATCH_SERVICE_URL}/matches/${matchId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`match-service responded ${res.status}`);
  }
  return (await res.json()) as MatchInfo;
}
