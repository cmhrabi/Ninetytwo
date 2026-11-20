// Pure helpers for the Report page. No React, no I/O, so they are unit-tested directly.
import type { CheckResult, Criterion, CriterionResult, Evidence, RedFlag, Rubric } from "@/shared";

export const tierLabel: Record<Criterion["tier"], string> = {
  baseline: "Baseline",
  conditional: "Conditional",
  leading: "Leading practice",
};

/** "2 / 2", or "N/A" when the criterion doesn't apply. */
export const scoreText = (r: Pick<CriterionResult, "score" | "applicable">) =>
  !r.applicable || r.score === null ? "N/A" : `${r.score} / 2`;

/** Only verified quotes are ever shown. */
export const verifiedEvidence = (items: Evidence[]) => items.filter((e) => e.verified);

/** Checks that count as met (they always carry at least one verified quote after the server's check). */
export const metChecks = (r: CriterionResult): CheckResult[] =>
  r.checks.filter((c) => c.met || (c.level ?? 0) > 0);

/** Checks not met: the gaps. Graded checks below level 2 count as gaps too. */
export const gapChecks = (r: CriterionResult): CheckResult[] =>
  r.checks.filter((c) => (c.level === undefined ? !c.met : c.level < 2));

/** Red flags with at least one verified quote. */
export const verifiedRedFlags = (r: CriterionResult): RedFlag[] =>
  r.redFlags
    .map((f) => ({ ...f, evidence: verifiedEvidence(f.evidence) }))
    .filter((f) => f.evidence.length > 0);

// Criterion ids (H1, H3, H5) are internal keys. The UI always names a criterion by its title or
// shortTitle, never by its id.

/** Short UI name for a criterion id, e.g. "Prohibits discrimination". Falls back to the id only if unknown. */
export const criterionName = (rubric: Pick<Rubric, "criteria">, id: string) =>
  rubric.criteria.find((c) => c.id === id)?.shortTitle ?? id;

/** "Prohibits discrimination ×3 · Indigenous-specific hiring ×2 · Retention and advancement ×1" */
export const weightsLine = (rubric: Pick<Rubric, "criteria">) =>
  rubric.criteria.map((c) => `${c.shortTitle} ×${c.weight}`).join(" · ");

export const cardAnchor = (criterionId: string) => `criterion-${criterionId}`;

/** Baseline warnings as banner lines: one per result whose warning is set, in rubric order. */
export function baselineWarnings(results: CriterionResult[], rubric: Pick<Rubric, "criteria">) {
  return rubric.criteria.flatMap((c) => {
    const r = results.find((x) => x.criterion === c.id);
    if (r?.warning !== "baseline") return [];
    const flagged = verifiedRedFlags(r).length > 0;
    return [
      {
        id: c.id,
        anchor: cardAnchor(c.id),
        text: `${c.shortTitle}: baseline not met${flagged ? ", red flag found" : ""}`,
        title: c.title,
      },
    ];
  });
}

/** True when text is still a team placeholder; the UI shows it as is, but styled as a placeholder. */
export const isTodo = (text: string) => text.trim().startsWith("TODO(team)");
