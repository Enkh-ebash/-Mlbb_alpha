interface StatCardProps {
  label: string;
  value: string | number;
  accent?: "primary" | "teal" | "gold" | "coral";
}

const accentBorder: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "border-primary/40",
  teal: "border-teal/40",
  gold: "border-gold/40",
  coral: "border-coral/40",
};

export function StatCard({ label, value, accent = "primary" }: StatCardProps) {
  return (
    <div className={`rounded-2xl border bg-surface p-5 ${accentBorder[accent]}`}>
      <div className="font-display text-3xl font-bold text-text-primary">{value}</div>
      <div className="mt-1 text-sm text-text-secondary">{label}</div>
    </div>
  );
}
