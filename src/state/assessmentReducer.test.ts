import { describe, expect, it } from "vitest";
import type { DocumentText } from "@/shared";
import { canRun, checkFile, initialSetup, runBlocker, setupReducer, type SetupState } from "./assessmentReducer";

const doc = (fileName: string): DocumentText => ({ fileName, paragraphs: [{ id: "p1", text: "Hello" }] });

const apply = (...actions: Parameters<typeof setupReducer>[1][]) =>
  actions.reduce<SetupState>(setupReducer, initialSetup);

describe("setupReducer", () => {
  it("loads a sample", () => {
    const s = apply(
      { type: "load/start", requestId: 1, source: { kind: "sample", id: "weak" } },
      { type: "load/success", requestId: 1, document: doc("weak.txt") },
    );
    expect(s.document?.fileName).toBe("weak.txt");
    expect(s.loading).toBeNull();
  });

  it("ignores a late sample response after an upload was started", () => {
    const s = apply(
      { type: "load/start", requestId: 1, source: { kind: "sample", id: "weak" } },
      { type: "load/start", requestId: 2, source: { kind: "upload", fileName: "mine.pdf" } },
      { type: "load/success", requestId: 1, document: doc("weak.txt") },
    );
    expect(s.document).toBeNull();
    expect(s.loading).toBe("extract");
    const done = setupReducer(s, { type: "load/success", requestId: 2, document: doc("mine.pdf") });
    expect(done.document?.fileName).toBe("mine.pdf");
  });

  it("sets the error and clears the document when extract fails", () => {
    const s = apply(
      { type: "load/start", requestId: 1, source: { kind: "sample", id: "weak" } },
      { type: "load/success", requestId: 1, document: doc("weak.txt") },
      { type: "load/start", requestId: 2, source: { kind: "upload", fileName: "scan.pdf" } },
      { type: "load/failure", requestId: 2, code: "no_text" },
    );
    expect(s.error).toBe("no_text");
    expect(s.document).toBeNull();
    expect(s.source).toBeNull();
  });

  it("a client-side reject wins over an in-flight load", () => {
    const s = apply(
      { type: "load/start", requestId: 1, source: { kind: "sample", id: "weak" } },
      { type: "reject", requestId: 2, code: "too_large" },
      { type: "load/success", requestId: 1, document: doc("weak.txt") },
    );
    expect(s.error).toBe("too_large");
    expect(s.document).toBeNull();
  });

  it("reset ignores late results", () => {
    const s = apply(
      { type: "load/start", requestId: 1, source: { kind: "sample", id: "weak" } },
      { type: "consent", value: true },
      { type: "reset", requestId: 2 },
      { type: "load/success", requestId: 1, document: doc("weak.txt") },
    );
    expect(s.document).toBeNull();
    expect(s.consent).toBe(false);
  });
});

describe("canRun / runBlocker", () => {
  it("needs a document and consent", () => {
    const withDoc = apply(
      { type: "load/start", requestId: 1, source: { kind: "sample", id: "weak" } },
      { type: "load/success", requestId: 1, document: doc("weak.txt") },
    );
    expect(canRun(initialSetup)).toBe(false);
    expect(runBlocker(initialSetup)).toMatch(/Choose a document/);
    expect(canRun(withDoc)).toBe(false);
    expect(runBlocker(withDoc)).toMatch(/consent/);
    const ok = setupReducer(withDoc, { type: "consent", value: true });
    expect(canRun(ok)).toBe(true);
    expect(runBlocker(ok)).toBeNull();
    expect(setupReducer(ok, { type: "run" }).ready).toBe(true);
  });

  it("run is a no-op when blocked", () => {
    expect(setupReducer(initialSetup, { type: "run" }).ready).toBe(false);
  });
});

describe("checkFile", () => {
  it("accepts pdf, docx and txt up to 4 MB", () => {
    expect(checkFile({ name: "Policy.PDF", size: 1000 })).toBeNull();
    expect(checkFile({ name: "a.docx", size: 4 * 1024 * 1024 })).toBeNull();
    expect(checkFile({ name: "a.txt", size: 10 })).toBeNull();
  });
  it("rejects other types and big files", () => {
    expect(checkFile({ name: "a.png", size: 10 })).toBe("unsupported_type");
    expect(checkFile({ name: "a.pdf", size: 4 * 1024 * 1024 + 1 })).toBe("too_large");
  });
});
