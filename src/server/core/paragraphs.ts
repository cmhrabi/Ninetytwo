import type { Paragraph } from "@/shared";

const LIST_ITEM = /^\s*(?:[-•*▪◦]|\d+[.)])\s+/;
const PAGE_NUMBER = /^(?:page\s+)?\d+(?:\s*(?:of|\/)\s*\d+)?$/i;

/** Splits raw document text into numbered paragraphs p1..pn. Pure; no I/O. */
export function toParagraphs(raw: string): Paragraph[] {
  const text = raw.replace(/\r\n?/g, "\n").replace(/[   ]/g, " ");
  const items: string[] = [];

  for (const block of text.split(/\n\s*\n/)) {
    let current: string[] = [];
    const flush = () => {
      if (current.length) items.push(current.join(" "));
      current = [];
    };
    for (const line of block.split("\n")) {
      if (!line.trim()) continue;
      if (LIST_ITEM.test(line)) flush(); // each list item is its own paragraph
      current.push(line.trim());
    }
    flush();
  }

  return items
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter((item) => item && !PAGE_NUMBER.test(item))
    .flatMap(splitLong)
    .map((item, i) => ({ id: `p${i + 1}`, text: item }));
}

/**
 * Longest paragraph we emit. Text from PDFs often has no blank lines, so a whole page (or
 * document) can arrive as one block; the API rejects paragraphs over 5000 chars.
 */
export const MAX_PARAGRAPH_CHARS = 1500;

/** Splits an over-long paragraph at sentence ends, falling back to word boundaries. */
function splitLong(text: string): string[] {
  if (text.length <= MAX_PARAGRAPH_CHARS) return [text];
  const sentences = text.match(/[^.!?]+(?:[.!?]+["'”’)\]]*|$)\s*/g) ?? [text];
  const pieces = sentences.flatMap((s) => (s.length > MAX_PARAGRAPH_CHARS ? splitWords(s) : [s]));

  const out: string[] = [];
  let current = "";
  for (const piece of pieces) {
    if (current && current.length + piece.length > MAX_PARAGRAPH_CHARS) {
      out.push(current.trim());
      current = "";
    }
    current += piece;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

/** Last resort for a run-on "sentence": cut at spaces, or hard-cut a space-free run. */
function splitWords(text: string): string[] {
  const out: string[] = [];
  let rest = text;
  while (rest.length > MAX_PARAGRAPH_CHARS) {
    const space = rest.lastIndexOf(" ", MAX_PARAGRAPH_CHARS);
    const cut = space > 0 ? space + 1 : MAX_PARAGRAPH_CHARS;
    out.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  if (rest) out.push(rest);
  return out;
}
