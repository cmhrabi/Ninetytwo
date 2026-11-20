import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "../http/errors";
import { judgeCriterion } from "./judge";
import { completeJson } from "./openrouter";

vi.mock("./openrouter", () => ({ completeJson: vi.fn() }));
const mocked = vi.mocked(completeJson);

const paragraphs = [{ id: "p1", text: "Northwind Freight is an equal opportunity employer." }];

afterEach(() => mocked.mockReset());

describe("judgeCriterion", () => {
  it("scores H1 from the model's findings, running the keyword scan inline", async () => {
    mocked.mockResolvedValueOnce({
      data: {
        applicable: { value: true, evidence: [] },
        checks: [{ id: "eoStatement", met: true, level: 1, evidence: [{ quote: "is an equal opportunity employer", paragraphId: "p1" }] }],
        redFlags: [],
        reasoning: "The policy has an equal-opportunity statement.",
      },
      model: "m",
      usage: undefined,
    });
    const result = await judgeCriterion("H1", paragraphs);
    expect(result).toMatchObject({ criterion: "H1", score: 1, status: "Partly addressed", warning: null });
    const { user, schemaName } = mocked.mock.calls[0][0];
    expect(schemaName).toBe("criterion_findings");
    expect(user).toContain("- p1: equal opportunity");
  });

  it("scores a conditional criterion (no 501): not applicable without an applicability quote", async () => {
    mocked.mockResolvedValueOnce({
      data: {
        applicable: { value: false, evidence: [] },
        checks: [],
        redFlags: [],
        reasoning: "The policy has no Indigenous-specific hiring.",
      },
      model: "m",
      usage: undefined,
    });
    const result = await judgeCriterion("H3", paragraphs);
    expect(result).toMatchObject({ criterion: "H3", applicable: false, score: null, status: "Not applicable", warning: null });
  });

  it("scores a graded criterion with the average rule (no 501)", async () => {
    mocked.mockResolvedValueOnce({
      data: {
        applicable: { value: true, evidence: [] },
        checks: [],
        redFlags: [],
        reasoning: "No retention or advancement supports are described.",
      },
      model: "m",
      usage: undefined,
    });
    const result = await judgeCriterion("H5", paragraphs);
    expect(result).toMatchObject({ criterion: "H5", applicable: true, score: 0, status: "Not found", warning: null });
    expect(result.checks.every((c) => c.level === 0)).toBe(true);
  });

  it("passes a 429 through", async () => {
    mocked.mockRejectedValueOnce(new HttpError(429, "rate_limited", "busy"));
    await expect(judgeCriterion("H1", paragraphs)).rejects.toMatchObject({ status: 429, code: "rate_limited" });
  });

  it("404s an unknown criterion without calling the AI", async () => {
    await expect(judgeCriterion("H9", paragraphs)).rejects.toMatchObject({ status: 404, code: "not_found" });
    expect(mocked).not.toHaveBeenCalled();
  });
});
