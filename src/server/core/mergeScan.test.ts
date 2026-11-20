import { describe, expect, it } from "vitest";
import rubricJson from "../../../rubric/rubric.json";
import { RubricSchema } from "@/shared";
import { mergeScan } from "./mergeScan";
import { phraseScan } from "./phraseScan";
import type { ScanReply } from "./scanSchema";

const rubric = RubricSchema.parse(rubricJson);
const paragraphs = [
  { id: "p1", text: "We do not discriminate on the basis of ancestry." },
  { id: "p2", text: "All applicants must self-identify on the application form." },
  { id: "p3", text: "New hires get a mentor." },
];
const keyword = phraseScan(paragraphs, rubric);
const get = (id: string, ai: ScanReply | null) => mergeScan(keyword, ai, paragraphs, rubric).criteria.find((c) => c.criterion === id)!;

describe("mergeScan", () => {
  it("unions keyword and AI candidates, dedupes by paragraph and keeps the AI label", () => {
    const ai: ScanReply = {
      criteria: [
        {
          criterion: "H1",
          hits: [
            { paragraphId: "p1", label: "Ban on discrimination" },
            { paragraphId: "p3", label: "Mentorship" },
          ],
          redFlags: [],
        },
      ],
    };
    expect(get("H1", ai).candidates).toEqual([
      { paragraphId: "p1", source: "ai", label: "Ban on discrimination" },
      { paragraphId: "p3", source: "ai", label: "Mentorship" },
    ]);
  });

  it("keeps a red flag only when its quote verifies", () => {
    const ai: ScanReply = {
      criteria: [
        {
          criterion: "H3",
          hits: [],
          redFlags: [
            { id: "identityOnGeneralForms", quote: "must self-identify on the application form", paragraphId: "p2" },
            { id: "employerAloneConfirms", quote: "must show a status card to HR", paragraphId: "p2" },
          ],
        },
      ],
    };
    const h3 = get("H3", ai);
    expect(h3.redFlags).toHaveLength(1);
    expect(h3.redFlags[0]).toMatchObject({ id: "identityOnGeneralForms", label: expect.stringContaining("general application") });
    expect(h3.redFlags[0].evidence[0].verified).toBe(true);
  });

  it("ignores unknown criterion, red-flag and paragraph ids", () => {
    const ai: ScanReply = {
      criteria: [
        { criterion: "H9", hits: [{ paragraphId: "p1", label: "x" }], redFlags: [] },
        {
          criterion: "H1",
          hits: [{ paragraphId: "p99", label: "made up" }],
          redFlags: [{ id: "invented", quote: "We do not discriminate", paragraphId: "p1" }],
        },
      ],
    };
    const result = mergeScan(keyword, ai, paragraphs, rubric);
    expect(result.criteria.map((c) => c.criterion)).toEqual(["H1", "H3", "H5"]);
    const h1 = result.criteria[0];
    expect(h1.candidates.map((c) => c.paragraphId)).toEqual(["p1"]);
    expect(h1.redFlags).toEqual([]);
  });

  it("returns keyword-only results with aiScanned false when the AI is missing", () => {
    const result = mergeScan(keyword, null, paragraphs, rubric);
    expect(result.aiScanned).toBe(false);
    expect(result.criteria[0].candidates).toEqual([{ paragraphId: "p1", source: "keyword", label: "discriminat, ancestry" }]);
    expect(result.criteria.every((c) => c.redFlags.length === 0)).toBe(true);
  });
});
