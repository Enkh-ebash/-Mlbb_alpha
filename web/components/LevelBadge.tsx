import { getLevel, levelColor } from "@/lib/rank";

interface LevelBadgeProps {
  mmr: number;
  size?: "sm" | "lg";
}

export function LevelBadge({ mmr, size = "sm" }: LevelBadgeProps) {
  const level = getLevel(mmr);
  const color = levelColor(level);
  const dimension = size === "lg" ? "h-14 w-14 text-2xl" : "h-8 w-8 text-sm";

  return (
    <div
      className={`flex ${dimension} items-center justify-center rounded-lg font-display font-bold text-bg`}
      style={{ backgroundColor: color }}
      title={`Level ${level} · ${mmr} MMR`}
    >
      {level}
    </div>
  );
}
