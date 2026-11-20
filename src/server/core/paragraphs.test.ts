import { describe, expect, it } from "vitest";
import { toParagraphs } from "./paragraphs";

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

  it("returns nothing for blank text", () => {
    expect(toParagraphs("  \n\n \t ")).toEqual([]);
  });
});
