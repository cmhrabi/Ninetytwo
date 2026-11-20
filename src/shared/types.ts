// The API contract between src/app/api (Tech B) and the UI (Tech A). Frozen after phase 01:
// changes need both devs to agree (see CLAUDE.md "Working agreements").

// Documents
export type Paragraph = { id: string; text: string }; // "p1", "p2", ...
export type DocumentText = { fileName: string; paragraphs: Paragraph[] };
export type SampleId = "weak" | "partial" | "strong";
export type Sample = { id: SampleId; title: string; summary: string };

// Judge results
export type Evidence = { quote: string; paragraphId: string; verified: boolean };
export type CheckResult = {
  id: string;
  label: string;
  met: boolean; // after verification
  level?: 0 | 1 | 2; // graded checks only (H5), after verification
  evidence: Evidence[]; // verified and unverified; only verified ones count or show
};
export type RedFlag = { id: string; label: string; evidence: Evidence[] }; // verified only
export type Status = "Addressed" | "Partly addressed" | "Not found" | "Not applicable";
export type CriterionResult = {
  criterion: string; // "H1" | "H3" | "H5"
  applicable: boolean;
  score: 0 | 1 | 2 | null; // null when not applicable
  status: Status;
  checks: CheckResult[];
  redFlags: RedFlag[];
  warning: "baseline" | null;
  reasoning: string; // 1-2 sentences describing what was found; never advice
  cached: boolean; // true only for the labelled fallback
};
export type Overall = { percent: number; band: string; warnings: string[] };

// Scan (stage before judging)
export type ScanHit = { paragraphId: string; source: "keyword" | "ai"; label: string };
export type CriterionScan = { criterion: string; candidates: ScanHit[]; redFlags: RedFlag[] }; // verified only
export type ScanResult = { aiScanned: boolean; criteria: CriterionScan[] };

// Requests, health, errors
export type ScanRequest = { paragraphs: Paragraph[] };
export type JudgeRequest = { paragraphs: Paragraph[]; scan?: ScanResult }; // no scan → keyword scan inline
export type Health = { ok: true; judgeModel: string; scanModel: string; keyLoaded: boolean };
export type ErrorCode =
  | "bad_request"
  | "not_found"
  | "unsupported_type"
  | "too_large"
  | "no_text"
  | "rate_limited"
  | "ai_failed"
  | "internal";
export type ApiError = { error: { code: ErrorCode; message: string } }; // every non-2xx body
