import { cn } from "@/lib/utils";

/**
 * Static score ring: gold arc on a track, percentage in the centre.
 * `tone="dark"` sits on midnight; `tone="light"` on white (arc gets the gold edge for contrast).
 */
export function ScoreRing({
  value,
  label,
  size = 160,
  tone = "dark",
  className,
}: {
  value: number;
  label?: string;
  size?: number;
  tone?: "light" | "dark";
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const stroke = size * 0.085;
  const r = (size - stroke) / 2;
  const dark = tone === "dark";
  return (
    <div
      role="img"
      aria-label={`Score ${pct} percent${label ? `, ${label}` : ""}`}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className={dark ? "stroke-white/12" : "stroke-midnight/10"}
        />
        {pct > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${pct} 100`}
            className={dark ? "stroke-gold" : "stroke-gold-edge"}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn("font-heading font-semibold leading-none", dark ? "text-white" : "text-midnight")}
          style={{ fontSize: size * 0.3 }}
        >
          {pct}
          <span style={{ fontSize: size * 0.14 }}>%</span>
        </span>
        {label && (
          <span
            className={cn("mt-1 font-medium", dark ? "text-gold" : "text-indigo")}
            style={{ fontSize: Math.max(11, size * 0.085) }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
