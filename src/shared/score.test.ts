import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RubricSchema } from "./rubric";
import { bandFor, computeOverall } from "./score";
import type { CriterionResult } from "./types";

const rubric = RubricSchema.parse(JSON.parse(readFileSync("rubric/rubric.json", "utf8")));

function result(criterion: string, score: 0 | 1 | 2 | null, warning: "baseline" | null = null): CriterionResult {
  return {
    criterion,
    applicable: score !== null,
    score,
    status: score === null ? "Not applicable" : score === 2 ? "Addressed" : score === 1 ? "Partly addressed" : "Not found",
    checks: [],
    redFlags: [],
    warning,
    reasoning: "",
    cached: false,
  };
}

describe("computeOverall", () => {
  it.each([
    ["CLAUDE.md example", 1, null, 1, 50, "Developing"],
    ["weak sample", 1, null, 0, 38, "Emerging"],
    ["partial sample", 2, 0, 1, 58, "Developing"],
    ["strong sample", 2, 2, 2, 100, "Leading"],
    ["everything zero", 0, 0, 0, 0, "Emerging"],
  ] as const)("%s → %i%% %s", (_name, h1, h3, h5, percent, band) => {
    const overall = computeOverall([result("H1", h1), result("H3", h3), result("H5", h5)], rubric);
    expect(overall.percent).toBe(percent);
    expect(overall.band).toBe(band);
  });

  it("returns 0, not NaN, when nothing applies", () => {
    const overall = computeOverall([result("H3", null)], rubric);
    expect(overall.percent).toBe(0);
    expect(overall.band).toBe("Emerging");
  });

  it("collects one warning per baseline result", () => {
    const overall = computeOverall(
      [result("H1", 0, "baseline"), result("H3", 0, "baseline"), result("H5", 2)],
      rubric,
    );
    expect(overall.warnings).toHaveLength(2);
    expect(overall.warnings[0]).toMatch(/^H1:/);
  });

  it("ignores criteria that are not in the rubric", () => {
    expect(computeOverall([result("H1", 2), result("ZZ", 0)], rubric).percent).toBe(100);
  });
});

describe("bandFor", () => {
  it.each([
    [39, "Emerging"],
    [40, "Developing"],
    [59, "Developing"],
    [60, "Established"],
    [79, "Established"],
    [80, "Leading"],
    [100, "Leading"],
  ])("%i → %s", (percent, band) => {
    expect(bandFor(percent, rubric)).toBe(band);
  });
});
