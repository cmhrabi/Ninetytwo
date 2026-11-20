// npm run calibrate: live, spends OpenRouter credit (3 samples × 2 runs × 4 calls = 24 calls).
// Runs the real pipeline in-process (no dev server): sample → scan → judge every criterion in
// parallel → overall, twice per sample, and compares each run with samples/expected.json.
//   npm run calibrate              → table, exit 1 on any mismatch or unstable score
//   npm run calibrate -- --save    → also writes cache/<sample>-<criterion>.json from run 1,
//                                    only when every run is clean (the labelled fallback)
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { computeOverall, type CriterionResult, type Paragraph, type SampleId } from "@/shared";
import { getConfig } from "@/server/config";
import { HttpError } from "@/server/http/errors";
import { ROOT, SAMPLES_DIR } from "@/server/paths";
import { writeCache } from "@/server/services/cache";
import { judgeCriterion } from "@/server/services/judge";
import { OPENROUTER_URL } from "@/server/services/openrouter";
import { loadRubric } from "@/server/services/rubricStore";
import { getSample, listSamples } from "@/server/services/samples";
import { scanDocument } from "@/server/services/scan";

const RUNS = 2;
const SAVE = process.argv.includes("--save");

// { "weak": { "H1": 1, "H3": null, "H5": 0, "percent": 38, "band": "Emerging" }, ... }
const Score = z.union([z.literal(0), z.literal(1), z.literal(2), z.null()]);
const ExpectedSchema = z.record(
  z.string(),
  z.object({ percent: z.number(), band: z.string() }).catchall(Score),
);
type Expected = z.infer<typeof ExpectedSchema>[string];

type Run = {
  sample: SampleId;
  run: number;
  seconds: number;
  aiScanned: boolean;
  results: CriterionResult[];
  percent: number;
  band: string;
  error?: string;
  problems: string[]; // empty = clean
};

// Sum OpenRouter cost from each reply's usage without touching production code.
let calls = 0;
let cost = 0;
let costReported = false;
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
  const res = await realFetch(input, init);
  const url = input instanceof Request ? input.url : String(input);
  if (url === OPENROUTER_URL) {
    calls++;
    const body = (await res.clone().json().catch(() => null)) as { usage?: { cost?: number } } | null;
    if (typeof body?.usage?.cost === "number") {
      cost += body.usage.cost;
      costReported = true;
    }
  }
  return res;
}) as typeof fetch;

const fmt = (score: number | null | undefined) => (score === null ? "N/A" : String(score ?? "-"));

async function calibrateOnce(
  sample: SampleId,
  run: number,
  paragraphs: Paragraph[],
  criteria: string[],
  expected: Expected,
  rubric: Awaited<ReturnType<typeof loadRubric>>,
): Promise<Run> {
  const started = Date.now();
  const base = { sample, run, aiScanned: false, results: [], percent: 0, band: "" };
  try {
    const scan = await scanDocument(paragraphs);
    const results = await Promise.all(criteria.map((id) => judgeCriterion(id, paragraphs, scan)));
    const { percent, band } = computeOverall(results, rubric);
    const problems: string[] = [];
    for (const r of results) {
      if (r.cached) problems.push(`${r.criterion} came from the cache (the AI call failed)`);
      if (r.score !== expected[r.criterion]) {
        problems.push(`${r.criterion} ${fmt(r.score)}, expected ${fmt(expected[r.criterion])}`);
      }
    }
    if (percent !== expected.percent) problems.push(`percent ${percent}, expected ${expected.percent}`);
    if (band !== expected.band) problems.push(`band ${band}, expected ${expected.band}`);
    return { ...base, aiScanned: scan.aiScanned, results, percent, band, problems, seconds: (Date.now() - started) / 1000 };
  } catch (err) {
    const error = err instanceof HttpError ? `${err.code}: ${err.message}` : String(err);
    return { ...base, error, problems: [error], seconds: (Date.now() - started) / 1000 };
  }
}

function printTable(runs: Run[], criteria: string[], expected: Record<string, Expected>) {
  const header = ["sample", "run", ...criteria, "percent", "band", "expected", "secs", ""];
  const widths = [8, 4, ...criteria.map(() => 5), 8, 12, 28, 6, 2];
  const line = (cells: string[]) => cells.map((c, i) => c.padEnd(widths[i])).join(" ").trimEnd();
  console.log(line(header));
  for (const r of runs) {
    const exp = expected[r.sample];
    const mark = (ok: boolean, text: string) => (ok ? text : `${text}✗`);
    const scores = criteria.map((id) => {
      const result = r.results.find((x) => x.criterion === id);
      if (!result) return "-";
      return mark(result.score === exp[id], `${fmt(result.score)}${result.cached ? "c" : ""}`);
    });
    const expText = `${criteria.map((id) => fmt(exp[id])).join("/")} ${exp.percent} ${exp.band}`;
    console.log(
      line([
        r.sample,
        String(r.run),
        ...scores,
        r.error ? "-" : mark(r.percent === exp.percent, String(r.percent)),
        r.error ? "-" : mark(r.band === exp.band, r.band),
        expText,
        r.seconds.toFixed(1),
        r.problems.length ? "✗" : "✓",
      ]),
    );
    if (r.error) console.log(`    error: ${r.error}`);
    if (!r.error && !r.aiScanned) console.log("    note: the AI scan failed; this run used keyword-only candidates");
  }
}

