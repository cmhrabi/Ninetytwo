import type { Paragraph, ScanResult } from "@/shared";
import { getConfig } from "../config";
import { mergeScan } from "../core/mergeScan";
import { phraseScan } from "../core/phraseScan";
import { buildScanPrompt } from "../core/scanPrompt";
import { ScanSchema, type ScanReply } from "../core/scanSchema";
import { completeJson } from "./openrouter";
import { loadRubric } from "./rubricStore";

/** Stage 2: keyword match plus one fast AI pass. AI failure never blocks judging. */
export async function scanDocument(paragraphs: Paragraph[]): Promise<ScanResult> {
  const rubric = await loadRubric();
  const keyword = phraseScan(paragraphs, rubric);
  const { system, user } = buildScanPrompt(paragraphs, rubric);

  let ai: ScanReply | null = null;
  try {
    const { data } = await completeJson({
      model: getConfig().scanModel,
      system,
      user,
      schema: ScanSchema,
      schemaName: "policy_scan",
      maxTokens: 4000,
    });
    ai = data;
  } catch (err) {
    console.error("AI scan failed; using keyword-only results:", err);
  }
  return mergeScan(keyword, ai, paragraphs, rubric);
}
