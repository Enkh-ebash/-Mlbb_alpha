const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:4001";

export async function fetchCurrentMmr(authToken: string): Promise<number> {
  const res = await fetch(`${AUTH_SERVICE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });

  if (!res.ok) {
    throw new Error(`auth-service /auth/me failed with status ${res.status}`);
  }

  const data = (await res.json()) as { eloRating: number };
  return data.eloRating;
}
