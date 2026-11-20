import { afterEach, describe, expect, it, vi } from "vitest";
import type { ApiError, ScanResult } from "@/shared";
import { completeJson } from "@/server/services/openrouter";
import { POST } from "./route";

vi.mock("@/server/services/openrouter", () => ({ completeJson: vi.fn() }));
const mocked = vi.mocked(completeJson);

const post = (body: unknown) =>
  POST(new Request("http://localhost/api/scan", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) }));

afterEach(() => mocked.mockReset());

describe("POST /api/scan", () => {
  for (const [name, body] of [
    ["not JSON", "{"],
    ["no paragraphs", { paragraphs: [] }],
    ["bad paragraph id", { paragraphs: [{ id: "x1", text: "hi" }] }],
    ["text too long", { paragraphs: [{ id: "p1", text: "a".repeat(5001) }] }],
  ] as const) {
    it(`400s on ${name}`, async () => {
      const res = await post(body);
      expect(res.status).toBe(400);
      expect(((await res.json()) as ApiError).error.code).toBe("bad_request");
    });
  }

  it("returns a ScanResult, stripping PII before the AI sees it", async () => {
    mocked.mockResolvedValueOnce({ data: { criteria: [] }, model: "m", usage: undefined });
    const res = await post({ paragraphs: [{ id: "p1", text: "We do not discriminate. Mail hr@example.com." }] });
    expect(res.status).toBe(200);
    const body = (await res.json()) as ScanResult;
    expect(body.aiScanned).toBe(true);
    expect(body.criteria[0].candidates[0].paragraphId).toBe("p1");
    expect(mocked.mock.calls[0][0].user).not.toContain("hr@example.com");
  });
});
