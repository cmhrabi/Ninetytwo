import { describe, expect, it } from "vitest";
import { norm, verifyEvidence } from "./quoteCheck";

const paragraphs = [
  { id: "p1", text: "Northwind Freight is an equal opportunity employer." },
  { id: "p2", text: "We don’t discriminate   on the basis of “ancestry” or colour." },
];

describe("norm", () => {
  it("lowercases, straightens quotes and collapses whitespace", () => {
    expect(norm("  We  DON’T\n say “so”  ")).toBe(`we don't say "so"`);
  });
});

describe("verifyEvidence", () => {
  it("verifies an exact quote", () => {
    const e = verifyEvidence({ quote: "is an equal opportunity employer", paragraphId: "p1" }, paragraphs);
    expect(e).toEqual({ quote: "is an equal opportunity employer", paragraphId: "p1", verified: true });
  });

  it("verifies through curly quotes and extra spaces", () => {
    const e = verifyEvidence({ quote: `We don't discriminate on the basis of "ancestry"`, paragraphId: "p2" }, paragraphs);
    expect(e.verified).toBe(true);
  });

  it("corrects a wrong paragraph id", () => {
    const e = verifyEvidence({ quote: "an equal opportunity employer", paragraphId: "p2" }, paragraphs);
    expect(e).toMatchObject({ paragraphId: "p1", verified: true });
  });

  it("rejects a paraphrase", () => {
    const e = verifyEvidence({ quote: "Northwind is an equal-opportunity company", paragraphId: "p1" }, paragraphs);
    expect(e.verified).toBe(false);
  });

  it("rejects quotes under three words", () => {
    expect(verifyEvidence({ quote: "opportunity employer", paragraphId: "p1" }, paragraphs).verified).toBe(false);
    expect(verifyEvidence({ quote: "colour", paragraphId: "p2" }, paragraphs).verified).toBe(false);
  });
});
