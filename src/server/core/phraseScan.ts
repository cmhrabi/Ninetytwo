import type { CriterionScan, Paragraph, Rubric, ScanHit } from "@/shared";
import { fold } from "./text";

/**
 * Keyword pass: case- and accent-insensitive substring match of each criterion's phrases
 * (stems such as "discriminat" work). Red-flag phrases only produce candidates labelled
 * "redflag:<id>"; code alone never confirms a red flag. Pure; no I/O.
 */
export function phraseScan(paragraphs: Paragraph[], rubric: Pick<Rubric, "criteria">): CriterionScan[] {
  const folded = paragraphs.map((p) => ({ id: p.id, text: fold(p.text) }));
  return rubric.criteria.map((criterion) => {
    const terms = [
      ...criterion.phrases.map((phrase) => ({ needle: fold(phrase), label: phrase })),
      ...criterion.redFlags.flatMap((flag) =>
        flag.phrases.map((phrase) => ({ needle: fold(phrase), label: `redflag:${flag.id}` })),
      ),
    ];
    const candidates: ScanHit[] = [];
    for (const p of folded) {
      const labels = [...new Set(terms.filter((t) => p.text.includes(t.needle)).map((t) => t.label))];
      if (labels.length) candidates.push({ paragraphId: p.id, source: "keyword", label: labels.join(", ") });
    }
    return { criterion: criterion.id, candidates, redFlags: [] };
  });
}
