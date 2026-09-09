const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:4001";

export async function getUserElo(userId: string): Promise<number> {
  const res = await fetch(`${AUTH_SERVICE_URL}/internal/users/${userId}`);
  if (!res.ok) throw new Error(`auth-service returned ${res.status} for user ${userId}`);
  const data = (await res.json()) as { eloRating: number };
  return data.eloRating;
}

export async function setUserElo(userId: string, eloRating: number): Promise<void> {
  const res = await fetch(`${AUTH_SERVICE_URL}/internal/users/${userId}/elo`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eloRating }),
  });
  if (!res.ok) throw new Error(`auth-service returned ${res.status} updating user ${userId}`);
}
