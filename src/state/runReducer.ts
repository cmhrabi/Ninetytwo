// Pure state for one assessment run: scan once, then one judge per criterion in parallel.
// No React, no I/O, so it is unit-tested directly.
import { computeOverall, type CriterionResult, type ErrorCode, type Overall, type Rubric, type ScanResult } from "@/shared";

export type CardState =
  | { kind: "pending" }
  | { kind: "retrying" } // 429: one automatic retry is scheduled
  | { kind: "done"; result: CriterionResult }
  | { kind: "error"; code: ErrorCode; network: boolean }
  | { kind: "unavailable" }; // 501: criterion not served yet

export type RunPhase = "idle" | "scanning" | "judging" | "done" | "failed";

export type RunState = {
  runId: number;
  phase: RunPhase;
  scan: ScanResult | null;
  rubric: Rubric | null;
  cards: Record<string, CardState>; // keyed by criterion id
  order: string[]; // criterion ids in rubric order
  error: { code: ErrorCode; network: boolean } | null; // scan or rubric failed
};

export type RunAction =
  | { type: "run/start"; runId: number }
  | { type: "run/scanned"; runId: number; scan: ScanResult; rubric: Rubric }
  | { type: "run/failed"; runId: number; code: ErrorCode; network: boolean }
  | { type: "card/pending"; runId: number; criterion: string }
  | { type: "card/retrying"; runId: number; criterion: string }
  | { type: "card/done"; runId: number; result: CriterionResult }
  | { type: "card/error"; runId: number; criterion: string; code: ErrorCode; network: boolean }
  | { type: "card/unavailable"; runId: number; criterion: string }
  | { type: "run/reset"; runId: number };

export const initialRun: RunState = {
  runId: 0,
  phase: "idle",
  scan: null,
  rubric: null,
  cards: {},
  order: [],
  error: null,
};

const settled = (c: CardState | undefined) => c !== undefined && c.kind !== "pending" && c.kind !== "retrying";

function withCard(state: RunState, criterion: string, card: CardState): RunState {
  if (!(criterion in state.cards)) return state;
  const cards = { ...state.cards, [criterion]: card };
  const phase = state.order.every((id) => settled(cards[id])) ? "done" : "judging";
  return { ...state, cards, phase };
}

export function runReducer(state: RunState, action: RunAction): RunState {
  if (action.type === "run/start" || action.type === "run/reset") {
    return { ...initialRun, runId: action.runId, phase: action.type === "run/start" ? "scanning" : "idle" };
  }
  if (action.runId !== state.runId) return state; // a stale reply from an earlier run

  switch (action.type) {
    case "run/scanned": {
      const order = action.rubric.criteria.map((c) => c.id);
      const cards = Object.fromEntries(order.map((id) => [id, { kind: "pending" } as CardState]));
      return { ...state, phase: "judging", scan: action.scan, rubric: action.rubric, order, cards, error: null };
    }
    case "run/failed":
      return { ...state, phase: "failed", error: { code: action.code, network: action.network } };
    case "card/pending":
      return withCard(state, action.criterion, { kind: "pending" });
    case "card/retrying":
      return withCard(state, action.criterion, { kind: "retrying" });
    case "card/done":
      return withCard(state, action.result.criterion, { kind: "done", result: action.result });
    case "card/error":
      return withCard(state, action.criterion, { kind: "error", code: action.code, network: action.network });
    case "card/unavailable":
      return withCard(state, action.criterion, { kind: "unavailable" });
  }
}

/** Results that have landed, in rubric order. */
export const resultsOf = (run: RunState): CriterionResult[] =>
  run.order.flatMap((id) => {
    const card = run.cards[id];
    return card?.kind === "done" ? [card.result] : [];
  });

/** Criteria still without a result (pending, failed or unavailable), in rubric order. */
export const incompleteCriteria = (run: RunState): string[] =>
  run.order.filter((id) => run.cards[id]?.kind !== "done");

/** The overall score, only once every criterion has a result. */
export function overallFor(run: RunState): Overall | null {
  if (!run.rubric || run.order.length === 0 || incompleteCriteria(run).length > 0) return null;
  return computeOverall(resultsOf(run), run.rubric);
}

export const anyCached = (run: RunState) => resultsOf(run).some((r) => r.cached);
