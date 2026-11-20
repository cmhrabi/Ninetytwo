import { describe, expect, it } from "vitest";
import type { CriterionResult } from "@/shared";
import { findRanges, marksByParagraph, norm, normWithMap, segments, type Mark } from "./highlight";

const check = (quote: string, criterion = "H1"): Mark => ({ quote, criterion, kind: "check" });
const marked = (text: string, marks: Mark[]) => segments(text, marks).filter((s) => s.mark);

describe("normWithMap", () => {
  it("matches norm and maps back to original indices", () => {
    const text = "  We  Don’t\n discriminate. ";
    const { out, map } = normWithMap(text);
    expect(out).toBe(norm(text));
    expect(text[map[out.indexOf("don't")]]).toBe("D");
  });
});

describe("findRanges", () => {
  it("matches across curly quotes, case and whitespace", () => {
    const text = "We are an “Equal   Opportunity”\nemployer.";
    const [[start, end]] = findRanges(text, 'an "equal opportunity" employer');
    expect(text.slice(start, end)).toBe("an “Equal   Opportunity”\nemployer");
  });

  it("strips surrounding quote marks and a trailing full stop from the quote", () => {
    const text = "Harassment is not tolerated.";
    const [[start, end]] = findRanges(text, "“Harassment is not tolerated.”");
    expect(text.slice(start, end)).toBe("Harassment is not tolerated");
  });

  it("returns nothing when the quote is not in the text", () => {
    expect(findRanges("Nothing here.", "a quote that is missing")).toEqual([]);
  });
});

describe("segments", () => {
  it("returns the whole text unmarked when nothing matches", () => {
    expect(segments("Plain text.", [check("not in the text")])).toEqual([{ text: "Plain text." }]);
  });

  it("highlights several quotes in one paragraph", () => {
    const text = "We ban discrimination. We also offer mentoring to new staff.";
    const parts = segments(text, [check("We ban discrimination"), check("offer mentoring to new staff", "H5")]);
    expect(parts.map((p) => p.text).join("")).toBe(text);
    expect(parts.filter((p) => p.mark).map((p) => [p.text, p.mark?.criteria])).toEqual([
      ["We ban discrimination", ["H1"]],
      ["offer mentoring to new staff", ["H5"]],
    ]);
  });

  it("merges overlapping quotes and unions criteria", () => {
    const text = "Roles are open only to Indigenous candidates in all teams.";
    const parts = marked(text, [check("open only to Indigenous", "H1"), check("Indigenous candidates in all", "H3")]);
    expect(parts).toEqual([{ text: "open only to Indigenous candidates in all", mark: { criteria: ["H1", "H3"], flag: false } }]);
  });

  it("marks a merge as a flag when any part is a red flag", () => {
    const text = "Applicants must provide a status card to apply.";
    const parts = marked(text, [
      check("must provide a status card", "H3"),
      { quote: "a status card to apply", criterion: "H3", kind: "flag" },
    ]);
    expect(parts).toEqual([{ text: "must provide a status card to apply", mark: { criteria: ["H3"], flag: true } }]);
  });
});

describe("marksByParagraph", () => {
  const result: CriterionResult = {
    criterion: "H3",
    applicable: true,
    score: 0,
    status: "Not found",
    warning: "baseline",
    reasoning: "",
    cached: false,
    checks: [
      {
        id: "purpose",
        label: "Purpose",
        met: true,
        evidence: [
          { quote: "verified quote here", paragraphId: "p2", verified: true },
          { quote: "unverified quote here", paragraphId: "p3", verified: false },
        ],
      },
    ],
    redFlags: [{ id: "card", label: "Card", evidence: [{ quote: "status card only", paragraphId: "p4", verified: true }] }],
  };

  it("keeps verified check and red-flag quotes only, grouped by paragraph", () => {
    const map = marksByParagraph([result]);
    expect([...map.keys()].sort()).toEqual(["p2", "p4"]);
    expect(map.get("p2")).toEqual([{ quote: "verified quote here", criterion: "H3", kind: "check" }]);
    expect(map.get("p4")).toEqual([{ quote: "status card only", criterion: "H3", kind: "flag" }]);
  });
});
