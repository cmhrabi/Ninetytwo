import { ScoreRing } from "@/components/brand/ScoreRing";
import { StatusChip } from "@/components/brand/StatusChip";
import { cn } from "@/lib/utils";

/**
 * Hero illustration of the report. Clearly labelled as an example; not a score for any document.
 * Numbers are consistent with the rubric: discrimination 2 (×3), Indigenous-specific hiring N/A,
 * retention 1 (×1) → 7 / 8 = 88%, Leading. Criteria are named, never shown by id (H1...).
 */
export function ExamplePreview({ className }: { className?: string }) {
  return (
    <figure
      className={cn(
        "relative w-full max-w-sm rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/15 backdrop-blur-sm sm:p-8",
        className,
      )}
    >
      <figcaption className="mb-6 flex items-center justify-between text-xs font-medium tracking-[0.14em] text-white/60 uppercase">
        <span>Example report</span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 tracking-normal normal-case">Illustration</span>
      </figcaption>
      <div className="flex justify-center">
        <ScoreRing value={88} label="Leading" size={176} />
      </div>
      <ul className="mt-8 space-y-3">
        {[
          { name: "Prohibits discrimination", status: "Addressed" as const },
          { name: "Indigenous-specific hiring", status: "Not applicable" as const },
          { name: "Retention and advancement", status: "Partly addressed" as const },
        ].map((c) => (
          <li key={c.name} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 text-ink">
            <span className="min-w-0 text-sm leading-snug font-medium text-midnight">{c.name}</span>
            <StatusChip status={c.status} className="shrink-0 text-xs" />
          </li>
        ))}
      </ul>
    </figure>
  );
}
