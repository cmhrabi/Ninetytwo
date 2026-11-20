import { readFile } from "node:fs/promises";
import { RubricSchema, type Criterion, type Rubric } from "@/shared";
import { notFound } from "../http/errors";
import { RUBRIC_PATH } from "../paths";

let cached: Promise<Rubric> | null = null;

async function readRubric(path: string): Promise<Rubric> {
  const raw = JSON.parse(await readFile(path, "utf8"));
  return RubricSchema.parse(raw);
}

/** Loads and validates rubric/rubric.json once per process. */
export function loadRubric(path: string = RUBRIC_PATH): Promise<Rubric> {
  if (path !== RUBRIC_PATH) return readRubric(path);
  cached ??= readRubric(path).catch((err) => {
    cached = null; // let the next request retry after a bad edit is fixed
    throw err;
  });
  return cached;
}

export async function getCriterion(id: string): Promise<Criterion> {
  const rubric = await loadRubric();
  const criterion = rubric.criteria.find((c) => c.id === id);
  if (!criterion) throw notFound(`Criterion ${id}`);
  return criterion;
}
