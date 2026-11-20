import { cn } from "@/lib/utils";

/** "92" monogram: serif numerals in gold on a midnight tile. */
export function Monogram({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg bg-midnight font-heading text-lg font-semibold leading-none text-gold ring-1 ring-white/15",
        className,
      )}
    >
      92
    </span>
  );
}

/** NinetyTwo wordmark. `tone="dark"` for midnight backgrounds. */
export function Wordmark({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <span
      className={cn(
        "font-heading text-2xl font-medium leading-none",
        tone === "dark" ? "text-white" : "text-midnight",
        className,
      )}
    >
      Ninety<span className="italic">Two</span>
    </span>
  );
}
