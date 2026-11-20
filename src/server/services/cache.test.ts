import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { CriterionResult, Paragraph } from "@/shared";
import { CACHE_DIR } from "../paths";
import { readCache, writeCache } from "./cache";
import { getSample } from "./samples";

// Real paths, except CACHE_DIR: a fresh temporary folder, so tests never touch cache/.
vi.mock("../paths", async (importOriginal) => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const actual = await importOriginal<typeof import("../paths")>();
  return { ...actual, CACHE_DIR: join(mkdtempSync(join(tmpdir(), "ninetytwo-cache-")), "cache") };
});

const result: CriterionResult = {
  criterion: "H1",
  applicable: true,
  score: 1,
  status: "Partly addressed",
  checks: [],
  redFlags: [],
  warning: null,
  reasoning: "The policy has an equal-opportunity statement.",
  cached: false,
};

let weak: Paragraph[];
beforeAll(async () => {
  weak = (await getSample("weak")).paragraphs;
});
afterEach(() => rm(CACHE_DIR, { recursive: true, force: true }));
afterAll(() => rm(path.dirname(CACHE_DIR), { recursive: true, force: true }));

describe("cache", () => {
  it("returns null when there is no cache folder", async () => {
    expect(await readCache(weak, "H1")).toBeNull();
  });

  it("writes cache/<sample>-<criterion>.json with the hash and a cached result", async () => {
    const file = await writeCache("weak", weak, result);
    expect(path.basename(file)).toBe("weak-H1.json");
    const entry = JSON.parse(await readFile(file, "utf8"));
    expect(entry).toMatchObject({ sample: "weak", hash: expect.stringMatching(/^[0-9a-f]{64}$/) });
    expect(entry.result).toEqual({ ...result, cached: true });
  });

  it("returns the cached result with cached: true for a sample's text", async () => {
    await writeCache("weak", weak, result);
    expect(await readCache(weak, "H1")).toEqual({ ...result, cached: true });
  });

  it("matches the sample however its whitespace arrived", async () => {
    await writeCache("weak", weak, result);
    const reflowed = weak.map((p) => ({ ...p, text: ` ${p.text.replace(/ /g, "  ")}\n` }));
    expect(await readCache(reflowed, "H1")).not.toBeNull();
  });

  it("returns null for edited text", async () => {
    await writeCache("weak", weak, result);
    const edited = weak.map((p, i) => (i === 0 ? { ...p, text: `${p.text} Edited.` } : p));
    expect(await readCache(edited, "H1")).toBeNull();
  });

  it("returns null for another criterion", async () => {
    await writeCache("weak", weak, result);
    expect(await readCache(weak, "H5")).toBeNull();
  });

  it("skips a malformed file instead of throwing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(path.join(CACHE_DIR, "broken-H1.json"), "{ not json");
    await writeCache("weak", weak, result);
    expect(await readCache(weak, "H1")).toEqual({ ...result, cached: true });
  });
});
