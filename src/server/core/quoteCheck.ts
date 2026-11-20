import type { Evidence, Paragraph } from "@/shared";

export const MIN_QUOTE_WORDS = 3;

/** Lowercase, curly quotes to straight, collapse whitespace, trim. */
export function norm(s: string): string {
  return s
    .normalize("NFC")
    .toLowerCase()
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * A quote counts only if it appears verbatim (after norm) in its cited paragraph, else anywhere
 * in the document (paragraphId corrected). Quotes under 3 words never verify. Pure.
 */
export function verifyEvidence(
  e: { quote: string; paragraphId: string },
  paragraphs: Paragraph[],
): Evidence {
  const quote = norm(e.quote).replace(/^["']+|["'.…]+$/g, "").trim();
  const unverified: Evidence = { quote: e.quote, paragraphId: e.paragraphId, verified: false };
  if (quote.split(" ").filter(Boolean).length < MIN_QUOTE_WORDS) return unverified;

  const cited = paragraphs.find((p) => p.id === e.paragraphId);
  if (cited && norm(cited.text).includes(quote)) return { ...unverified, verified: true };
  const found = paragraphs.find((p) => norm(p.text).includes(quote));
  if (found) return { quote: e.quote, paragraphId: found.id, verified: true };
  return unverified;
}
