export type Disruption = "normal" | "hormuz" | "redsea";

const NODES: { id: string; x: number; y: number; label: string; kind?: "choke" | "port" | "spr" }[] =
  [
    { id: "ras", x: 300, y: 170, label: "Ras Tanura" },
    { id: "hormuz", x: 362, y: 196, label: "Strait of Hormuz", kind: "choke" },
    { id: "bab", x: 252, y: 300, label: "Bab-el-Mandeb", kind: "choke" },
    { id: "jamnagar", x: 468, y: 236, label: "Jamnagar Refinery", kind: "port" },
    { id: "mumbai", x: 492, y: 292, label: "Mumbai Port", kind: "port" },
    { id: "mangalore", x: 502, y: 336, label: "Mangalore SPR Cavern", kind: "spr" },
    { id: "kochi", x: 516, y: 372, label: "Kochi Port", kind: "port" },
    { id: "paradip", x: 606, y: 262, label: "Paradip Port", kind: "port" },
  ];

const LANDS = [
  // Arabia / Middle East
  "M215 120 L340 118 L392 190 L330 250 L250 262 L206 200 Z",
  // Africa
  "M120 190 L210 172 L246 300 L300 400 L282 496 L214 520 L150 430 L110 300 Z",
  // India
  "M430 200 L560 196 L628 250 L560 320 L520 392 L470 300 Z",
  // South-East Asia
  "M690 250 L810 262 L836 350 L760 404 L700 340 Z",
];

export function MaritimeMap({ disruption = "normal" as Disruption }: { disruption?: Disruption }) {
  const crisis = disruption !== "normal";
  const gulfBlocked = disruption === "hormuz";
  const redSeaHot = disruption === "redsea";

  return (
    <div className="relative h-[520px] w-full overflow-hidden rounded-2xl border border-border/70 bg-[oklch(0.16_0.026_262)] shadow-card">
      <svg viewBox="0 0 1000 560" className="h-full w-full">
        <defs>
          <radialGradient id="mm-sea" cx="50%" cy="40%">
            <stop offset="0%" stopColor="oklch(0.28 0.05 235)" />
            <stop offset="100%" stopColor="oklch(0.15 0.03 262)" />
          </radialGradient>
          <filter id="mm-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="1000" height="560" fill="url(#mm-sea)" />
        {Array.from({ length: 19 }).map((_, i) => (
          <line
            key={`h${i}`}
            x1={0}
            x2={1000}
            y1={i * 30}
            y2={i * 30}
            stroke="oklch(0.98 0.02 190 / 0.05)"
          />
        ))}
        {Array.from({ length: 34 }).map((_, i) => (
          <line
            key={`v${i}`}
            y1={0}
            y2={560}
            x1={i * 30}
            x2={i * 30}
            stroke="oklch(0.98 0.02 190 / 0.05)"
          />
        ))}

        {LANDS.map((d) => (
          <path
            key={d}
            d={d}
            fill="oklch(0.26 0.02 250)"
            stroke="oklch(0.45 0.03 200 / 0.6)"
            strokeWidth="1.2"
          />
        ))}

        {/* Persian Gulf -> Jamnagar */}
        <path
          d="M300 170 Q352 190 362 196 Q420 210 468 236"
          fill="none"
          strokeLinecap="round"
          strokeWidth={gulfBlocked ? 5 : 3.5}
          stroke={gulfBlocked ? "#f43f5e" : "#38bdf8"}
          strokeDasharray={gulfBlocked ? "12 10" : "0"}
          className={gulfBlocked ? "animate-pulse" : ""}
          filter={gulfBlocked ? "url(#mm-glow)" : undefined}
        />

        {/* Red Sea / Bab-el-Mandeb -> Mumbai & Kochi */}
        <path
          d="M252 300 Q380 268 492 292"
          fill="none"
          strokeLinecap="round"
          strokeWidth={redSeaHot ? 5 : 3.5}
          stroke={redSeaHot ? "#f59e0b" : "#38bdf8"}
          strokeDasharray={redSeaHot ? "12 10" : "0"}
          className={redSeaHot ? "animate-pulse" : ""}
          filter={redSeaHot ? "url(#mm-glow)" : undefined}
        />
        <path
          d="M252 300 Q390 356 516 372"
          fill="none"
          strokeLinecap="round"
          strokeWidth={redSeaHot ? 5 : 3.5}
          stroke={redSeaHot ? "#f59e0b" : "#38bdf8"}
          strokeDasharray={redSeaHot ? "12 10" : "0"}
          className={redSeaHot ? "animate-pulse" : ""}
        />

        {/* Cape of Good Hope contingency */}
        <path
          d="M215 175 Q90 300 200 520 Q400 600 516 372"
          fill="none"
          strokeLinecap="round"
          strokeWidth={crisis ? 5 : 2.5}
          stroke={crisis ? "#10b981" : "oklch(0.6 0.03 200 / 0.45)"}
          strokeDasharray={crisis ? "0" : "8 10"}
          className={crisis ? "animate-pulse" : ""}
          filter={crisis ? "url(#mm-glow)" : undefined}
        />

        {/* Far-East Malacca -> Paradip */}
        <path
          d="M810 330 Q760 404 700 372 Q650 320 606 262"
          fill="none"
          strokeLinecap="round"
          strokeWidth="3.5"
          stroke="#38bdf8"
        />

        {NODES.map((n) => {
          const hot =
            (n.id === "hormuz" && gulfBlocked) || (n.id === "bab" && redSeaHot);
          const color =
            n.kind === "choke"
              ? hot
                ? "#f43f5e"
                : "#94a3b8"
              : n.kind === "spr"
                ? "#10b981"
                : "#e2e8f0";
          return (
            <g key={n.id}>
              {hot && (
                <circle cx={n.x} cy={n.y} r="18" fill="#f43f5e" opacity="0.35" className="animate-ping" />
              )}
              <circle
                cx={n.x}
                cy={n.y}
                r={n.kind === "choke" ? 7 : 6}
                fill={color}
                stroke="oklch(0.16 0.026 262)"
                strokeWidth="2.5"
                filter={hot ? "url(#mm-glow)" : undefined}
              />
              <text
                x={n.x + 12}
                y={n.y + 4}
                fontSize="12.5"
                fontWeight="600"
                fill="oklch(0.92 0.01 240)"
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="absolute bottom-4 left-4 space-y-2 rounded-xl border border-border/70 bg-card/85 p-3 text-xs backdrop-blur">
        <p className="font-semibold">Legend</p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <span className="h-0.5 w-6 rounded bg-[#38bdf8]" /> Standard Sea Lane
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <span className="h-0.5 w-6 rounded bg-[#10b981]" /> AI Cape Contingency Reroute
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <span className="h-0.5 w-6 rounded bg-[#f43f5e]" /> Chokepoint Disruption Zone
        </p>
      </div>
    </div>
  );
}

export default MaritimeMap;
