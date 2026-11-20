import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CriterionResult, Paragraph, SampleId } from "@/shared";
import { docHash } from "../core/hash";
import { CACHE_DIR } from "../paths";

// Labelled fallback for the three sample policies only (CLAUDE.md hard rule 7). Files are
// written by `npm run calibrate -- --save` after a clean run and committed; the server only reads.

type CacheEntry = { sample: SampleId; hash: string; result: CriterionResult };

const fileName = (sample: string, criterion: string) => `${sample}-${criterion}.json`;

/** Saves a calibrated result as cache/<sample>-<criterion>.json. Used only by calibrate --save. */
export async function writeCache(
  sample: SampleId,
  paragraphs: Paragraph[],
  result: CriterionResult,
): Promise<string> {
  const entry: CacheEntry = { sample, hash: docHash(paragraphs), result: { ...result, cached: true } };
  await mkdir(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, fileName(sample, result.criterion));
  await writeFile(file, `${JSON.stringify(entry, null, 2)}\n`);
  return file;
}

/**
 * The cached result for this criterion if the paragraphs are one of the cached samples, else
 * null. Any other document, a missing folder or a malformed file gives null, never a throw.
 */
export async function readCache(paragraphs: Paragraph[], criterion: string): Promise<CriterionResult | null> {
  const hash = docHash(paragraphs);
  let files: string[];
  try {
    files = await readdir(CACHE_DIR);
  } catch {
    return null;
  }
  for (const file of files.filter((f) => f.endsWith(`-${criterion}.json`))) {
    try {
      const entry = JSON.parse(await readFile(path.join(CACHE_DIR, file), "utf8")) as Partial<CacheEntry>;
      if (entry.hash === hash && entry.result?.criterion === criterion) {
        return { ...entry.result, cached: true };
      }
    } catch (err) {
      console.error(`Skipping unreadable cache file ${file}:`, err);
    }
  }
  return null;
}
