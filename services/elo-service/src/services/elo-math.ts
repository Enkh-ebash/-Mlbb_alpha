export const BASE_K = 20;

export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function eloDelta(k: number, actualScore: number, expected: number): number {
  return k * (actualScore - expected);
}

/**
 * Simple KDA-based "weighted score" for one player in one match.
 * NOTE: this does not yet apply per-position weights (Gold/Jungle/Mid/Exp/Roam)
 * from the design doc — that needs hero-service to tell us each hero's
 * position, which isn't wired up yet. Everything currently uses flat weights
 * (kills=1, assists=1, deaths=1). Swap this out once hero-service exposes
 * hero -> position and pass the position in from match-service.
 */
export function weightedScore(kills: number, deaths: number, assists: number): number {
  return (kills + assists) / Math.max(1, deaths);
}

const MULTIPLIER_MIN = 0.6;
const MULTIPLIER_MAX = 1.4;
const MVP_BONUS = 0.1;

export function performanceMultiplier(
  playerWeightedScore: number,
  baselineAvg: number,
  isMvp: boolean
): number {
  const normalized = baselineAvg > 0 ? playerWeightedScore / baselineAvg : 1;
  let multiplier = 1 + 0.4 * (normalized - 1);
  if (isMvp) multiplier += MVP_BONUS;
  return Math.min(MULTIPLIER_MAX, Math.max(MULTIPLIER_MIN, multiplier));
}

/** Exponential-moving-average update of the rolling baseline. */
export function updateBaseline(
  currentAvg: number,
  currentSampleSize: number,
  newValue: number
): { avg: number; sampleSize: number } {
  const sampleSize = currentSampleSize + 1;
  const avg = currentAvg + (newValue - currentAvg) / sampleSize;
  return { avg, sampleSize };
}
