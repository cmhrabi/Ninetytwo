import { describe, expect, it } from "vitest";
import { docHash } from "./hash";

const doc = [
  { id: "p1", text: "We are an equal opportunity employer." },
  { id: "p2", text: "Hiring managers use the “structured interview” guide." },
];

describe("docHash", () => {
  it("is a stable sha256 hex digest", () => {
    expect(docHash(doc)).toMatch(/^[0-9a-f]{64}$/);
    expect(docHash(doc)).toBe(docHash(structuredClone(doc)));
  });

  it("ignores whitespace and curly-quote differences", () => {
    const reflowed = [
      { id: "p1", text: "  We are an equal\n opportunity   employer. " },
      { id: "p2", text: 'Hiring managers use the "structured interview" guide.' },
    ];
    expect(docHash(reflowed)).toBe(docHash(doc));
  });

  it("ignores paragraph ids", () => {
    expect(docHash(doc.map((p, i) => ({ ...p, id: `p${i + 7}` })))).toBe(docHash(doc));
  });

  it("changes when the text changes", () => {
    const edited = [doc[0], { ...doc[1], text: "Hiring managers use the unstructured interview guide." }];
    expect(docHash(edited)).not.toBe(docHash(doc));
  });

  it("changes when paragraphs are added or split differently", () => {
    expect(docHash([...doc, { id: "p3", text: "Extra." }])).not.toBe(docHash(doc));
    expect(docHash([{ id: "p1", text: `${doc[0].text} ${doc[1].text}` }])).not.toBe(docHash(doc));
  });
});
