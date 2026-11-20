import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RubricSchema, type CriterionResult } from "@/shared";
import {
  baselineWarnings,
  gapChecks,
  metChecks,
  scoreText,
  tierLabel,
  verifiedEvidence,
  verifiedRedFlags,
  weightsLine,
} from "./format";

const rubric = RubricSchema.parse(JSON.parse(readFileSync("rubric/rubric.json", "utf8")));
const cached = (sample: string, criterion: string): CriterionResult =>
  JSON.parse(readFileSync(`cache/${sample}-${criterion}.json`, "utf8")).result;
const results = (sample: string) => ["H1", "H3", "H5"].map((id) => cached(sample, id));

describe("report format helpers", () => {
  it("labels tiers and scores", () => {
    expect(tierLabel.leading).toBe("Leading practice");
    expect(scoreText({ score: 1, applicable: true })).toBe("1 / 2");
    expect(scoreText({ score: null, applicable: false })).toBe("N/A");
  });

  it("never shows unverified evidence", () => {
    const shown = verifiedEvidence([
      { quote: "real", paragraphId: "p1", verified: true },
      { quote: "invented", paragraphId: "p2", verified: false },
    ]);
    expect(shown.map((e) => e.quote)).toEqual(["real"]);
  });

  it("drops red flags whose quotes are all unverified", () => {
    const r: CriterionResult = {
      ...cached("partial", "H3"),
      redFlags: [
        { id: "a", label: "A", evidence: [{ quote: "q", paragraphId: "p1", verified: true }] },
        { id: "b", label: "B", evidence: [{ quote: "x", paragraphId: "p2", verified: false }] },
      ],
    };
    expect(verifiedRedFlags(r).map((f) => f.id)).toEqual(["a"]);
  });

  it("splits checks into met and gaps", () => {
    const h1 = cached("partial", "H1");
    expect(metChecks(h1).map((c) => c.id)).toEqual(["ban", "grounds"]);
    expect(gapChecks(h1).map((c) => c.id)).toEqual(["eoStatement"]);
  });

  it("builds the weights line from the rubric", () => {
    expect(weightsLine(rubric)).toBe("Prohibits discrimination ×3 · Indigenous-specific hiring ×2 · Retention and advancement ×1");
  });

  it("the partial sample raises exactly one baseline warning (H3)", () => {
    expect(baselineWarnings(results("partial"), rubric).map((w) => w.id)).toEqual(["H3"]);
    expect(baselineWarnings(results("strong"), rubric)).toEqual([]);
  });

  it("the weak sample has H3 not applicable", () => {
    const h3 = cached("weak", "H3");
    expect(h3.applicable).toBe(false);
    expect(scoreText(h3)).toBe("N/A");
  });
});
