import path from "node:path";

// Next, Vercel functions and the tsx scripts all run with cwd = the project root.
export const ROOT = process.cwd();
export const RUBRIC_PATH = path.join(ROOT, "rubric", "rubric.json");
export const SAMPLES_DIR = path.join(ROOT, "samples");
export const CACHE_DIR = path.join(ROOT, "cache");
