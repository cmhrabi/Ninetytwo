import { rm } from "node:fs/promises";
import path from "node:path";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { POST as judgeRoute } from "@/app/api/judge/[criterion]/route";
import { POST as scanRoute } from "@/app/api/scan/route";
import { computeOverall, type CriterionResult, type ScanResult } from "@/shared";
import { RUBRIC_PATH } from "./paths";
import { completeJson } from "./services/openrouter";
import { loadRubric } from "./services/rubricStore";

// "The rubric is config": a criterion added to rubric.json is scanned, judged and scored by the
// unchanged code. RUBRIC_PATH points at a temporary copy of the real rubric plus one placeholder
// criterion (X1, test wording only). The AI is mocked; no network.
vi.mock("@/server/services/openrouter", () => ({ completeJson: vi.fn() }));
const mocked = vi.mocked(completeJson);

vi.mock("./paths", async (importOriginal) => {
  const fs = await import("node:fs");
  const os = await import("node:os");
  const { join } = await import("node:path");
  const actual = await importOriginal<typeof import("./paths")>();
  const rubric = JSON.parse(fs.readFileSync(actual.RUBRIC_PATH, "utf8"));
  rubric.criteria.push({
    id: "X1",
    title: "Example criterion added for this test only",
    shortTitle: "Example criterion",
    tier: "leading",
    weight: 1,
    appliesWhen: "always",
    warnOnZero: false,
    checks: [{ id: "stated", label: "The policy contains the example sentence", graded: false }],
    scoring: { type: "rules", rules: [{ score: 2, allOf: ["stated"] }] },
    levels: { "2": "Example sentence present", "1": "Not used", "0": "Example sentence absent" },
    phrases: ["example sentence"],
    redFlags: [],
    addressedLooksLike: "",
    whyItMatters: "",
    sources: [],
    resources: [],
  });
  const file = join(fs.mkdtempSync(join(os.tmpdir(), "ninetytwo-rubric-")), "rubric.json");
  fs.writeFileSync(file, JSON.stringify(rubric));
  return { ...actual, RUBRIC_PATH: file };
});

const paragraphs = [
  { id: "p1", text: "Acme Ltd hires on merit." },
  { id: "p2", text: "This policy contains the example sentence used by the test." },
];
const post = (url: string, body: unknown) =>
  new Request(`http://localhost${url}`, { method: "POST", body: JSON.stringify(body) });

afterEach(() => mocked.mockReset());
afterAll(() => rm(path.dirname(RUBRIC_PATH), { recursive: true, force: true }));

describe("a criterion added to rubric.json needs no code change", () => {
  it("validates with the shared rubric schema", async () => {
    const rubric = await loadRubric();
    expect(rubric.criteria.map((c) => c.id)).toEqual(["H1", "H3", "H5", "X1"]);
  });

  it("is in the scan: the AI prompt lists it and its keyword phrase marks a candidate", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocked.mockRejectedValueOnce(new Error("AI scan unavailable")); // keyword-only result
    const res = await scanRoute(post("/api/scan", { paragraphs }));
    expect(res.status).toBe(200);
    const scan = (await res.json()) as ScanResult;
    expect(mocked.mock.calls[0][0].system).toContain("Criterion X1: Example criterion added for this test only");
    expect(scan.criteria.find((c) => c.criterion === "X1")?.candidates).toEqual([
      { paragraphId: "p2", source: "keyword", label: "example sentence" },
    ]);
  });

  it("is judged and scored by POST /api/judge/X1, and counts in the overall", async () => {
    mocked.mockResolvedValueOnce({
      data: {
        applicable: { value: true, evidence: [] },
        checks: [{ id: "stated", met: true, level: 1, evidence: [{ quote: "contains the example sentence", paragraphId: "p2" }] }],
        redFlags: [],
        reasoning: "The policy contains the example sentence.",
      },
      model: "m",
      usage: undefined,
    });
    const res = await judgeRoute(post("/api/judge/X1", { paragraphs }), { params: Promise.resolve({ criterion: "X1" }) });
    expect(res.status).toBe(200);
    const result = (await res.json()) as CriterionResult;
    expect(result).toMatchObject({ criterion: "X1", applicable: true, score: 2, status: "Addressed", cached: false });
    expect(mocked.mock.calls[0][0].system).toContain("Criterion X1");

    const overall = computeOverall([result], await loadRubric());
    expect(overall).toEqual({ percent: 100, band: "Leading", warnings: [] });
  });
});
