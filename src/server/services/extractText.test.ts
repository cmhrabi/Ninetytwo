import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HttpError } from "../http/errors";
import { extractDocument, MAX_UPLOAD_BYTES } from "./extractText";

const FIXTURES = path.join(process.cwd(), "src", "test", "fixtures");
const FIRST = "Maple Ridge Logistics is an equal opportunity employer.";
const LONG = "Our hiring policy applies to every role and every candidate we consider.";

const fixture = async (name: string, type: string) =>
  new File([await readFile(path.join(FIXTURES, name))], name, { type });

async function errorOf(file: File): Promise<HttpError> {
  const err = await extractDocument(file).catch((e: unknown) => e);
  expect(err).toBeInstanceOf(HttpError);
  return err as HttpError;
}

describe("extractDocument", () => {
  it("reads a .txt file into paragraphs", async () => {
    const doc = await extractDocument(new File([`${LONG}\n\nSecond paragraph.`], "policy.txt"));
    expect(doc).toEqual({
      fileName: "policy.txt",
      paragraphs: [
        { id: "p1", text: LONG },
        { id: "p2", text: "Second paragraph." },
      ],
    });
  });

  it("reads the .docx fixture", async () => {
    const doc = await extractDocument(
      await fixture(
        "policy.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    );
    expect(doc.paragraphs[0]).toEqual({ id: "p1", text: FIRST });
    expect(doc.paragraphs).toHaveLength(2);
  });

  it("reads the .pdf fixture", async () => {
    const doc = await extractDocument(await fixture("policy.pdf", "application/pdf"));
    expect(doc.paragraphs[0].id).toBe("p1");
    expect(doc.paragraphs[0].text.startsWith(FIRST)).toBe(true);
  });

  it("uses the MIME type when the name has no extension", async () => {
    const doc = await extractDocument(new File([LONG], "policy", { type: "text/plain" }));
    expect(doc.paragraphs).toHaveLength(1);
  });

  it("rejects a .png with 415", async () => {
    const err = await errorOf(new File([new Uint8Array([137, 80, 78, 71])], "logo.png", { type: "image/png" }));
    expect([err.status, err.code]).toEqual([415, "unsupported_type"]);
  });

  it("rejects 4 MB + 1 byte with 413", async () => {
    const err = await errorOf(new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "big.txt"));
    expect([err.status, err.code]).toEqual([413, "too_large"]);
  });

  it("rejects whitespace-only text with 422", async () => {
    const err = await errorOf(new File(["   \n\n\t  \n"], "blank.txt"));
    expect([err.status, err.code]).toEqual([422, "no_text"]);
    expect(err.message).toBe("Upload a text PDF or DOCX (scanned PDFs have no text)");
  });

  it("rejects a corrupt PDF with 422, not 500", async () => {
    const err = await errorOf(new File(["not really a pdf"], "broken.pdf"));
    expect([err.status, err.code]).toEqual([422, "no_text"]);
  });

  it("strips emails and phone numbers", async () => {
    const doc = await extractDocument(
      new File([`${LONG} Contact jane.doe@example.com or 416-555-0199.`], "policy.txt"),
    );
    expect(doc.paragraphs[0].text).toBe(`${LONG} Contact [email] or [phone].`);
  });
});
