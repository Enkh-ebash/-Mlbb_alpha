// Base URLs for each backend microservice. On the web, "localhost" works
// directly (unlike the Android emulator, which needs 10.0.2.2) since the
// browser and Docker Compose are both running on the same machine during
// local development.
export const API_HOSTS = {
  auth: process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:4001",
  matchmaking: process.env.NEXT_PUBLIC_MATCHMAKING_URL ?? "http://localhost:4002",
  elo: process.env.NEXT_PUBLIC_ELO_URL ?? "http://localhost:4003",
  match: process.env.NEXT_PUBLIC_MATCH_URL ?? "http://localhost:4004",
  hero: process.env.NEXT_PUBLIC_HERO_URL ?? "http://localhost:4005",
  team: process.env.NEXT_PUBLIC_TEAM_URL ?? "http://localhost:4006",
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
    setRoomCode: (token: string, matchId: string, roomCode: string) =>
      request<{ id: string; roomCode: string; status: string }>(
        `${API_HOSTS.match}/matches/${matchId}/room-code`,
        { method: "PATCH", headers: authHeader(token), body: JSON.stringify({ roomCode }) }
      ),
    submitResult: (
      token: string,
      matchId: string,
      body: { winnerId: string; kills?: number; deaths?: number; assists?: number; isMvp?: boolean }
    ) =>
      request<
        | { status: "WAITING_FOR_OPPONENT" }
        | { status: "APPROVED"; winnerId: string; resultId: string }
        | { status: "DISPUTED"; resultId: string }
      >(`${API_HOSTS.match}/matches/${matchId}/result`, {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify(body),
      }),
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
  stats: {
    usersCount: () => request<{ count: number }>(`${API_HOSTS.auth}/internal/stats/users-count`),
    matchesCount: () => request<{ count: number }>(`${API_HOSTS.match}/matches/stats/count`),
  },
  hero: {
    list: () =>
      request<
        {
          id: string;
          externalId: number;
          name: string;
          imageUrl: string | null;
          winRate: number | null;
          pickRate: number | null;
          banRate: number | null;
        }[]
      >(`${API_HOSTS.hero}/heroes`),
  },
  team: {
    list: () =>
      request<
        {
          id: string;
          name: string;
          tag: string;
          captainUserId: string;
          eloRating: number;
          _count: { members: number };
        }[]
      >(`${API_HOSTS.team}/teams`),
    get: (teamId: string) =>
      request<{
        id: string;
        name: string;
        tag: string;
        captainUserId: string;
        eloRating: number;
        region: string | null;
        members: {
          id: string;
          userId: string;
          status: "STARTER" | "SUBSTITUTE";
          position: string | null;
        }[];
      }>(`${API_HOSTS.team}/teams/${teamId}`),
    create: (token: string, body: { name: string; tag: string; region?: string }) =>
      request<{ id: string }>(`${API_HOSTS.team}/teams`, {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify(body),
      }),
    addMember: (
      token: string,
      teamId: string,
      body: { userId: string; status?: "STARTER" | "SUBSTITUTE"; position?: string }
    ) =>
      request(`${API_HOSTS.team}/teams/${teamId}/members`, {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify(body),
      }),
    removeMember: async (token: string, teamId: string, userId: string) => {
      const res = await fetch(`${API_HOSTS.team}/teams/${teamId}/members/${userId}`, {
        method: "DELETE",
        headers: authHeader(token),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new ApiError(data?.error ? JSON.stringify(data.error) : "Request failed", res.status);
      }
    },
  },
};
