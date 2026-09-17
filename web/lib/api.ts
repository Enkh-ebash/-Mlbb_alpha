// Base URLs for each backend microservice. On the web, "localhost" works
// directly (unlike the Android emulator, which needs 10.0.2.2) since the
// browser and Docker Compose are both running on the same machine during
// local development.
export const API_HOSTS = {
  auth: process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:4001",
  matchmaking: process.env.NEXT_PUBLIC_MATCHMAKING_URL ?? "http://localhost:4002",
  elo: process.env.NEXT_PUBLIC_ELO_URL ?? "http://localhost:4003",
  match: process.env.NEXT_PUBLIC_MATCH_URL ?? "http://localhost:4004",
} as const;

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.error ? JSON.stringify(data.error) : `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return data as T;
}

export function authHeader(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export const api = {
  auth: {
    register: (body: { username: string; email: string; password: string }) =>
      request<{ token: string; user: { id: string; username: string; email: string; role: string } }>(
        `${API_HOSTS.auth}/auth/register`,
        { method: "POST", body: JSON.stringify(body) }
      ),
    login: (body: { email: string; password: string }) =>
      request<{ token: string; user: { id: string; username: string; email: string; role: string } }>(
        `${API_HOSTS.auth}/auth/login`,
        { method: "POST", body: JSON.stringify(body) }
      ),
    me: (token: string) =>
      request<{
        id: string;
        username: string;
        email: string;
        role: string;
        eloRating: number;
        mlbbProfile: { mlbbId: string; zoneId: string; inGameName: string } | null;
      }>(`${API_HOSTS.auth}/auth/me`, { headers: authHeader(token) }),
  },
  matchmaking: {
    joinQueue: (token: string) =>
      request<{ id: string; status: string; mmr: number }>(`${API_HOSTS.matchmaking}/matchmaking/queue`, {
        method: "POST",
        headers: authHeader(token),
      }),
    leaveQueue: (token: string) =>
      request<{ id: string; status: string }>(`${API_HOSTS.matchmaking}/matchmaking/queue`, {
        method: "DELETE",
        headers: authHeader(token),
      }),
    status: (token: string) =>
      request<{
        status: string;
        matchId?: string;
        matchedWith?: string;
      }>(`${API_HOSTS.matchmaking}/matchmaking/status`, { headers: authHeader(token) }),
  },
  match: {
    get: (token: string, matchId: string) =>
      request<{
        id: string;
        playerAId: string;
        playerBId: string;
        roomCode: string | null;
        status: string;
      }>(`${API_HOSTS.match}/matches/${matchId}`, { headers: authHeader(token) }),
    userStats: (userId: string) =>
      request<{
        userId: string;
        matchesPlayed: number;
        wins: number;
        losses: number;
        winRate: number;
        avgKills: number;
        avgDeaths: number;
        avgAssists: number;
        mvpRate: number;
      }>(`${API_HOSTS.match}/matches/stats/user/${userId}`),
  },
  leaderboard: {
    top: (limit = 50) =>
      request<
        { rank: number; id: string; username: string; eloRating: number; avatarUrl: string | null }[]
      >(`${API_HOSTS.auth}/auth/leaderboard?limit=${limit}`),
  },
};
