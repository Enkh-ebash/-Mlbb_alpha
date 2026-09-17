export function HeroBackground() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="shard-purple" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7C5CFC" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#7C5CFC" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="shard-teal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="shard-coral" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF6B6B" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FF6B6B" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="shard-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E8B14A" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#E8B14A" stopOpacity="0" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <filter id="glow-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="40" />
        </filter>
      </defs>

      {/* soft ambient glow behind the whole composition */}
      <circle cx="880" cy="260" r="320" fill="url(#shard-purple)" filter="url(#glow-soft)" />
      <circle cx="1050" cy="500" r="220" fill="url(#shard-teal)" filter="url(#glow-soft)" />

      {/* angular shard cluster, diagonal from top-right toward center */}
      <polygon points="700,0 1200,0 1200,380 900,180" fill="url(#shard-purple)" filter="url(#glow)" />
      <polygon points="1000,60 1200,180 1200,460 1050,320" fill="url(#shard-teal)" filter="url(#glow)" opacity="0.85" />
      <polygon points="780,120 980,260 860,420 680,300" fill="url(#shard-coral)" filter="url(#glow)" opacity="0.6" />
      <polygon points="950,420 1150,520 1080,700 900,600" fill="url(#shard-gold)" filter="url(#glow)" opacity="0.55" />

      {/* thin speed lines for motion */}
      <g stroke="#2DD4BF" strokeOpacity="0.35" strokeWidth="2">
        <line x1="600" y1="40" x2="1180" y2="340" />
        <line x1="640" y1="90" x2="1180" y2="380" />
        <line x1="680" y1="140" x2="1180" y2="420" />
      </g>
    </svg>
  );
}
