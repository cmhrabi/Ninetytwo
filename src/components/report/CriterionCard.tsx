"use client";

import { Circle, CircleCheck, CloudOff, Database, Loader2, RotateCw, TriangleAlert } from "lucide-react";
import { messageFor } from "@/components/assess/errorMessages";
import { StatusChip } from "@/components/brand/StatusChip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CheckResult, Criterion, CriterionResult } from "@/shared";
import type { CardState } from "@/state/runReducer";
import { cardAnchor, gapChecks, scoreText, tierLabel, verifiedEvidence, verifiedRedFlags } from "./format";
import { ColumnHeading, LinkList, Quote, TeamCopy } from "./parts";

const scoreTone: Record<CriterionResult["status"], string> = {
  Addressed: "bg-status-addressed text-white",
  "Partly addressed": "bg-status-partly text-white",
  "Not found": "bg-status-notfound text-white",
  "Not applicable": "bg-status-na-bg text-status-na",
};

/** One criterion: header, reasoning, then Evidence found · Gaps · Where to learn. */
export function CriterionCard({
  criterion,
  card,
  onRetry,
}: {
  criterion: Criterion;
  card: CardState;
  onRetry: () => void;
}) {
  const result = card.kind === "done" ? card.result : null;
  const na = result !== null && !result.applicable;

  return (
    <article
      id={cardAnchor(criterion.id)}
      aria-labelledby={`${cardAnchor(criterion.id)}-title`}
      aria-busy={card.kind === "pending" || card.kind === "retrying"}
      className={cn(
        "scroll-mt-24 rounded-3xl bg-white p-5 ring-1 ring-border sm:p-8",
        na && "bg-surface",
        result?.warning === "baseline" && "ring-2 ring-status-notfound/40",
      )}
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="font-heading text-2xl leading-none text-midnight">{criterion.id}</span>
            <span className="rounded-full bg-surface px-2 py-0.5 ring-1 ring-border">{tierLabel[criterion.tier]}</span>
            <span>Weight ×{criterion.weight}</span>
            {result?.cached && <CachedBadge />}
          </div>
          <h3 id={`${cardAnchor(criterion.id)}-title`} className="text-xl leading-snug text-midnight sm:text-2xl">
            {criterion.title}
          </h3>
        </div>
        {result && (
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={cn("rounded-full px-3 py-1 font-mono text-sm font-semibold", scoreTone[result.status])}
              aria-label={`Score ${scoreText(result)}`}
            >
              {scoreText(result)}
            </span>
            <StatusChip status={result.status} />
          </div>
        )}
      </header>

      <div className="mt-6">
        {card.kind === "done" ? (
          na ? (
            <NotApplicable criterion={criterion} reasoning={card.result.reasoning} />
          ) : (
            <Body criterion={criterion} result={card.result} />
          )
        ) : (
          <CardStatus card={card} onRetry={onRetry} />
        )}
      </div>
    </article>
  );
}

export function CachedBadge() {
  return (
    <span
      title="The AI service was unreachable, so this is a saved result from an earlier live run of this sample."
      className="inline-flex items-center gap-1 rounded-full bg-gold-wash px-2 py-0.5 text-xs font-medium text-gold-edge ring-1 ring-gold-edge/30"
    >
      <Database className="size-3" aria-hidden />
      Cached run
    </span>
  );
}

