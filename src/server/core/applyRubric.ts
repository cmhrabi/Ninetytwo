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

  // 5. Applicability: conditional criteria apply only when the model says so AND quotes it.
  if (criterion.appliesWhen !== "always") {
    const shown = judged.applicable.evidence.some((e) => verifyEvidence(e, paragraphs).verified);
    if (!judged.applicable.value || !shown) return notApplicable(criterion, judged);
  }

  // 6. Scoring.
  let score: Score = 0;
  if (criterion.scoring.type === "rules") {
    const met = new Set(checks.filter((c) => c.met).map((c) => c.id));
    const rule = criterion.scoring.rules.find(
      (r) => (r.allOf?.length && r.allOf.every((id) => met.has(id))) || r.anyOf?.some((id) => met.has(id)),
    );
    score = rule?.score ?? 0;
  } else {
    score = averageLevel(checks);
    const cap = criterion.scoring.capAt1Unless;
    if (cap && (checks.find((c) => c.id === cap)?.level ?? 0) < 1) score = Math.min(score, 1) as Score;
  }
  if (redFlags.length) score = 0;

  // 7–9.
  const warning = redFlags.length || (criterion.warnOnZero && score === 0) ? "baseline" : null;
  return {
    criterion: criterion.id,
    applicable: true,
    score,
    status: STATUS[score],
    checks,
    redFlags,
    warning,
    reasoning: judged.reasoning.trim(),
    cached: false,
  };
}

/** Mean of the graded levels, rounded half up (1.5 → 2, 0.5 → 1, 0.25 → 0). Integer math. */
function averageLevel(checks: CheckResult[]): Score {
  if (!checks.length) return 0;
  const sum = checks.reduce((total, c) => total + (c.level ?? 0), 0);
  return Math.min(2, Math.floor((2 * sum + checks.length) / (2 * checks.length))) as Score;
}

/** A conditional criterion that doesn't apply: no score, no evidence, no red flags, no warning. */
function notApplicable(criterion: Criterion, judged: JudgeReply): CriterionResult {
  return {
    criterion: criterion.id,
    applicable: false,
    score: null,
    status: "Not applicable",
    checks: criterion.checks.map((k) => ({
      id: k.id,
      label: k.label,
      met: false,
      ...(k.graded ? { level: 0 as const } : {}),
      evidence: [],
    })),
    redFlags: [],
    warning: null,
    reasoning: judged.reasoning.trim(),
    cached: false,
  };
}
