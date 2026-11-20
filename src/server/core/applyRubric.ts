import type {
  CheckResult,
  Criterion,
  CriterionResult,
  CriterionScan,
  Paragraph,
  RedFlag,
  Status,
} from "@/shared";
import type { JudgeReply } from "./judgeSchema";
import { verifyEvidence } from "./quoteCheck";

type Score = 0 | 1 | 2;

const STATUS: Record<Score, Status> = { 2: "Addressed", 1: "Partly addressed", 0: "Not found" };

/** Turns the judge's findings into a scored result. Code, not the model, decides. Pure. */
export function applyRubric(
  criterion: Criterion,
  judged: JudgeReply,
  paragraphs: Paragraph[],
  scan?: CriterionScan,
): CriterionResult {
  // 1–3, 10: checks in rubric order; unknown ids ignored, missing ones not met.
  const checks: CheckResult[] = criterion.checks.map((check) => {
    const reply = judged.checks.find((c) => c.id === check.id);
    const evidence = (reply?.evidence ?? []).map((e) => verifyEvidence(e, paragraphs));
    const supported = evidence.some((e) => e.verified);
    if (check.graded) {
      const level: Score = supported && reply ? reply.level : 0;
      return { id: check.id, label: check.label, met: level >= 1, level, evidence };
    }
    return { id: check.id, label: check.label, met: Boolean(reply?.met) && supported, evidence };
  });

  // 4. Red flags: verified evidence only, plus the scan's verified red flags.
  const redFlags: RedFlag[] = [];
  const addFlag = (id: string, label: string, evidence: RedFlag["evidence"]) => {
    const verified = evidence.filter((e) => e.verified);
    if (!verified.length) return;
    const existing = redFlags.find((r) => r.id === id);
    if (!existing) return void redFlags.push({ id, label, evidence: verified });
    for (const e of verified) {
      if (!existing.evidence.some((x) => x.quote === e.quote && x.paragraphId === e.paragraphId)) {
        existing.evidence.push(e);
      }
    }
  };
  for (const flag of judged.redFlags) {
    const def = criterion.redFlags.find((f) => f.id === flag.id);
    if (def) addFlag(def.id, def.label, flag.evidence.map((e) => verifyEvidence(e, paragraphs)));
  }
  for (const flag of scan?.redFlags ?? []) {
    const def = criterion.redFlags.find((f) => f.id === flag.id);
    if (def) addFlag(def.id, def.label, flag.evidence.map((e) => verifyEvidence(e, paragraphs)));
  }

  // 5. Applicability. TODO(05): conditional criteria (appliesWhen !== "always").
  const applicable = true;

  // 6. Scoring. TODO(05): the "average" type for graded checks.
  let score: Score = 0;
  if (criterion.scoring.type === "rules") {
    const met = new Set(checks.filter((c) => c.met).map((c) => c.id));
    const rule = criterion.scoring.rules.find(
      (r) => (r.allOf?.length && r.allOf.every((id) => met.has(id))) || r.anyOf?.some((id) => met.has(id)),
    );
    score = rule?.score ?? 0;
  }
  if (redFlags.length) score = 0;

  // 7–9.
  const warning = redFlags.length || (criterion.warnOnZero && score === 0) ? "baseline" : null;
  return {
    criterion: criterion.id,
    applicable,
    score,
    status: STATUS[score],
    checks,
    redFlags,
    warning,
    reasoning: judged.reasoning.trim(),
    cached: false,
  };
}