/** Score changes between runs (unstable) and check-level differences (for information). */
function compareRuns(runs: Run[]): { unstable: string[]; drift: string[] } {
  const unstable: string[] = [];
  const drift: string[] = [];
  for (const sample of new Set(runs.map((r) => r.sample))) {
    const [a, b] = runs.filter((r) => r.sample === sample && !r.error);
    if (!a || !b) continue;
    for (const ra of a.results) {
      const rb = b.results.find((x) => x.criterion === ra.criterion);
      if (!rb) continue;
      if (ra.score !== rb.score) unstable.push(`${sample} ${ra.criterion}: run 1 ${fmt(ra.score)}, run 2 ${fmt(rb.score)}`);
      for (const ca of ra.checks) {
        const cb = rb.checks.find((x) => x.id === ca.id);
        if (cb && (ca.met !== cb.met || ca.level !== cb.level)) {
          const show = (c: typeof ca) => `met ${c.met}${c.level === undefined ? "" : ` level ${c.level}`}`;
          drift.push(`${sample} ${ra.criterion}.${ca.id}: run 1 ${show(ca)}, run 2 ${show(cb)}`);
        }
      }
      const flags = (r: CriterionResult) => r.redFlags.map((f) => f.id).sort().join(",") || "none";
      if (flags(ra) !== flags(rb)) drift.push(`${sample} ${ra.criterion} red flags: run 1 ${flags(ra)}, run 2 ${flags(rb)}`);
    }
  }
  return { unstable, drift };
}

/** What the judge found for each mismatched criterion, to decide whether the sample or rubric is wrong. */
function printMismatchDetails(runs: Run[], expected: Record<string, Expected>) {
  const shown = new Set<string>();
  for (const r of runs) {
    for (const result of r.results) {
      const key = `${r.sample}-${result.criterion}-${result.score}`;
      if (result.score === expected[r.sample][result.criterion] || shown.has(key)) continue;
      shown.add(key);
      console.log(`\n${r.sample} run ${r.run} ${result.criterion}: ${fmt(result.score)} (${result.status}), expected ${fmt(expected[r.sample][result.criterion])}`);
      console.log(`  reasoning: ${result.reasoning}`);
      for (const c of result.checks) {
        const quotes = c.evidence.map((e) => `${e.verified ? "✓" : "✗"} ${e.paragraphId} "${e.quote}"`);
        console.log(`  ${c.id}: met ${c.met}${c.level === undefined ? "" : ` level ${c.level}`}${quotes.length ? "" : " (no quotes)"}`);
        for (const q of quotes) console.log(`      ${q}`);
      }
      for (const f of result.redFlags) {
        console.log(`  red flag ${f.id}: ${f.evidence.map((e) => `${e.paragraphId} "${e.quote}"`).join("; ")}`);
      }
    }
  }
}

async function main() {
  const { apiKey, judgeModel, scanModel } = getConfig();
  if (!apiKey) {
    console.error("OPENROUTER_API_KEY is empty. Paste your key into .env.local, then run again.");
    process.exit(1);
  }
  const rubric = await loadRubric();
  const criteria = rubric.criteria.map((c) => c.id);
  const expected = ExpectedSchema.parse(JSON.parse(await readFile(path.join(SAMPLES_DIR, "expected.json"), "utf8")));
  const samples = await listSamples();
  for (const s of samples) {
    const missing = [...criteria, "percent", "band"].filter((k) => !(k in (expected[s.id] ?? {})));
    if (missing.length) {
      console.error(`samples/expected.json: ${s.id} is missing ${missing.join(", ")}`);
      process.exit(1);
    }
  }

  console.log(`judge ${judgeModel} · scan ${scanModel} · ${samples.length} samples × ${RUNS} runs\n`);
  const started = Date.now();
  const runs: Run[] = [];
  const paragraphsBySample = new Map<SampleId, Paragraph[]>();
  for (const s of samples) {
    const { paragraphs } = await getSample(s.id);
    paragraphsBySample.set(s.id, paragraphs);
    for (let run = 1; run <= RUNS; run++) {
      process.stdout.write(`  running ${s.id} ${run}/${RUNS}…\r`);
      runs.push(await calibrateOnce(s.id, run, paragraphs, criteria, expected[s.id], rubric));
    }
  }
  process.stdout.write(" ".repeat(40) + "\r");

  printTable(runs, criteria, expected);
  const { unstable, drift } = compareRuns(runs);
  if (unstable.length) {
    console.log("\nUNSTABLE (score differs between runs):");
    for (const u of unstable) console.log(`  ${u}`);
  }
  if (drift.length) {
    console.log("\nChecks that differ between runs (same score; for information):");
    for (const d of drift) console.log(`  ${d}`);
  }
  printMismatchDetails(runs, expected);

  const clean = runs.every((r) => r.problems.length === 0) && unstable.length === 0;
  const passed = runs.filter((r) => r.problems.length === 0).length;
  console.log(
    `\n${passed}/${runs.length} runs match · ${calls} OpenRouter calls · ` +
      `cost ${costReported ? `$${cost.toFixed(4)}` : "n/a"} · ${((Date.now() - started) / 1000).toFixed(0)} s`,
  );

  if (SAVE) {
    if (!clean) {
      console.log("Not saving the cache: every run must match and nothing may be unstable.");
    } else {
      for (const r of runs.filter((x) => x.run === 1)) {
        for (const result of r.results) {
          const file = await writeCache(r.sample, paragraphsBySample.get(r.sample)!, result);
          console.log(`  wrote ${path.relative(ROOT, file)}`);
        }
      }
    }
  }
  process.exit(clean ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
