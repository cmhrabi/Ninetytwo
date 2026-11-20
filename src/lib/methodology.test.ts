import { describe, expect, it } from "vitest";
import { computeOverall } from "@/shared";
import { getRubric } from "./content";
import { allSources, criteriaRows, workedExample } from "./methodology";

const rubric = getRubric();
const ids = rubric.criteria.map((c) => c.id);

describe("criteriaRows", () => {
  it("has one row per criterion with max points = 2 × weight", () => {
    const rows = criteriaRows(rubric);
    expect(rows).toHaveLength(rubric.criteria.length);
    for (const r of rows) expect(r.maxPoints).toBe(2 * r.weight);
  });

  it("never puts a criterion id in visible text", () => {
    for (const r of criteriaRows(rubric)) {
      const visible = [r.title, r.shortTitle, r.tier, r.whenItCounts].join(" ");
      for (const id of ids) expect(visible).not.toMatch(new RegExp(`\\b${id}\\b`));
    }
  });
});

describe("allSources", () => {
  it("includes every rubric source and resource URL exactly once", () => {
    const list = allSources(rubric);
    const urls = list.map((l) => l.url.replace(/\/+$/, "").toLowerCase());
    expect(new Set(urls).size).toBe(urls.length);
    for (const c of rubric.criteria) {
      for (const l of [...c.sources, ...c.resources]) {
        expect(urls).toContain(l.url.replace(/\/+$/, "").toLowerCase());
      }
    }
  });

  it("dedupes by URL (trailing slash ignored) and sorts by title", () => {
    const rubricLike = {
      criteria: [
        { ...rubric.criteria[0], sources: [{ title: "beta", url: "https://b.example/" }], resources: [{ title: "Alpha", url: "https://a.example" }] },
      ],
    };
    const list = allSources(rubricLike, [{ title: "Beta again", url: "https://b.example" }, { title: "Gamma", url: "https://g.example" }]);
    expect(list.map((l) => l.title)).toEqual(["Alpha", "beta", "Gamma"]);
  });
});

describe("workedExample", () => {
  it("matches computeOverall: 1, N/A, 1 → 50 Developing", () => {
    const ex = workedExample(rubric);
    expect(ex.rows.map((r) => r.score)).toEqual([1, null, 1]);
    expect(ex.percent).toBe(Math.round((100 * ex.earned) / ex.possible));
    expect(ex).toMatchObject({ percent: 50, band: "Developing" });
    expect(computeOverall([], rubric).percent).toBe(0);
  });
});
