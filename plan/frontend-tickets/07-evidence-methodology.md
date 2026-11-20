# Ticket 07 · Evidence viewer + Methodology & Sources · 1:40 · ~50 min

**Branch:** `feat(frontend)/07-evidence-methodology` · **Depends on:** 06 merged

## Paste this

```text
Read CLAUDE.md ("User flow" 3–4, hard rules 1–4) and rubric/rubric.json, then implement 07 on a
new branch feat(frontend)/07-evidence-methodology cut from main. Stop and ask if anything
contradicts CLAUDE.md. Never write learning or OCAP® copy: it comes from content/ and
rubric.json.

Goal: judges can click any quote and see it in the document ("the wow moment"), and the
Methodology & Sources page explains exactly how scoring works.

EVIDENCE VIEWER (src/components/report/EvidenceViewer.tsx)
- On /report: a "View document" toggle opens a split pane (desktop: right side, sticky; mobile:
  a full-screen sheet) listing all paragraphs with p-ids in the margin.
- Every verified quote is highlighted inside its paragraph (<mark>, coloured by criterion,
  with a legend). Matching uses the same normalization as the server (case, whitespace,
  curly quotes) in a pure helper src/lib/highlight.ts that returns text segments; never
  dangerouslySetInnerHTML.
- Clicking a quote or its p-chip in a CriterionCard opens the viewer, scrolls the paragraph
  into view (smooth, centered) and pulses it; focus moves there for keyboard users, and Esc
  closes it. Clicking a highlight jumps back to its card.
- Red-flag quotes are highlighted in red.
- The document lives only in memory (state); nothing is persisted.

METHODOLOGY & SOURCES (/methodology), a server component:
- "How scoring works": render from rubric.json: criteria table (id, title, tier, weight,
  max points, when it counts), check list per criterion with level text, band table, the
  formula round(100 × Σ(score×weight) ÷ Σ(2×weight)) with the worked example H1=1, H3=N/A,
  H5=1 → 50 Developing.
- "What the AI does and never does": factual tool behaviour (you may write this; it's about
  the software, not Indigenous content): scan finds candidate passages; the judge reports
  checks with exact quotes; code verifies every quote and does all scoring; the AI never
  scores, writes advice or recommends policy changes; documents are treated as data.
- "Your data": from content/data-note.md (in memory only, never stored, emails and phones
  stripped, what goes to the AI provider). If the file is TODO, show it as TODO.
- "Sources and attributions": content/sources.md plus every source and resource URL from
  rubric.json, deduplicated, alphabetised.
- "Version": rubric.version.

Tests (no network): highlight.ts (curly quotes, whitespace, multiple quotes in one paragraph,
overlapping quotes merged, quote not found → no highlight); methodology data builders (sources
deduped and sorted, the formula example equals computeOverall's result).

DONE WHEN: npm test, typecheck and build pass; on a real run, clicking any quote scrolls to and
highlights it; keyboard and Esc work; /methodology renders every section with all rubric
sources; nothing about Indigenous Peoples was written by the AI. Commit "07: evidence viewer and
methodology", push, open a PR.
```

## Acceptance
- [ ] Quote → document jump works on desktop and mobile
- [ ] Methodology is generated from `rubric.json`, so it stays in sync with the scoring
- [ ] Data note and sources come from team content
