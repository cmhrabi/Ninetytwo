"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { marksByParagraph, segments, type SegmentMark } from "@/lib/highlight";
import { cn } from "@/lib/utils";
import type { CriterionResult, Paragraph, Rubric } from "@/shared";
import { useEvidence } from "./EvidenceContext";
import { cardAnchor, criterionName } from "./format";

/** Highlight colours by criterion position in the rubric. Red flags always use the flag style (gold, wavy underline). */
const palette = [
  "bg-gold-wash decoration-gold-edge",
  "bg-surface decoration-indigo",
  "bg-midnight/10 decoration-midnight",
];
const flagStyle = "bg-gold/45 text-midnight decoration-gold-edge decoration-wavy";

const subscribeMedia = (query: string) => (onChange: () => void) => {
  const mql = window.matchMedia(query);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
};
function useMedia(query: string) {
  return useSyncExternalStore(
    subscribeMedia(query),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const paragraphAnchor = (id: string) => `doc-${id}`;

/**
 * The document with every verified quote highlighted. Desktop: a sticky right-hand pane.
 * Mobile: a full-screen sheet. Text is rendered as React nodes, never as HTML.
 */
export function EvidenceViewer({
  paragraphs,
  results,
  rubric,
}: {
  paragraphs: Paragraph[];
  results: CriterionResult[];
  rubric: Rubric | null;
}) {
  const evidence = useEvidence();
  const desktop = useMedia("(min-width: 1024px)");
  const reduceMotion = useMedia("(prefers-reduced-motion: reduce)");
  const scroller = useRef<HTMLDivElement>(null);
  const open = evidence?.open ?? false;
  const target = evidence?.target ?? null;
  const close = evidence?.close;

  const marks = useMemo(() => marksByParagraph(results), [results]);
  const colourOf = (criterion: string) => {
    const i = rubric?.criteria.findIndex((c) => c.id === criterion) ?? -1;
    return palette[(i < 0 ? 0 : i) % palette.length];
  };
  const nameOf = (criterion: string) => (rubric ? criterionName(rubric, criterion) : "");

  // Scroll the target paragraph to the centre of the pane, then move focus to it.
  useEffect(() => {
    if (!open || !target) return;
    const el = document.getElementById(paragraphAnchor(target.id));
    const box = scroller.current;
    if (!el || !box) return;
    const top = el.offsetTop - box.clientHeight / 2 + el.offsetHeight / 2;
    box.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? "auto" : "smooth" });
    el.focus({ preventScroll: true });
  }, [open, target, reduceMotion]);

  // Esc closes the viewer.
  useEffect(() => {
    if (!open || !close) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // The mobile sheet covers the page, so the page behind it shouldn't scroll.
  useEffect(() => {
    if (!open || desktop) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, desktop]);

  if (!evidence || !open) return null;

  const jumpToCard = (mark: SegmentMark) => {
    const card = document.getElementById(cardAnchor(mark.criteria[0]));
    if (!card) return;
    if (!desktop) evidence.close();
    card.setAttribute("tabindex", "-1");
    card.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    card.focus({ preventScroll: true });
  };

  const usedCriteria = rubric?.criteria.filter((c) => results.some((r) => r.criterion === c.id)) ?? [];
  const anyFlag = [...marks.values()].some((list) => list.some((m) => m.kind === "flag"));

  return (
    <aside
      id="evidence-viewer"
      aria-labelledby="evidence-viewer-title"
      role={desktop ? "complementary" : "dialog"}
      aria-modal={desktop ? undefined : true}
      className={cn(
        "flex flex-col bg-white print:hidden",
        "fixed inset-0 z-[60]",
        "lg:sticky lg:inset-auto lg:top-20 lg:z-auto lg:max-h-[calc(100vh-6rem)] lg:self-start lg:rounded-3xl lg:ring-1 lg:ring-border",
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 id="evidence-viewer-title" className="text-xl text-midnight">
            Document
          </h2>
          <ul aria-label="Highlight legend" className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {usedCriteria.map((c) => (
              <li key={c.id} className="flex items-center gap-1.5">
                <span className={cn("size-3 rounded-sm ring-1 ring-black/10", colourOf(c.id))} aria-hidden />
                {c.shortTitle}
              </li>
            ))}
            {anyFlag && (
              <li className="flex items-center gap-1.5">
                <span className={cn("size-3 rounded-sm ring-1 ring-black/10", flagStyle)} aria-hidden />
                Red flag
              </li>
            )}
          </ul>
        </div>
        <Button variant="ghost" size="icon" onClick={evidence.close} aria-label="Close document">
          <X aria-hidden />
        </Button>
      </header>

      <div ref={scroller} className="relative min-h-0 flex-1 overflow-y-auto px-2 py-3 sm:px-3">
        <ol className="space-y-1">
          {paragraphs.map((p) => {
            const pulse = target?.id === p.id;
            return (
              <li
                key={pulse ? `${p.id}-${target.nonce}` : p.id}
                id={paragraphAnchor(p.id)}
                tabIndex={-1}
                aria-label={`Paragraph ${p.id.replace(/^p/, "")}`}
                className={cn(
                  "grid grid-cols-[2.75rem_1fr] gap-2 rounded-xl px-2 py-2 text-sm leading-relaxed text-ink outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  pulse && "evidence-pulse",
                )}
              >
                <span className="pt-0.5 text-right font-mono text-xs text-muted-foreground select-none" aria-hidden>
                  {p.id}
                </span>
                <p className="min-w-0 break-words whitespace-pre-wrap">
                  {segments(p.text, marks.get(p.id) ?? []).map((s, i) =>
                    s.mark ? (
                      <mark
                        key={i}
                        role="button"
                        tabIndex={0}
                        title={`${s.mark.flag ? "Red flag · " : ""}${s.mark.criteria.map(nameOf).join(", ")}`}
                        onClick={() => jumpToCard(s.mark!)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            jumpToCard(s.mark!);
                          }
                        }}
                        className={cn(
                          "cursor-pointer rounded-sm px-0.5 text-inherit underline decoration-2 underline-offset-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          s.mark.flag ? flagStyle : colourOf(s.mark.criteria[0]),
                        )}
                      >
                        {s.text}
                        <span className="sr-only">
                          {` (${s.mark.flag ? "red flag, " : ""}evidence for ${s.mark.criteria.map(nameOf).join(", ")}; go to its card)`}
                        </span>
                      </mark>
                    ) : (
                      <span key={i}>{s.text}</span>
                    ),
                  )}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}
