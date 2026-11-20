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
    .map((item, i) => ({ id: `p${i + 1}`, text: item }));
}
