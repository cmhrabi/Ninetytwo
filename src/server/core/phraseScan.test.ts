import { describe, expect, it } from "vitest";
import rubricJson from "../../../rubric/rubric.json";
import { RubricSchema } from "@/shared";
import { phraseScan } from "./phraseScan";

const rubric = RubricSchema.parse(rubricJson);
const ps = (...texts: string[]) => texts.map((text, i) => ({ id: `p${i + 1}`, text }));
const forCriterion = (id: string, texts: string[]) =>
  phraseScan(ps(...texts), rubric).find((c) => c.criterion === id)!;

describe("phraseScan", () => {
  it("returns one entry per rubric criterion, with no confirmed red flags", () => {
    const scan = phraseScan(ps("Nothing relevant here."), rubric);
    expect(scan.map((c) => c.criterion)).toEqual(["H1", "H3", "H5"]);
    expect(scan.every((c) => c.redFlags.length === 0)).toBe(true);
  });

  it("matches the discriminat stem, case-insensitively", () => {
    const h1 = forCriterion("H1", ["We hire well.", "We prohibit DISCRIMINATION in hiring."]);
    expect(h1.candidates).toEqual([{ paragraphId: "p2", source: "keyword", label: "discriminat" }]);
  });

  it("is accent-insensitive both ways", () => {
    expect(forCriterion("H1", ["Open to Metis applicants."]).candidates[0].label).toContain("Métis");
    expect(forCriterion("H1", ["Open to MÉTIS applicants."]).candidates).toHaveLength(1);
  });

  it("turns red-flag phrases into candidates only", () => {
    const h3 = forCriterion("H3", ["Please provide documentation of your status."]);
    expect(h3.candidates).toEqual([
      { paragraphId: "p1", source: "keyword", label: "redflag:employerAloneConfirms" },
    ]);
    expect(h3.redFlags).toEqual([]);
  });
});
