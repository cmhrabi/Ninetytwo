// Pure data builders for /methodology, generated from rubric.json so the page always matches the
// scoring. No React, no I/O. Rows name criteria by title or shortTitle, never by id.
import { tierLabel } from "@/components/report/format";
import { computeOverall, type CriterionResult, type Link, type Rubric } from "@/shared";

export type CriterionRow = {
  key: string; // React key only, never rendered
  title: string;
  shortTitle: string;
  tier: string;
  weight: number;
  maxPoints: number;
  whenItCounts: string;
};

export function criteriaRows(rubric: Pick<Rubric, "criteria">): CriterionRow[] {
  return rubric.criteria.map((c) => ({
    key: c.id,
    title: c.title,
    shortTitle: c.shortTitle,
    tier: tierLabel[c.tier],
    weight: c.weight,
    maxPoints: 2 * c.weight,
    whenItCounts: c.appliesWhen.trim().toLowerCase() === "always" ? "Always" : c.appliesWhen,
  }));
}

const urlKey = (url: string) => url.trim().replace(/\/+$/, "").toLowerCase();

/**
 * Every source and resource link in the rubric plus extra links (from content/sources.md),
 * deduplicated by URL (the first title wins) and sorted by title.
 */
export function allSources(rubric: Pick<Rubric, "criteria">, extra: Link[] = []): Link[] {
  const byUrl = new Map<string, Link>();
  const links = [...rubric.criteria.flatMap((c) => [...c.sources, ...c.resources]), ...extra];
  for (const l of links) if (!byUrl.has(urlKey(l.url))) byUrl.set(urlKey(l.url), l);
  return [...byUrl.values()].sort((a, b) => a.title.localeCompare(b.title, "en", { sensitivity: "base" }));
}

export type ExampleRow = { key: string; name: string; weight: number; score: number | null };

/**
 * The worked example: every criterion that always applies scores 1; conditional criteria are N/A.
 * With the current rubric that is 1, N/A, 1 → 50, Developing. Uses the real computeOverall.
 */
export function workedExample(rubric: Pick<Rubric, "criteria" | "bands">) {
  const results: CriterionResult[] = rubric.criteria.map((c) => {
    const applicable = c.tier !== "conditional";
    return {
      criterion: c.id,
      applicable,
      score: applicable ? 1 : null,
      status: applicable ? "Partly addressed" : "Not applicable",
      checks: [],
      redFlags: [],
      warning: null,
      reasoning: "",
      cached: false,
    };
  });
  const rows: ExampleRow[] = rubric.criteria.map((c, i) => ({
    key: c.id,
    name: c.shortTitle,
    weight: c.weight,
    score: results[i].score,
  }));
  const applicable = rows.filter((r) => r.score !== null);
  const earned = applicable.reduce((sum, r) => sum + (r.score ?? 0) * r.weight, 0);
  const possible = applicable.reduce((sum, r) => sum + 2 * r.weight, 0);
  const { percent, band } = computeOverall(results, rubric);
  return { rows, earned, possible, percent, band };
}
