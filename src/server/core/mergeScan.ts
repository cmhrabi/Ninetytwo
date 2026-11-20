import type { CriterionScan, Paragraph, RedFlag, Rubric, ScanHit, ScanResult } from "@/shared";
import { verifyEvidence } from "./quoteCheck";
import type { ScanReply } from "./scanSchema";

const MAX_LABEL_WORDS = 8;
const shortLabel = (s: string) => s.trim().split(/\s+/).slice(0, MAX_LABEL_WORDS).join(" ");

/**
 * Union of keyword and AI candidates per criterion, deduped by paragraph (AI label wins).
 * Red flags only from the AI, and only when their quote verifies. Unknown ids are ignored.
 */
export function mergeScan(
  keyword: CriterionScan[],
  ai: ScanReply | null,
  paragraphs: Paragraph[],
  rubric: Pick<Rubric, "criteria">,
): ScanResult {
  const known = new Set(paragraphs.map((p) => p.id));
  const order = new Map(paragraphs.map((p, i) => [p.id, i]));

  const criteria = rubric.criteria.map((criterion) => {
    const byParagraph = new Map<string, ScanHit>();
    for (const hit of keyword.find((k) => k.criterion === criterion.id)?.candidates ?? []) {
      if (known.has(hit.paragraphId)) byParagraph.set(hit.paragraphId, hit);
    }
    const aiEntries = ai?.criteria.filter((c) => c.criterion === criterion.id) ?? [];
    for (const hit of aiEntries.flatMap((c) => c.hits)) {
      if (!known.has(hit.paragraphId)) continue;
      byParagraph.set(hit.paragraphId, { paragraphId: hit.paragraphId, source: "ai", label: shortLabel(hit.label) });
    }

    const redFlags: RedFlag[] = [];
    for (const flag of aiEntries.flatMap((c) => c.redFlags)) {
      const def = criterion.redFlags.find((f) => f.id === flag.id);
      if (!def) continue;
      const evidence = verifyEvidence(flag, paragraphs);
      if (!evidence.verified) continue;
      const existing = redFlags.find((r) => r.id === def.id);
      if (existing) existing.evidence.push(evidence);
      else redFlags.push({ id: def.id, label: def.label, evidence: [evidence] });
    }

    const candidates = [...byParagraph.values()].sort(
      (a, b) => (order.get(a.paragraphId) ?? 0) - (order.get(b.paragraphId) ?? 0),
    );
    return { criterion: criterion.id, candidates, redFlags };
  });

  return { aiScanned: ai !== null, criteria };
}
