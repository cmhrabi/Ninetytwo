import type { CriterionResult, Paragraph, ScanResult } from "@/shared";
import { getConfig } from "../config";
import { applyRubric } from "../core/applyRubric";
import { JudgeSchema, type JudgeReply } from "../core/judgeSchema";
import { phraseScan } from "../core/phraseScan";
import { buildJudgePrompt } from "../core/prompt";
import { HttpError } from "../http/errors";
import { readCache } from "./cache";
import { completeJson } from "./openrouter";
import { getCriterion } from "./rubricStore";

/** AI failures that may fall back to a cached sample run. Anything else is a real error. */
const isAiOutage = (err: unknown) =>
  err instanceof HttpError && (err.code === "ai_failed" || err.code === "rate_limited");

/**
 * Stage 3: one judge call for one criterion, then quote check and rubric scoring in code.
 * If the AI is unreachable and the document is one of the sample policies, returns the
 * labelled cached run (`cached: true`) instead; any other document gets the error.
 */
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
  let data: JudgeReply;
  try {
    ({ data } = await completeJson({
      model: getConfig().judgeModel,
      system,
      user,
      schema: JudgeSchema,
      schemaName: "criterion_findings",
      maxTokens: 4000,
    }));
  } catch (err) {
    if (!isAiOutage(err)) throw err;
    const cached = await readCache(paragraphs, criterion.id);
    if (!cached) throw err;
    console.warn(`AI unavailable (${(err as HttpError).message}); serving the cached run for ${criterion.id}`);
    return cached;
  }
  return applyRubric(criterion, data, paragraphs, criterionScan);
}
