// npm run smoke: end to end against a running dev server (BASE_URL, default localhost:3000).
// health → samples → sample "weak" → scan → every rubric criterion judged in parallel → overall.
// Live: spends OpenRouter credit. Exits 1 on any non-2xx.
import { computeOverall, type CriterionResult, type DocumentText, type Health, type Rubric, type Sample, type ScanResult } from "@/shared";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const SAMPLE = process.env.SAMPLE ?? "weak";
const timings: [string, number][] = [];

async function call<T>(label: string, path: string, body?: unknown): Promise<T> {
  const started = Date.now();
  const res = await fetch(`${BASE_URL}${path}`, body === undefined ? undefined : {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  timings.push([label, Date.now() - started]);
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    console.error(`✗ ${label}: HTTP ${res.status} ${JSON.stringify(json)}`);
    process.exit(1);
  }
  return json as T;
}

async function main() {
  const started = Date.now();
  const health = await call<Health>("health", "/api/health");
  console.log(`health: judge ${health.judgeModel}, scan ${health.scanModel}, keyLoaded ${health.keyLoaded}`);
  if (!health.keyLoaded) console.warn("! keyLoaded is false: the scan will be keyword-only and judges will fail");

  const rubric = await call<Rubric>("rubric", "/api/rubric");
  const samples = await call<Sample[]>("samples", "/api/samples");
  console.log(`samples: ${samples.map((s) => s.id).join(", ")}`);
  const doc = await call<DocumentText>(`sample ${SAMPLE}`, `/api/samples/${SAMPLE}`);
  console.log(`sample ${SAMPLE}: ${doc.paragraphs.length} paragraphs`);

  const scan = await call<ScanResult>("scan", "/api/scan", { paragraphs: doc.paragraphs });
  console.log(`\nscan (aiScanned: ${scan.aiScanned})`);
  for (const c of scan.criteria) {
    const hits = c.candidates.map((h) => `${h.paragraphId}[${h.source}] ${h.label}`).join("; ") || "none";
    console.log(`  ${c.criterion}: ${hits}${c.redFlags.length ? `  red flags: ${c.redFlags.map((r) => r.id).join(", ")}` : ""}`);
  }

  const results = await Promise.all(
    rubric.criteria.map((c) =>
      call<CriterionResult>(`judge ${c.id}`, `/api/judge/${c.id}`, { paragraphs: doc.paragraphs, scan }),
    ),
  );

  console.log("\ncriterion  score  status            warning   verified quotes");
  for (const r of results) {
    const quotes = r.checks.flatMap((k) => k.evidence.filter((e) => e.verified).map((e) => `${k.id}@${e.paragraphId}`));
    console.log(
      `${r.criterion.padEnd(10)} ${String(r.score ?? "N/A").padEnd(6)} ${r.status.padEnd(17)} ${String(r.warning ?? "-").padEnd(9)} ${quotes.join(", ") || "none"}`,
    );
    console.log(`           ${r.reasoning}`);
  }
  const overall = computeOverall(results, rubric);
  console.log(`\noverall: ${overall.percent}% ${overall.band}${overall.warnings.length ? `  warnings: ${overall.warnings.join(" | ")}` : ""}`);

  console.log("\ntimings:");
  for (const [label, ms] of timings) console.log(`  ${label.padEnd(12)} ${ms} ms`);
  console.log(`  total        ${Date.now() - started} ms`);
}

main().catch((err) => {
  console.error(`✗ ${err instanceof Error ? err.message : err} (is npm run dev running at ${BASE_URL}?)`);
  process.exit(1);
});
