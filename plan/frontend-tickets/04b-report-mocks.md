# Ticket 04B · Report on mocks · 11:00 · ~2 h (with the lunch gap)

**Branch:** `feat(frontend)/04b-report` · **Depends on:** 04A merged

## Paste this

```text
Read CLAUDE.md ("User flow" → Report, "Criteria and scoring", hard rules 1, 2, 7),
src/shared/types.ts, src/shared/score.ts and rubric/rubric.json, then implement 04B on a new
branch feat(frontend)/04b-report cut from main. Stop and ask if anything contradicts CLAUDE.md.
Never write learning copy or advice: every explanatory string comes from rubric.json or
content/.

Goal: a polished, judge-ready Report page that renders any set of CriterionResults, built and
reviewed on the 3 mock results.

/report (client page reading useAssessment()):
- No results → an empty state with "Start an assessment" → /assess.
- Header row: document name, "Fictional sample" badge when sampleId is set, and a "Cached run"
  badge with a tooltip if ANY result has cached:true (hard rule 7).
- WarningBanner (above the score): shown when overall.warnings is non-empty; lists each
  baseline warning by criterion shortTitle, e.g. "Prohibits discrimination: baseline not met", with an anchor to that card.
  Red, with an icon and role="alert". Shown whatever the percentage.
- ScoreGauge (Recharts RadialBarChart): percent and band label (from rubric bands) with the
  band colour; "Not legal advice" directly underneath; a text alternative for screen readers.
- Weights line: "Prohibits discrimination ×3 · Indigenous-specific hiring ×2 · Retention and advancement ×1; N/A criteria are left out of the total". Never show H# ids in the UI.
- CriterionCard ×3 (H1, H3, H5 in rubric order):
  - Title, tier badge (Baseline / Conditional / Leading practice), weight, score chip
    (0/1/2 or N/A) coloured by status, status text.
  - reasoning (1–2 sentences from the result).
  - Three columns (stacking on mobile):
    1. "Evidence found": each check with met ✓ / not met ○ (and level 0/1/2 for graded
       checks), its VERIFIED quotes only, each with a paragraph chip (p7) that 07 will make
       clickable. Unverified evidence is never shown.
    2. "Gaps": unmet checks, each followed by rubric addressedLooksLike and whyItMatters with
       its sources linked. Red flags appear here in red with the verified quote.
    3. "Where to learn": rubric resources as links.
  - N/A card (H3): greyed, with "Not applicable: <appliesWhen text>" and a note that it is left
    out of the total.
- ComingNext: greyed cards from rubric.comingNext, plus "Assessing several documents together"
  and "A gold-standard policy set reviewed by an Indigenous organization" (use the team's exact
  wording if it's in content/; otherwise leave a TODO(team)).
- Footer actions: "Run again" (re-runs the same document), "New assessment", "Methodology &
  Sources" link. Leave a Print / Save PDF button stub for ticket 10.

Components live in src/components/report/: ScoreGauge, WarningBanner, CriterionCard,
EvidenceList, GapList, ResourceList, ComingNext.

Tests (no network): pure helpers in src/components/report/format.ts (status → colour token,
tier label, which evidence to show = verified only, gaps = unmet checks) with tests; the mock
Partial result shows exactly 1 warning and the red flag; N/A is excluded.

DONE WHEN: npm test, typecheck and build pass; with mocks, Weak shows 38 Emerging + an H3 N/A
card; Partial shows 58 Developing + the red baseline banner + a red flag; Strong shows 100
Leading; the layout works at 375px, 768px and desktop; no unverified quote is ever rendered.
Screenshot all 3 for the PR. Commit "04B: report on mocks", push, open a PR.
```

## Acceptance
- [ ] 38 / 58 / 100 render with the correct bands and banners
- [ ] Gaps show only rubric copy; no generated advice anywhere
- [ ] Verified quotes only; N/A handled; Cached run badge exists
- [ ] Responsive at phone, tablet and desktop widths
