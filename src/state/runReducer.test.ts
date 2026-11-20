import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RubricSchema, type CriterionResult, type ScanResult } from "@/shared";
import {
  anyCached,
  incompleteCriteria,
  initialRun,
  overallFor,
  resultsOf,
  runReducer,
  type RunAction,
  type RunState,
} from "./runReducer";

const rubric = RubricSchema.parse(JSON.parse(readFileSync("rubric/rubric.json", "utf8")));
const cached = (sample: string, criterion: string): CriterionResult =>
  JSON.parse(readFileSync(`cache/${sample}-${criterion}.json`, "utf8")).result;
const scan: ScanResult = { aiScanned: true, criteria: [] };

const apply = (...actions: RunAction[]) => actions.reduce<RunState>(runReducer, initialRun);
const started = (runId = 1): RunAction[] => [
  { type: "run/start", runId },
  { type: "run/scanned", runId, scan, rubric },
];

describe("runReducer", () => {
  it("creates one pending card per criterion in rubric order", () => {
    const s = apply(...started());
    expect(s.phase).toBe("judging");
    expect(s.order).toEqual(["H1", "H3", "H5"]);
    expect(Object.values(s.cards).every((c) => c.kind === "pending")).toBe(true);
  });

  it("drops replies from an earlier run", () => {
    const s = apply(...started(1), ...started(2), { type: "card/done", runId: 1, result: cached("strong", "H1") });
    expect(s.cards.H1).toEqual({ kind: "pending" });
  });

  it("marks a 501 card unavailable and keeps the overall back", () => {
    const s = apply(
      ...started(),
      { type: "card/done", runId: 1, result: cached("strong", "H1") },
      { type: "card/unavailable", runId: 1, criterion: "H3" },
      { type: "card/done", runId: 1, result: cached("strong", "H5") },
    );
    expect(s.cards.H3).toEqual({ kind: "unavailable" });
    expect(s.phase).toBe("done");
    expect(overallFor(s)).toBeNull();
    expect(incompleteCriteria(s)).toEqual(["H3"]);
  });

  it("one failed card doesn't block the others, and a retry recovers", () => {
    let s = apply(
      ...started(),
      { type: "card/error", runId: 1, criterion: "H1", code: "ai_failed", network: false },
      { type: "card/done", runId: 1, result: cached("partial", "H3") },
      { type: "card/done", runId: 1, result: cached("partial", "H5") },
    );
    expect(resultsOf(s).map((r) => r.criterion)).toEqual(["H3", "H5"]);
    expect(overallFor(s)).toBeNull();
    s = runReducer(s, { type: "card/pending", runId: 1, criterion: "H1" });
    expect(s.phase).toBe("judging");
    s = runReducer(s, { type: "card/done", runId: 1, result: cached("partial", "H1") });
    expect(overallFor(s)?.percent).toBe(58);
  });

  it("records a scan failure", () => {
    const s = apply({ type: "run/start", runId: 1 }, { type: "run/failed", runId: 1, code: "internal", network: true });
    expect(s.phase).toBe("failed");
    expect(s.error).toEqual({ code: "internal", network: true });
  });

  it.each([
    ["weak", 38, "Emerging", 0],
    ["partial", 58, "Developing", 1],
    ["strong", 100, "Leading", 0],
  ] as const)("cached %s results give %i%% %s", (sample, percent, band, warnings) => {
    const s = apply(
      ...started(),
      ...["H1", "H3", "H5"].map((id): RunAction => ({ type: "card/done", runId: 1, result: cached(sample, id) })),
    );
    const overall = overallFor(s);
    expect(overall).toMatchObject({ percent, band });
    expect(overall?.warnings).toHaveLength(warnings);
    expect(anyCached(s)).toBe(true);
  });
});

describe("runReducer with a scoped rubric", () => {
  it("judges and scores only the selected criteria", () => {
    const scoped = { ...rubric, criteria: rubric.criteria.filter((c) => c.id === "H5") };
    const s = apply(
      { type: "run/start", runId: 1 },
      { type: "run/scanned", runId: 1, scan, rubric: scoped },
      { type: "card/done", runId: 1, result: cached("strong", "H1") }, // not selected: ignored
      { type: "card/done", runId: 1, result: cached("strong", "H5") },
    );
    expect(s.order).toEqual(["H5"]);
    expect(s.phase).toBe("done");
    expect(resultsOf(s).map((r) => r.criterion)).toEqual(["H5"]);
    expect(overallFor(s)?.percent).toBe(100);
  });
});

