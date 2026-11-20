"use client";

import { ArrowLeft, BookOpenText, FileText, Printer, RotateCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { messageFor } from "@/components/assess/errorMessages";
import { Eyebrow, Section } from "@/components/brand/Section";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CriterionResult, Overall, Paragraph, Rubric } from "@/shared";
import { useAssessment } from "@/state/assessment";
import { anyCached, incompleteCriteria, overallFor, resultsOf, type RunState } from "@/state/runReducer";
import { ComingNext } from "./ComingNext";
import { CachedBadge, CriterionCard } from "./CriterionCard";
import { EvidenceProvider, useEvidence } from "./EvidenceContext";
import { EvidenceViewer } from "./EvidenceViewer";
import { baselineWarnings } from "./format";
import { RunStepper } from "./RunStepper";
import { ScoreSummary } from "./ScoreSummary";
import { WarningBanner } from "./WarningBanner";

/** The Report screen: live progress while judging, then score, warnings and one card per criterion. */
export function ReportView() {
  const { state, run, rerun, retryCard, reset } = useAssessment();
  const router = useRouter();

  if (!state.document || run.phase === "idle") return <EmptyState />;

  const { rubric } = run;
  const overall = overallFor(run);
  const results = resultsOf(run);
  const warnings = rubric ? baselineWarnings(results, rubric) : [];
  const running = run.phase === "scanning" || run.phase === "judging";

  const newAssessment = () => {
    reset();
    router.push("/assess");
  };

  return (
    <EvidenceProvider>
      <Section tone="midnight" className="py-10 md:py-14">
        <Eyebrow className="text-gold">Report</Eyebrow>
        <h1 className="flex items-start gap-3 text-3xl break-words sm:text-4xl">
          <FileText className="mt-1.5 size-7 shrink-0 text-gold" aria-hidden />
          <span className="min-w-0">{state.document.fileName}</span>
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {state.source?.kind === "sample" && (
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/85">
              Fictional sample
            </span>
          )}
          {anyCached(run) && <CachedBadge />}
        </div>
        {(running || run.phase === "failed") && (
          <div className="mt-8" aria-live="polite">
            <RunStepper run={run} />
          </div>
        )}
      </Section>

      <Section tone="surface" className="py-10 md:py-14" innerClassName="space-y-6">
        {run.phase === "failed" && run.error ? (
          <div role="alert" className="rounded-3xl bg-white p-6 ring-1 ring-border">
            <p className="text-status-notfound">
              {run.error.network
                ? "You're offline, or the request timed out. The document couldn't be scanned."
                : messageFor(run.error.code)}
            </p>
            <Button variant="outline" className="mt-4" onClick={rerun}>
              <RotateCw data-icon="inline-start" aria-hidden /> Retry
            </Button>
          </div>
        ) : (
          <ReportBody
            run={run}
            rubric={rubric}
            results={results}
            overall={overall}
            warnings={warnings}
            running={running}
            paragraphs={state.document.paragraphs}
            onRetry={retryCard}
          />
        )}
      </Section>

      {rubric && (
        <Section className="py-12 md:py-16">
          <ComingNext rubric={rubric} />
        </Section>
      )}

      <Section tone="surface" className="py-10">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="gold" size="lg" onClick={rerun} disabled={running}>
            <RotateCw data-icon="inline-start" aria-hidden /> Run again
          </Button>
          <Button variant="outline" size="lg" onClick={newAssessment}>
            <ArrowLeft data-icon="inline-start" aria-hidden /> New assessment
          </Button>
          <Link href="/methodology" className={buttonVariants({ variant: "ghost", size: "lg" })}>
            Methodology &amp; Sources
          </Link>
          {/* Ticket 10 wires Print / Save PDF. */}
          <Button variant="ghost" size="lg" disabled title="Coming soon">
            <Printer data-icon="inline-start" aria-hidden /> Print / Save PDF
          </Button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Not legal advice. Your document was processed in memory and never stored.
        </p>
      </Section>
    </EvidenceProvider>
  );
}

/** Score, warnings and cards, with the evidence viewer beside them (desktop) or over them (mobile). */
function ReportBody({
  run,
  rubric,
  results,
  overall,
  warnings,
  running,
  paragraphs,
  onRetry,
}: {
  run: RunState;
  rubric: Rubric | null;
  results: CriterionResult[];
  overall: Overall | null;
  warnings: ReturnType<typeof baselineWarnings>;
  running: boolean;
  paragraphs: Paragraph[];
  onRetry: (criterion: string) => void;
}) {
  const evidence = useEvidence();
  const open = evidence?.open ?? false;
  return (
    <div className={cn("grid gap-6", open && "lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-8")}>
      <div className="min-w-0 space-y-6">
        {evidence && paragraphs.length > 0 && (
          <div className="flex justify-end print:hidden">
            <Button
              variant="outline"
              onClick={(e) => evidence.toggle(e.currentTarget)}
              aria-expanded={open}
              aria-controls={open ? "evidence-viewer" : undefined}
            >
              <BookOpenText data-icon="inline-start" aria-hidden />
              {open ? "Hide document" : "View document"}
            </Button>
          </div>
        )}
        <WarningBanner warnings={warnings} />
        <ScoreSummary overall={overall} rubric={rubric} missing={incompleteCriteria(run)} running={running} />
        {rubric &&
          run.order.map((id) => {
            const criterion = rubric.criteria.find((c) => c.id === id);
            const card = run.cards[id];
            if (!criterion || !card) return null;
            return <CriterionCard key={id} criterion={criterion} card={card} onRetry={() => onRetry(id)} />;
          })}
      </div>
      <EvidenceViewer paragraphs={paragraphs} results={results} rubric={rubric} />
    </div>
  );
}

function EmptyState() {
  return (
    <Section className="py-24" innerClassName="max-w-xl text-center">
      <h1 className="text-display text-midnight">No report yet</h1>
      <p className="mt-4 text-muted-foreground">
        Reports live only in this browser tab and are never stored, so a reload clears them. Run an assessment to see
        one.
      </p>
      <Link href="/assess" className={cn(buttonVariants({ variant: "gold", size: "xl" }), "mt-8")}>
        Start an assessment
      </Link>
    </Section>
  );
}
