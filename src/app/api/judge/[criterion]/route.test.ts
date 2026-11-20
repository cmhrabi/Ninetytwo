import { afterEach, describe, expect, it, vi } from "vitest";
import type { ApiError, CriterionResult } from "@/shared";
import { HttpError } from "@/server/http/errors";
import { completeJson } from "@/server/services/openrouter";
import { POST } from "./route";

vi.mock("@/server/services/openrouter", () => ({ completeJson: vi.fn() }));
const mocked = vi.mocked(completeJson);

const paragraphs = [{ id: "p1", text: "We do not discriminate in hiring on the basis of ancestry, colour or creed." }];
const post = (criterion: string, body: unknown) =>
  POST(new Request(`http://localhost/api/judge/${criterion}`, { method: "POST", body: JSON.stringify(body) }), {
    params: Promise.resolve({ criterion }),
  });

afterEach(() => mocked.mockReset());

describe("POST /api/judge/[criterion]", () => {
  it("404s an unknown criterion", async () => {
    const res = await post("H9", { paragraphs });
    expect(res.status).toBe(404);
    expect(((await res.json()) as ApiError).error.code).toBe("not_found");
  });

  it("400s on a bad body", async () => {
    const res = await post("H1", { paragraphs: "nope" });
    expect(res.status).toBe(400);
  });

  it("returns a CriterionResult for H1", async () => {
    mocked.mockResolvedValueOnce({
      data: {
        applicable: { value: true, evidence: [] },
        checks: [
          { id: "ban", met: true, level: 1, evidence: [{ quote: "We do not discriminate in hiring", paragraphId: "p1" }] },
          { id: "grounds", met: true, level: 1, evidence: [{ quote: "ancestry, colour or creed", paragraphId: "p1" }] },
        ],
        redFlags: [],
        reasoning: "A ban naming relevant grounds.",
      },
      model: "m",
      usage: undefined,
    });
    const res = await post("H1", { paragraphs });
    expect(res.status).toBe(200);
    const body = (await res.json()) as CriterionResult;
    expect(body).toMatchObject({ criterion: "H1", applicable: true, score: 2, status: "Addressed", warning: null, cached: false });
    expect(body.checks).toHaveLength(3);
  });

  it("returns a CriterionResult for H3 with a verified preference and a baseline warning", async () => {
    const h3Paragraphs = [{ id: "p1", text: "Indigenous candidates preferred for all client-facing roles." }];
    mocked.mockResolvedValueOnce({
      data: {
        applicable: { value: true, evidence: [{ quote: "Indigenous candidates preferred for all client-facing roles", paragraphId: "p1" }] },
        checks: [],
        redFlags: [],
        reasoning: "A preference with no stated legal basis or purpose.",
      },
      model: "m",
      usage: undefined,
    });
    const res = await post("H3", { paragraphs: h3Paragraphs });
    expect(res.status).toBe(200);
    const body = (await res.json()) as CriterionResult;
    expect(body).toMatchObject({ criterion: "H3", applicable: true, score: 0, status: "Not found", warning: "baseline" });
  });

  it("maps a 429 from the AI to 429 rate_limited", async () => {
    mocked.mockRejectedValueOnce(new HttpError(429, "rate_limited", "busy"));
    const res = await post("H1", { paragraphs });
    expect(res.status).toBe(429);
    expect(((await res.json()) as ApiError).error.code).toBe("rate_limited");
  });
});