function Body({ criterion, result }: { criterion: Criterion; result: CriterionResult }) {
  const gaps = gapChecks(result);
  const flags = verifiedRedFlags(result);
  return (
    <>
      {result.reasoning && <p className="max-w-3xl text-ink/85">{result.reasoning}</p>}
      <div className="mt-6 grid gap-8 border-t border-border pt-6 lg:grid-cols-3 lg:gap-10">
        <section>
          <ColumnHeading>Evidence found</ColumnHeading>
          <ul className="space-y-4">
            {result.checks.map((c) => (
              <CheckItem key={c.id} check={c} graded={criterion.checks.find((k) => k.id === c.id)?.graded ?? false} />
            ))}
          </ul>
        </section>
        <section>
          <ColumnHeading>Gaps</ColumnHeading>
          {flags.length > 0 && (
            <ul className="mb-5 space-y-3">
              {flags.map((f) => (
                <li key={f.id} className="rounded-xl bg-status-notfound-bg p-3">
                  <p className="mb-2 flex items-start gap-1.5 text-sm font-medium text-status-notfound">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>
                      <span className="sr-only">Red flag: </span>
                      {f.label}
                    </span>
                  </p>
                  <div className="space-y-2">
                    {f.evidence.map((e, i) => (
                      <Quote key={i} quote={e.quote} paragraphId={e.paragraphId} tone="flag" />
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {gaps.length === 0 && flags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No gaps found for this criterion.</p>
          ) : (
            <>
              {gaps.length > 0 && (
                <ul className="mb-5 list-disc space-y-1.5 pl-5 text-sm marker:text-muted-foreground">
                  {gaps.map((c) => (
                    <li key={c.id}>
                      {c.label}
                      {c.level !== undefined && <span className="text-muted-foreground"> (level {c.level} of 2)</span>}
                    </li>
                  ))}
                </ul>
              )}
              <div className="space-y-4 rounded-xl bg-surface p-4">
                <div>
                  <p className="mb-1 text-xs font-semibold text-midnight">What Addressed looks like</p>
                  <TeamCopy text={criterion.addressedLooksLike} />
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold text-midnight">Why it matters</p>
                  <TeamCopy text={criterion.whyItMatters} />
                  <LinkList links={criterion.sources} className="mt-2" />
                </div>
              </div>
            </>
          )}
        </section>
        <section>
          <ColumnHeading>Where to learn</ColumnHeading>
          <LinkList links={criterion.resources} />
        </section>
      </div>
    </>
  );
}

function CheckItem({ check, graded }: { check: CheckResult; graded: boolean }) {
  const quotes = verifiedEvidence(check.evidence);
  const met = graded ? (check.level ?? 0) > 0 : check.met;
  return (
    <li>
      <p className="flex items-start gap-2 text-sm">
        {met ? (
          <CircleCheck className="mt-0.5 size-4 shrink-0 text-status-addressed" aria-label="Met" />
        ) : (
          <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-label="Not met" />
        )}
        <span className={cn(!met && "text-muted-foreground")}>
          {check.label}
          {graded && <span className="ml-1 font-mono text-xs text-muted-foreground">level {check.level ?? 0}/2</span>}
        </span>
      </p>
      {quotes.length > 0 && (
        <div className="mt-2 ml-6 space-y-2">
          {quotes.map((e, i) => (
            <Quote key={i} quote={e.quote} paragraphId={e.paragraphId} />
          ))}
        </div>
      )}
    </li>
  );
}

function NotApplicable({ criterion, reasoning }: { criterion: Criterion; reasoning: string }) {
  return (
    <div className="space-y-2 text-muted-foreground">
      <p>
        <span className="font-medium text-midnight">Not applicable.</span> Applies only when: {criterion.appliesWhen}
      </p>
      {reasoning && <p className="text-sm">{reasoning}</p>}
      <p className="text-sm">Left out of the total score.</p>
    </div>
  );
}

function CardStatus({ card, onRetry }: { card: Exclude<CardState, { kind: "done" }>; onRetry: () => void }) {
  if (card.kind === "pending" || card.kind === "retrying") {
    return (
      <div className="space-y-3" role="status">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {card.kind === "retrying" ? "Busy, retrying…" : "Looking for evidence…"}
        </p>
        <div className="h-3 w-3/4 animate-pulse rounded-full bg-surface" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-surface" />
      </div>
    );
  }
  if (card.kind === "unavailable") {
    return <p className="text-sm text-muted-foreground">Coming soon: this criterion isn&apos;t scored yet.</p>;
  }
  return (
    <div role="alert" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2 text-sm text-status-notfound">
        {card.network ? (
          <CloudOff className="mt-0.5 size-4 shrink-0" aria-hidden />
        ) : (
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        )}
        {card.network ? "You're offline, or the request timed out." : messageFor(card.code)}
      </p>
      <Button variant="outline" onClick={onRetry}>
        <RotateCw data-icon="inline-start" aria-hidden /> Retry
      </Button>
    </div>
  );
}
