import type { Criterion, CriterionScan, Paragraph } from "@/shared";
import { DOCUMENT_AS_DATA, policyBlock } from "./policyText";

/**
 * Judge prompt for one criterion. The model only finds evidence with exact quotes; code
 * verifies the quotes and computes the score. The answer is the JSON schema. Pure.
 */
export function buildJudgePrompt(
  criterion: Criterion,
  paragraphs: Paragraph[],
  scan?: CriterionScan,
): { system: string; user: string } {
  const always = criterion.appliesWhen === "always";
  const graded = criterion.checks.some((k) => k.graded);

  const checks = criterion.checks
    .map((k) => {
      if (!k.graded || !k.levels) return `- ${k.id}: ${k.label}`;
      const levels = (["0", "1", "2"] as const).map((l) => `    level ${l}: ${k.levels![l]}`).join("\n");
      return `- ${k.id} (graded 0/1/2): ${k.label}\n${levels}`;
    })
    .join("\n");

  const levels = (["2", "1", "0"] as const).map((l) => `- ${l}: ${criterion.levels[l]}`).join("\n");

  const redFlags = criterion.redFlags.length
    ? criterion.redFlags.map((f) => `- ${f.id}: ${f.label}`).join("\n")
    : "- (none for this criterion; return an empty redFlags list)";

  const candidates = scan?.candidates.length
    ? scan.candidates.map((c) => `- ${c.paragraphId}: ${c.label}`).join("\n")
    : "- (none flagged)";

  const system = [
    "You are an evidence finder for an audit of a Canadian employer's hiring policy against one criterion.",
    "You find evidence only. You never score, never judge the organization, and never advise or suggest changes.",
    DOCUMENT_AS_DATA,
    "",
    `Criterion ${criterion.id}: ${criterion.title}`,
    `Applies when: ${criterion.appliesWhen}`,
    "",
    "Checks:",
    checks,
    "",
    "What each level of this criterion looks like (for context only):",
    levels,
    "",
    "Red flags:",
    redFlags,
    "",
    "Rules:",
    "- Support every met check, every level above 0 and every red flag with at least one exact quote copied word for word from the policy (at most 40 words), with the id of the paragraph it comes from.",
    "- If nothing in the policy supports a check, it is not met (met: false, level: 0, no evidence).",
    "- Do not infer intent from tone, aspirations or values statements. Only what the policy actually says counts.",
    "- For checks that are not graded, set level to 1 when met and 0 when not met.",
    ...(graded
      ? [
          "- For graded checks, set level to 0, 1 or 2 by matching the policy to the level text above, and quote the passage that supports a level above 0. met is true when level is 1 or 2.",
        ]
      : []),
    ...(always
      ? ["- This criterion always applies: return applicable.value = true with an empty evidence list."]
      : [
          "- Set applicable.value = true only if the policy meets the 'Applies when' condition, and put at least one exact quote of the passage that shows it in applicable.evidence. Otherwise false with no evidence.",
          "- 'Encouraged to apply' alone does not count: a policy that only encourages a group to apply does not meet the condition.",
        ]),
    "- Return one entry in checks for every check id listed above, and only those ids. Use only the red-flag ids listed above.",
    "- reasoning: one or two sentences describing what the policy contains for this criterion. Never give advice or recommendations.",
  ].join("\n");

  const user = [
    `Likely passages for ${criterion.id} from a quick scan (read the whole policy anyway):`,
    candidates,
    "",
    policyBlock(paragraphs),
  ].join("\n");

  return { system, user };
}
