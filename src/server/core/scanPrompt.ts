import type { Paragraph, Rubric } from "@/shared";
import { DOCUMENT_AS_DATA, policyBlock } from "./policyText";

/** Prompt for the one fast whole-document scan. Evidence locations only. Pure. */
export function buildScanPrompt(
  paragraphs: Paragraph[],
  rubric: Pick<Rubric, "criteria">,
): { system: string; user: string } {
  const criteria = rubric.criteria
    .map((c) => {
      const checks = c.checks.map((k) => `  - check ${k.id}: ${k.label}`).join("\n");
      const flags = c.redFlags.length
        ? c.redFlags.map((f) => `  - red flag ${f.id}: ${f.label}`).join("\n")
        : "  - (no red flags for this criterion)";
      return `Criterion ${c.id}: ${c.title}\n${checks}\n${flags}`;
    })
    .join("\n\n");

  const system = [
    "You are an evidence locator for a hiring-policy audit.",
    "For each criterion below, list the paragraphs of the policy that are relevant to any of its checks, each with a short label of at most 8 words saying what the paragraph covers.",
    "For each red flag you find, copy an exact quote from the policy (at most 40 words, word for word, no paraphrase) and give its paragraph id.",
    "Use only the criterion ids, red-flag ids and paragraph ids given. Return one entry per criterion, with empty lists when nothing is relevant.",
    "Never score, never judge compliance, never advise or suggest changes.",
    DOCUMENT_AS_DATA,
    "",
    criteria,
  ].join("\n");

  const user = `Locate the evidence in this policy.\n\n${policyBlock(paragraphs)}`;
  return { system, user };
}
