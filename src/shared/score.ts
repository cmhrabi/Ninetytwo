import type { Rubric } from "./rubric";
import type { CriterionResult, Overall } from "./types";

type RubricLike = Pick<Rubric, "bands" | "criteria">;

export function bandFor(percent: number, rubric: Pick<Rubric, "bands">): string {
  const band = rubric.bands.find((b) => percent >= b.min && percent <= b.max);
  return band?.label ?? rubric.bands[0]?.label ?? "";
}

/** Overall % = round(100 × Σ(score × weight) ÷ Σ(2 × weight)) over applicable criteria only. */
export function computeOverall(results: CriterionResult[], rubric: RubricLike): Overall {
  let earned = 0;
  let possible = 0;
  const warnings: string[] = [];

  for (const r of results) {
    const criterion = rubric.criteria.find((c) => c.id === r.criterion);
    if (!criterion) continue;
    if (r.warning === "baseline") {
      warnings.push(`${criterion.id}: ${criterion.title}`);
    }
    if (!r.applicable || r.score === null) continue;
    earned += r.score * criterion.weight;
    possible += 2 * criterion.weight;
  }

  const percent = possible === 0 ? 0 : Math.round((100 * earned) / possible);
  return { percent, band: bandFor(percent, rubric), warnings };
}
