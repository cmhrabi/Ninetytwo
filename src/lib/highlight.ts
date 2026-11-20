// Pure helpers for the evidence viewer: find verified quotes inside paragraph text and split the
// text into plain and highlighted segments. No React, no I/O. Client-safe (no src/server imports).
import { verifiedEvidence, verifiedRedFlags } from "@/components/report/format";
import type { CriterionResult } from "@/shared";

export type MarkKind = "check" | "flag";
export type Mark = { quote: string; criterion: string; kind: MarkKind };
export type SegmentMark = { criteria: string[]; flag: boolean };
export type Segment = { text: string; mark?: SegmentMark };

const SINGLE = /[‘’‚‛′]/g;
const DOUBLE = /[“”„‟″]/g;

/**
 * Same normalization as `norm` in src/server/core/quoteCheck.ts (which a client file can't import).
 * Keep the two identical: lowercase, curly quotes to straight, collapse whitespace, trim.
 */
export function norm(s: string): string {
  return s.normalize("NFC").toLowerCase().replace(SINGLE, "'").replace(DOUBLE, '"').replace(/\s+/g, " ").trim();
}

/** Same trimming the server applies to a quote before matching. */
const cleanQuote = (quote: string) => norm(quote).replace(/^["']+|["'.…]+$/g, "").trim();

/** `norm(text)` plus, for each normalized char, the index of the original char it came from. */
export function normWithMap(text: string): { out: string; map: number[] } {
  const source = text.normalize("NFC");
  let out = "";
  const map: number[] = [];
  let pendingSpace = -1;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (/\s/.test(ch)) {
      if (out.length > 0 && pendingSpace < 0) pendingSpace = i;
      continue;
    }
    if (pendingSpace >= 0) {
      out += " ";
      map.push(pendingSpace);
      pendingSpace = -1;
    }
    const lowered = ch.toLowerCase().replace(SINGLE, "'").replace(DOUBLE, '"');
    for (let k = 0; k < lowered.length; k++) map.push(i);
    out += lowered;
  }
  return { out, map };
}

/** `[start, end)` offsets in `text` for every match of `quote` (after normalization). */
export function findRanges(text: string, quote: string): [number, number][] {
  const q = cleanQuote(quote);
  if (!q) return [];
  const { out, map } = normWithMap(text);
  const ranges: [number, number][] = [];
  let from = 0;
  for (;;) {
    const at = out.indexOf(q, from);
    if (at < 0) break;
    ranges.push([map[at], map[at + q.length - 1] + 1]);
    from = at + 1;
  }
  return ranges;
}

/**
 * Splits `text` into segments, highlighting every mark's quote. Overlapping or touching ranges merge
 * (criteria unioned; a red flag anywhere in the merge makes it a flag). Quotes not found add nothing.
 * Offsets are into the NFC form of `text`, which is what is returned.
 */
export function segments(text: string, marks: Mark[]): Segment[] {
  const source = text.normalize("NFC");
  const ranges = marks
    .flatMap((m) => findRanges(source, m.quote).map(([start, end]) => ({ start, end, m })))
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const merged: { start: number; end: number; criteria: string[]; flag: boolean }[] = [];
  for (const r of ranges) {
    const last = merged.at(-1);
    if (last && r.start <= last.end) {
      last.end = Math.max(last.end, r.end);
      if (!last.criteria.includes(r.m.criterion)) last.criteria.push(r.m.criterion);
      last.flag ||= r.m.kind === "flag";
    } else {
      merged.push({ start: r.start, end: r.end, criteria: [r.m.criterion], flag: r.m.kind === "flag" });
    }
  }

  const out: Segment[] = [];
  let pos = 0;
  for (const r of merged) {
    if (r.start > pos) out.push({ text: source.slice(pos, r.start) });
    out.push({ text: source.slice(r.start, r.end), mark: { criteria: r.criteria, flag: r.flag } });
    pos = r.end;
  }
  if (pos < source.length || out.length === 0) out.push({ text: source.slice(pos) });
  return out;
}

/** Verified check quotes and verified red-flag quotes, grouped by paragraph id. */
export function marksByParagraph(results: CriterionResult[]): Map<string, Mark[]> {
  const byParagraph = new Map<string, Mark[]>();
  const add = (paragraphId: string, mark: Mark) => {
    const list = byParagraph.get(paragraphId) ?? [];
    list.push(mark);
    byParagraph.set(paragraphId, list);
  };
  for (const r of results) {
    for (const check of r.checks) {
      for (const e of verifiedEvidence(check.evidence)) add(e.paragraphId, { quote: e.quote, criterion: r.criterion, kind: "check" });
    }
    for (const flag of verifiedRedFlags(r)) {
      for (const e of flag.evidence) add(e.paragraphId, { quote: e.quote, criterion: r.criterion, kind: "flag" });
    }
  }
  return byParagraph;
}
