import { describe, expect, it } from "vitest";
import type { ApiError, DocumentText, ErrorCode } from "@/shared";
import { MAX_UPLOAD_BYTES } from "@/server/services/extractText";
import { POST } from "./route";

const URL = "http://localhost/api/extract";
const TEXT = "Our hiring policy applies to every role and every candidate we consider.";

function upload(file?: File): Request {
  const form = new FormData();
  if (file) form.set("file", file);
  return new Request(URL, { method: "POST", body: form });
}

async function expectError(res: Response, status: number, code: ErrorCode) {
  expect(res.status).toBe(status);
  const body = (await res.json()) as ApiError;
  expect(body.error.code).toBe(code);
  expect(typeof body.error.message).toBe("string");
}

describe("POST /api/extract", () => {
  it("returns DocumentText for a .txt upload", async () => {
    const res = await POST(upload(new File([TEXT], "policy.txt", { type: "text/plain" })));
    expect(res.status).toBe(200);
    const body = (await res.json()) as DocumentText;
    expect(body).toEqual({ fileName: "policy.txt", paragraphs: [{ id: "p1", text: TEXT }] });
  });

  it("returns 400 when the file field is missing", async () => {
    await expectError(await POST(upload()), 400, "bad_request");
  });

  it("returns 400 for a non-multipart body", async () => {
    const req = new Request(URL, { method: "POST", body: "{}", headers: { "content-type": "application/json" } });
    await expectError(await POST(req), 400, "bad_request");
  });

  it("returns 415 for an unsupported type", async () => {
    await expectError(await POST(upload(new File(["{}"], "package.json"))), 415, "unsupported_type");
  });

  it("returns 413 for a file over 4 MB", async () => {
    const big = new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "big.txt");
    await expectError(await POST(upload(big)), 413, "too_large");
  });

  it("returns 422 when there is no text", async () => {
    await expectError(await POST(upload(new File(["  \n\n "], "blank.txt"))), 422, "no_text");
  });
});
