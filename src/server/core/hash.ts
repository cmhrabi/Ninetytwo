import { createHash } from "node:crypto";
import type { Paragraph } from "@/shared";
import { norm } from "./quoteCheck";

/**
 * sha256 of the normalized paragraph texts, so the same document hashes the same however it
 * arrived (whitespace, curly quotes, case). Identifies the sample policies for the cache. Pure.
 */
export function docHash(paragraphs: Paragraph[]): string {
  return createHash("sha256")
    .update(paragraphs.map((p) => norm(p.text)).join("\n"))
    .digest("hex");
}
