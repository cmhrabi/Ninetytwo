import { describe, expect, it } from "vitest";
import { MAX_PARAGRAPH_CHARS, toParagraphs } from "./paragraphs";

const texts = (raw: string) => toParagraphs(raw).map((p) => p.text);

describe("toParagraphs", () => {
  it("splits on blank lines and numbers paragraphs in order", () => {
    const result = toParagraphs("First one.\n\nSecond one.\n\n\nThird one.");
    expect(result).toEqual([
      { id: "p1", text: "First one." },
      { id: "p2", text: "Second one." },
      { id: "p3", text: "Third one." },
    ]);
  });

  it("joins hard-wrapped lines inside a paragraph", () => {
    expect(texts("We hire on merit\nand we value\n  diversity.")).toEqual([
      "We hire on merit and we value diversity.",
    ]);
  });

  it("keeps each list item as its own paragraph", () => {
    const raw = "Our commitments:\n- Fair pay\n• Flexible work\n  that continues here\n1. Mentoring\n2) Training";
    expect(texts(raw)).toEqual([
      "Our commitments:",
      "- Fair pay",
      "• Flexible work that continues here",
      "1. Mentoring",
      "2) Training",
    ]);
  });

  it("drops empty items and page numbers", () => {
    expect(texts("Intro.\n\n3\n\nPage 4\n\n5 of 12\n\n   \n\nEnd.")).toEqual(["Intro.", "End."]);
  });

  it("normalizes CRLF and non-breaking spaces", () => {
    expect(texts("One line\r\nwrapped.\r\n\r\nTwo.")).toEqual(["One line wrapped.", "Two."]);
  });

  it("keeps ids sequential after drops", () => {
    expect(toParagraphs("A.\n\n7\n\nB.").map((p) => p.id)).toEqual(["p1", "p2"]);
  });

  it("splits an over-long paragraph at sentence ends, keeping every word", () => {
    const sentence = "Applicants are assessed on merit and the skills the role requires. ";
    const raw = sentence.repeat(200).trim(); // ~13,000 chars, no blank lines (like PDF text)
    const result = texts(raw);
    expect(result.length).toBeGreaterThan(1);
    for (const t of result) {
      expect(t.length).toBeLessThanOrEqual(MAX_PARAGRAPH_CHARS);
      expect(t.endsWith(".")).toBe(true);
    }
    expect(result.join(" ")).toBe(raw);
  });

  it("splits a run-on paragraph with no sentence ends at word boundaries", () => {
    const raw = Array.from({ length: 2000 }, (_, i) => `word${i}`).join(" ");
    const result = texts(raw);
    for (const t of result) expect(t.length).toBeLessThanOrEqual(MAX_PARAGRAPH_CHARS);
    expect(result.join(" ")).toBe(raw);
  });

  it("hard-cuts a long run with no spaces", () => {
    const result = texts("x".repeat(4000));
    expect(result.map((t) => t.length)).toEqual([1500, 1500, 1000]);
  });

  it("leaves paragraphs at the limit alone", () => {
    const raw = "a".repeat(MAX_PARAGRAPH_CHARS);
    expect(texts(raw)).toEqual([raw]);
  });

  it("returns nothing for blank text", () => {
    expect(toParagraphs("  \n\n \t ")).toEqual([]);
  });
});
