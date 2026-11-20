// npm run test:ai: one tiny real OpenRouter call per model. Proves the key and models work.
import { z } from "zod";
import { getConfig } from "@/server/config";
import { HttpError } from "@/server/http/errors";
import { completeJson } from "@/server/services/openrouter";

const Reply = z.object({ ok: z.boolean(), word: z.string() });

async function main() {
  const { apiKey, judgeModel, scanModel } = getConfig();
  if (!apiKey) {
    console.error("OPENROUTER_API_KEY is empty. Paste your key into .env.local, then run again.");
    process.exit(1);
  }
  let failed = false;
  for (const [role, model] of [
    ["judge", judgeModel],
    ["scan", scanModel],
  ] as const) {
    const started = Date.now();
    try {
      const { data, model: served, usage } = await completeJson({
        model,
        system: "You are a connectivity check. Reply only with the JSON requested.",
        user: 'Return {"ok": true, "word": "<any one English word>"}.',
        schema: Reply,
        schemaName: "connectivity_check",
        maxTokens: 2000,
      });
      const cost = usage?.cost !== undefined ? `$${usage.cost.toFixed(5)}` : "n/a";
      console.log(`✓ ${role.padEnd(5)} ${served}  ${JSON.stringify(data)}  ${Date.now() - started} ms  cost ${cost}`);
    } catch (err) {
      failed = true;
      const message = err instanceof HttpError ? `${err.code}: ${err.message}` : String(err);
      console.error(`✗ ${role.padEnd(5)} ${model}  ${message}`);
    }
  }
  process.exit(failed ? 1 : 0);
}

main();
