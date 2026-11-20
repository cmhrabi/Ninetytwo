// Live, run by hand: records real AI replies (the raw completeJson data) for the samples into
// src/test/fixtures/ so pipeline.test.ts can replay them offline. Fixtures hold sample text only.
//   npm run record-fixtures            → scan + H1 for every sample
//   npm run record-fixtures -- H1 H5   → scan + the named criteria
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { getConfig } from "@/server/config";
import { JudgeSchema } from "@/server/core/judgeSchema";
import { mergeScan } from "@/server/core/mergeScan";
import { phraseScan } from "@/server/core/phraseScan";
import { buildJudgePrompt } from "@/server/core/prompt";
import { buildScanPrompt } from "@/server/core/scanPrompt";
import { ScanSchema } from "@/server/core/scanSchema";
import { ROOT } from "@/server/paths";
import { completeJson } from "@/server/services/openrouter";
import { getCriterion, loadRubric } from "@/server/services/rubricStore";
import { getSample, listSamples } from "@/server/services/samples";

const FIXTURES = path.join(ROOT, "src", "test", "fixtures");

async function save(name: string, data: unknown) {
  await writeFile(path.join(FIXTURES, name), `${JSON.stringify(data, null, 2)}\n`);
  console.log(`  wrote src/test/fixtures/${name}`);
}

async function main() {
  const { apiKey, judgeModel, scanModel } = getConfig();
  if (!apiKey) {
    console.error("OPENROUTER_API_KEY is empty. Paste your key into .env.local, then run again.");
    process.exit(1);
  }
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : ["H1"];
  const rubric = await loadRubric();
  const criteria = await Promise.all(ids.map((id) => getCriterion(id)));

  for (const sample of await listSamples()) {
    console.log(`${sample.id}:`);
    const { paragraphs } = await getSample(sample.id);
    const scanPrompt = buildScanPrompt(paragraphs, rubric);
    const scanReply = await completeJson({
      model: scanModel, ...scanPrompt, schema: ScanSchema, schemaName: "policy_scan", maxTokens: 4000,
    });
    await save(`${sample.id}-scan.json`, scanReply.data);
    const scan = mergeScan(phraseScan(paragraphs, rubric), scanReply.data, paragraphs, rubric);

    await Promise.all(
      criteria.map(async (criterion) => {
        const prompt = buildJudgePrompt(criterion, paragraphs, scan.criteria.find((c) => c.criterion === criterion.id));
        const reply = await completeJson({
          model: judgeModel, ...prompt, schema: JudgeSchema, schemaName: "criterion_findings", maxTokens: 4000,
        });
        await save(`${sample.id}-${criterion.id}.json`, reply.data);
      }),
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
