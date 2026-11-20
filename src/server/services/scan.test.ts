import { afterEach, describe, expect, it, vi } from "vitest";
import { completeJson } from "./openrouter";
import { scanDocument } from "./scan";

vi.mock("./openrouter", () => ({ completeJson: vi.fn() }));
const mocked = vi.mocked(completeJson);

const paragraphs = [
  { id: "p1", text: "We do not discriminate on the basis of ancestry." },
  { id: "p2", text: "New hires are offered a mentor." },
];

afterEach(() => {
  mocked.mockReset();
  vi.restoreAllMocks();
});

describe("scanDocument", () => {
  it("merges the AI scan with the keyword scan", async () => {
    mocked.mockResolvedValueOnce({
      data: { criteria: [{ criterion: "H5", hits: [{ paragraphId: "p2", label: "Mentorship offered" }], redFlags: [] }] },
      model: "m",
      usage: undefined,
    });
    const result = await scanDocument(paragraphs);
    expect(result.aiScanned).toBe(true);
    expect(result.criteria.find((c) => c.criterion === "H5")!.candidates).toEqual([
      { paragraphId: "p2", source: "ai", label: "Mentorship offered" },
    ]);
    expect(mocked.mock.calls[0][0]).toMatchObject({ schemaName: "policy_scan", maxTokens: 4000 });
  });

  it("still returns keyword hits when the AI call rejects", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocked.mockRejectedValueOnce(new Error("boom"));
    const result = await scanDocument(paragraphs);
    expect(result.aiScanned).toBe(false);
    expect(result.criteria.find((c) => c.criterion === "H1")!.candidates).toEqual([
      { paragraphId: "p1", source: "keyword", label: "discriminat, ancestry" },
    ]);
  });
});
