// FACEIT-style level bands. New players start at 1000 MMR (see elo-service),
// which lands in the middle at level 5 — matches the reference point Manlai
// gave (1000 MMR ≈ level 5).
const LEVEL_THRESHOLDS = [0, 600, 750, 900, 1000, 1100, 1250, 1400, 1600, 1800];

export function getLevel(mmr: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (mmr >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return Math.min(level, 10);
}

export function levelColor(level: number): string {
  if (level <= 3) return "#8B8B9E"; // grey — beginner
  if (level <= 6) return "#2DD4BF"; // teal — mid
  if (level <= 8) return "#7C5CFC"; // purple — advanced
  return "#E8B14A"; // gold — top tier
}
