import { cn } from "@/lib/utils";

/**
 * "92" mark: gold numerals inside a score ring, mostly filled with a faded tail at the top left,
 * on a midnight tile with a gold-edge border. Sized by `className` (default size-9).
 */
export function Monogram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn("size-9 shrink-0", className)}>
      <rect x="0.75" y="0.75" width="38.5" height="38.5" rx="9" className="fill-midnight stroke-gold-edge" strokeWidth="1.5" />
      <g transform="rotate(-90 20 20)" fill="none" strokeWidth="2.6" strokeLinecap="round">
        <circle cx="20" cy="20" r="13.5" className="stroke-gold/30" />
        <circle cx="20" cy="20" r="13.5" pathLength={100} strokeDasharray="88 100" className="stroke-gold" />
      </g>
      <text
        x="20"
        y="20.5"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-gold font-heading"
        style={{ fontSize: 13, fontWeight: 650, letterSpacing: "-0.02em" }}
      >
        92
      </text>
    </svg>
  );
}

/**
 * NinetyTwo wordmark: "Ninety" bold roman, "Two" italic in gold.
 * `tone="dark"` for midnight backgrounds (white + gold); light backgrounds use midnight + gold edge,
 * since gold on white fails contrast.
 */
export function Wordmark({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  const dark = tone === "dark";
  return (
    <span className={cn("font-heading text-2xl leading-none font-bold tracking-tight", dark ? "text-white" : "text-midnight", className)}>
      Ninety<span className={cn("font-semibold italic", dark ? "text-gold" : "text-gold-edge")}>Two</span>
    </span>
  );
}

/** Mark + wordmark lockup, as used in the header and footer. */
export function Logo({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Monogram />
      <Wordmark tone={tone} />
    </span>
  );
}
