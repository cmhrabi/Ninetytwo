import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RubricSchema } from "./rubric";

const raw = () => JSON.parse(readFileSync("rubric/rubric.json", "utf8"));

describe("RubricSchema", () => {
  it("accepts the real rubric/rubric.json", () => {
    const rubric = RubricSchema.parse(raw());
    expect(rubric.criteria.map((c) => c.id)).toEqual(["H1", "H3", "H5"]);
    expect(rubric.criteria.map((c) => c.weight)).toEqual([3, 2, 1]);
  });

  it("rejects a rule that names an unknown check", () => {
    const bad = raw();
    bad.criteria[0].scoring.rules[0].allOf = ["ban", "nope"];
    const parsed = RubricSchema.safeParse(bad);
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues.map((i) => i.message)).toContain('H1: unknown check id "nope"');
  });

  it("rejects capAt1Unless that names an unknown check", () => {
    const bad = raw();
    bad.criteria[2].scoring.capAt1Unless = "z";
    expect(RubricSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects average scoring with an ungraded check", () => {
    const bad = raw();
    bad.criteria[2].checks[0].graded = false;
    expect(RubricSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a gap in the bands", () => {
    const bad = raw();
    bad.bands[1].min = 41;
    expect(RubricSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects bands that stop short of 100", () => {
    const bad = raw();
    bad.bands[3].max = 99;
    expect(RubricSchema.safeParse(bad).success).toBe(false);
  });
});
