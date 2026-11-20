import { rm } from "node:fs/promises";
import path from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { CriterionResult, Paragraph } from "@/shared";
import { HttpError } from "../http/errors";
import { CACHE_DIR } from "../paths";
import { writeCache } from "./cache";
import { judgeCriterion } from "./judge";
import { completeJson } from "./openrouter";
import { getSample } from "./samples";

vi.mock("./openrouter", () => ({ completeJson: vi.fn() }));
const mocked = vi.mocked(completeJson);

// Real paths, except CACHE_DIR: a fresh temporary folder, so tests never touch cache/.
vi.mock("../paths", async (importOriginal) => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const actual = await importOriginal<typeof import("../paths")>();
  return { ...actual, CACHE_DIR: join(mkdtempSync(join(tmpdir(), "ninetytwo-cache-")), "cache") };
});

const paragraphs = [{ id: "p1", text: "Northwind Freight is an equal opportunity employer." }];

afterEach(() => mocked.mockReset());
afterAll(() => rm(path.dirname(CACHE_DIR), { recursive: true, force: true }));

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

describe("judgeCriterion cached fallback", () => {
  const cachedH1: CriterionResult = {
    criterion: "H1",
    applicable: true,
    score: 1,
    status: "Partly addressed",
    checks: [],
    redFlags: [],
    warning: null,
    reasoning: "Recorded during calibration.",
    cached: false,
  };
  const noFindings = {
    data: { applicable: { value: true, evidence: [] }, checks: [], redFlags: [], reasoning: "Nothing found." },
    model: "m",
    usage: undefined,
  };
  let weak: Paragraph[];

  beforeAll(async () => {
    weak = (await getSample("weak")).paragraphs;
    await writeCache("weak", weak, cachedH1);
  });

  it("serves the cached run for a sample when the AI fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mocked.mockRejectedValueOnce(new HttpError(502, "ai_failed", "OPENROUTER_API_KEY is not set"));
    expect(await judgeCriterion("H1", weak)).toEqual({ ...cachedH1, cached: true });
  });

  it("serves the cached run for a sample when the AI is rate limited", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mocked.mockRejectedValueOnce(new HttpError(429, "rate_limited", "busy"));
    expect(await judgeCriterion("H1", weak)).toMatchObject({ criterion: "H1", cached: true });
  });

  it("502s a non-sample document when the AI fails", async () => {
    mocked.mockRejectedValueOnce(new HttpError(502, "ai_failed", "OPENROUTER_API_KEY is not set"));
    await expect(judgeCriterion("H1", paragraphs)).rejects.toMatchObject({ status: 502, code: "ai_failed" });
  });

  it("502s a sample criterion that has no cached run", async () => {
    mocked.mockRejectedValueOnce(new HttpError(502, "ai_failed", "down"));
    await expect(judgeCriterion("H5", weak)).rejects.toMatchObject({ status: 502, code: "ai_failed" });
  });

  it("never serves the cache for errors that are not AI outages", async () => {
    mocked.mockRejectedValueOnce(new Error("bug"));
    await expect(judgeCriterion("H1", weak)).rejects.toThrow("bug");
  });

  it("uses the live result, not the cache, when the AI succeeds on a sample", async () => {
    mocked.mockResolvedValueOnce(noFindings);
    const result = await judgeCriterion("H1", weak);
    expect(result.cached).toBe(false);
    expect(result.reasoning).toBe("Nothing found.");
  });
});
