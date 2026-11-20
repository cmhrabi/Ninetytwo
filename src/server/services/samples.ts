import { readFile } from "node:fs/promises";
import path from "node:path";
import type { DocumentText, Sample } from "@/shared";
import { toParagraphs } from "../core/paragraphs";
import { stripPii } from "../core/pii";
import { notFound } from "../http/errors";
import { SAMPLES_DIR } from "../paths";

/** The sample policies listed in samples/index.json. */
export async function listSamples(): Promise<Sample[]> {
  return JSON.parse(await readFile(path.join(SAMPLES_DIR, "index.json"), "utf8"));
}

/** A sample policy as numbered paragraphs. Only ids in the index are read (no path traversal). */
export async function getSample(id: string): Promise<DocumentText> {
  const sample = (await listSamples()).find((s) => s.id === id);
  if (!sample) throw notFound(`Sample ${id}`);
  const fileName = `${sample.id}.txt`;
  const raw = await readFile(path.join(SAMPLES_DIR, fileName), "utf8");
  const paragraphs = toParagraphs(raw).map((p) => ({ ...p, text: stripPii(p.text) }));
  return { fileName, paragraphs };
}
