import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import type { DocumentText } from "@/shared";
import { toParagraphs } from "../core/paragraphs";
import { stripPii } from "../core/pii";
import { HttpError } from "../http/errors";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // Vercel caps bodies at 4.5 MB
const MIN_TEXT_CHARS = 50;
const NO_TEXT = "Upload a text PDF or DOCX (scanned PDFs have no text)";

type Kind = "pdf" | "docx" | "txt";

const MIME_KINDS: Record<string, Kind> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
};

function detectKind(file: File): Kind | null {
  const ext = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  if (ext === "pdf" || ext === "docx" || ext === "txt") return ext;
  if (ext) return null; // a known-wrong extension wins over a vague MIME type
  return MIME_KINDS[file.type.split(";")[0].trim()] ?? null;
}

async function readRawText(kind: Kind, buf: ArrayBuffer): Promise<string> {
  switch (kind) {
    case "pdf": {
      const pdf = await getDocumentProxy(new Uint8Array(buf));
      const { text } = await extractText(pdf, { mergePages: true });
      return Array.isArray(text) ? text.join("\n\n") : text;
    }
    case "docx":
      return (await mammoth.extractRawText({ buffer: Buffer.from(buf) })).value;
    case "txt":
      return new TextDecoder("utf-8").decode(buf);
  }
}

/**
 * Turns an uploaded file into numbered, PII-stripped paragraphs. Everything stays in memory:
 * the file is never written to disk (CLAUDE.md hard rule 4).
 */
export async function extractDocument(file: File): Promise<DocumentText> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new HttpError(413, "too_large", "File is over the 4 MB limit");
  }
  const kind = detectKind(file);
  if (!kind) {
    throw new HttpError(415, "unsupported_type", "Upload a PDF, DOCX or TXT file");
  }

  let raw: string;
  try {
    raw = await readRawText(kind, await file.arrayBuffer());
  } catch {
    // A corrupt or encrypted file: tell the user, don't 500.
    throw new HttpError(422, "no_text", NO_TEXT);
  }

  const paragraphs = toParagraphs(raw).map((p) => ({ ...p, text: stripPii(p.text) }));
  const chars = paragraphs.reduce((n, p) => n + p.text.length, 0);
  if (paragraphs.length === 0 || chars < MIN_TEXT_CHARS) {
    throw new HttpError(422, "no_text", NO_TEXT);
  }
  return { fileName: file.name, paragraphs };
}
