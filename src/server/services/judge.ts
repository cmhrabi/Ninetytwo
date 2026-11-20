import type { CriterionResult, Paragraph, ScanResult } from "@/shared";
import { getConfig } from "../config";
import { applyRubric } from "../core/applyRubric";
import { JudgeSchema } from "../core/judgeSchema";
import { phraseScan } from "../core/phraseScan";
import { buildJudgePrompt } from "../core/prompt";
import { completeJson } from "./openrouter";
import { getCriterion } from "./rubricStore";

/** Stage 3: one judge call for one criterion, then quote check and rubric scoring in code. */
export async function judgeCriterion(
  id: string,
  paragraphs: Paragraph[],
  scan?: ScanResult,
): Promise<CriterionResult> {
  const criterion = await getCriterion(id);
  const criterionScan = scan
    ? scan.criteria.find((c) => c.criterion === criterion.id)
    : phraseScan(paragraphs, { criteria: [criterion] })[0];

  const { system, user } = buildJudgePrompt(criterion, paragraphs, criterionScan);
  const { data } = await completeJson({
    model: getConfig().judgeModel,
    system,
    user,
    schema: JudgeSchema,
    schemaName: "criterion_findings",
    maxTokens: 4000,
  });
  return applyRubric(criterion, data, paragraphs, criterionScan);
}
