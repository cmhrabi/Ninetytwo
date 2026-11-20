import { describe, expect, it } from "vitest";
import { HttpError } from "../http/errors";
import { getSample, listSamples } from "./samples";

describe("samples", () => {
  it("lists the three samples", async () => {
    expect((await listSamples()).map((s) => s.id)).toEqual(["weak", "partial", "strong"]);
  });

  it.each(["weak", "partial", "strong"])("serves %s as numbered, PII-free paragraphs", async (id) => {
    const doc = await getSample(id);
    expect(doc.fileName).toBe(`${id}.txt`);
    expect(doc.paragraphs[0].text).not.toMatch(/^TODO/);
    expect(doc.paragraphs.map((p) => p.id)).toEqual(doc.paragraphs.map((_, i) => `p${i + 1}`));
    const all = doc.paragraphs.map((p) => p.text).join("\n");
    expect(all).not.toMatch(/@\w/);
    expect(all).not.toMatch(/\d{3}[-.)]\s?\d{3}-\d{4}/);
  });

  it.each(["nope", "../package", "index"])("throws 404 for %s", async (id) => {
    const err = await getSample(id).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).status).toBe(404);
  });
});
