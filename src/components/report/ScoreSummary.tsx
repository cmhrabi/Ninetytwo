import { Loader2 } from "lucide-react";
import { ScoreRing } from "@/components/brand/ScoreRing";
import type { Overall, Rubric } from "@/shared";
import { weightsLine } from "./format";

/** Score ring and band, or what is still missing; always with "Not legal advice" and the weights. */
export function ScoreSummary({
  overall,
  rubric,
  missing,
  running,
}: {
  overall: Overall | null;
  rubric: Rubric | null;
  missing: string[];
  running: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-3xl bg-white p-6 ring-1 ring-border sm:flex-row sm:p-8">
      <div className="flex size-[176px] shrink-0 items-center justify-center">
        {overall ? (
          <ScoreRing value={overall.percent} label={overall.band} size={176} tone="light" />
        ) : (
          <div
            className="flex size-[176px] flex-col items-center justify-center rounded-full border-[15px] border-midnight/10 text-center text-sm text-muted-foreground"
            role="status"
          >
            {running ? (
              <>
                <Loader2 className="mb-1 size-5 animate-spin" aria-hidden />
                Scoring…
              </>
            ) : (
              <span className="px-4">Incomplete</span>
            )}
          </div>
        )}
      </div>
      <div className="text-center sm:text-left">
        <p className="text-sm font-medium tracking-[0.12em] text-muted-foreground uppercase">Overall</p>
        {overall ? (
          <p className="mt-1 font-heading text-4xl text-midnight">
            {overall.percent}% · {overall.band}
          </p>
        ) : running ? (
          <p className="mt-1 font-heading text-3xl text-midnight">Working on it</p>
        ) : (
          <p className="mt-1 font-heading text-3xl text-midnight">Incomplete: retry {missing.join(", ")}</p>
        )}
        <p className="mt-2 text-sm font-semibold text-ink">Not legal advice.</p>
        {rubric && (
          <p className="mt-3 text-sm text-muted-foreground">
            {weightsLine(rubric)}; N/A criteria are left out of the total.
          </p>
        )}
      </div>
    </div>
  );
}
