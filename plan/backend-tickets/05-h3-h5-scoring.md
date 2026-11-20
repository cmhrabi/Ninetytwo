# Ticket 05 · H3 + H5 + baseline warnings · 1:00 · ~45 min

**Branch:** `feat(backend)/05-h3-h5-scoring` · **Depends on:** 03 merged

## Paste this

```text
Read CLAUDE.md ("Criteria and scoring") and rubric/rubric.json, then implement phase 05 on a new
branch feat(backend)/05-h3-h5-scoring cut from main. If tech/05-h3-h5-scoring.md exists, follow
it. Stop and ask if anything contradicts CLAUDE.md. Don't edit any TODO(team) text.

Goal: H3 (conditional, red flags) and H5 (graded average) score correctly, and every rule in
CLAUDE.md "Criteria and scoring" is enforced by applyRubric and covered by a table test.

H3 (conditional)
- The judge schema for criteria whose appliesWhen != "always" includes `applicable: boolean`
  plus `applicabilityEvidence: [{ quote, paragraphId }]`.
- Applicable only if the AI says applicable AND at least one applicability quote is verified.
  Prompt wording: restricting hiring to, designating roles for, or preferring Indigenous
  candidates counts; "encouraged to apply" alone does not.
- Not applicable → applicable:false, score:null, status "Not applicable", warning:null,
  checks all met:false.
- Red flags (identityOnGeneralForms, employerAloneConfirms): count only with a verified quote
  (judge output or scan.redFlags, deduped by id). Any verified red flag → score 0, warning
  "baseline", and redFlags lists it with verified evidence only.
- Applicable and score 0 → warning "baseline".

H5 (type "average", capAt1Unless "d")
- Graded checks a–d: level 0/1/2 from the AI; a level > 0 needs ≥1 verified quote, else 0.
- score = mean of levels, rounded half up (1.5 → 2, 1.25 → 1, 0.5 → 1).
- If level(d) < 1, cap the score at 1.
- met = level ≥ 1. H5 never raises a baseline warning (warnOnZero false).

GENERAL
- Remove the TODO(05) seams and any 501 from phase 03; H1, H3 and H5 all go through one
  applyRubric.
- Status mapping and warnings are driven by rubric data (no hard-coded "H1"/"H3" in core/).

TESTS (no network; table-driven in applyRubric.test.ts)
- H3: no Indigenous-specific hiring → N/A, null, no warning; applicable but the applicability
  quote is fabricated → N/A; all 4 checks verified → 2; legalBasis only → 1; nothing → 0 +
  warning; a verified red flag on an otherwise perfect policy → 0 + warning; an unverified red
  flag is ignored.
- H5: (2,2,2,2) → 2; (2,2,2,0) → 1 (cap); (1,1,2,2) → 2 (1.5 rounds up); (1,1,1,0) → 1;
  (0,0,0,0) → 0; level 2 with no verified quote → treated as 0.
- computeOverall with real results: weak (1, N/A, 0) → 38; partial (2, 0+warning, 1) → 58 with
  1 warning; strong (2, 2, 2) → 100.
- Extend pipeline.test.ts fixtures to all 3 samples × H1/H3/H5 and assert 38 / 58 / 100.

DONE WHEN: npm test and npm run typecheck pass; npm run smoke (with npm run dev) prints all
three criteria for the weak sample from real AI calls. Commit "05: H3 H5 scoring", push,
open a PR.
```

## Acceptance
- [ ] H3 is N/A on Weak and 0 + warning on Partial (fixtures)
- [ ] H5 follows the average/cap rules exactly
- [ ] The pipeline test gives 38 / 58 / 100 from fixtures
