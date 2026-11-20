# 05 · H3, H5 and baseline warnings (Tech B, 1:00)

Branch: `feat(backend)/05-h3-h5-scoring`

## Goal

Finish the score engine for all three criteria: conditional applicability (H3), verified red
flags, graded checks with the `average` rule (H5) and baseline warnings. The rubric's data
drives everything. Don't add code that branches on `"H3"` or `"H5"`.

## Read first

- `CLAUDE.md` "Criteria and scoring"; `plan.md` "Scoring model" and the H5 rubric table
- `src/server/core/applyRubric.ts`, `prompt.ts` and `src/test/fixtures/`

## Steps

1. **Applicability** in `applyRubric` (when `appliesWhen !== "always"`):
   - Applicable only if the model says `applicable.value = true` AND at least one applicability
     quote verifies. Otherwise:
     - `applicable: false`, `score: null`, `status: "Not applicable"`
     - empty checks evidence
     - no warning
   - Red flags still count when applicable is true: a verified red flag sets score 0 and the
     baseline warning.
2. **`average` scoring** for graded checks:
   - A level counts only with at least one verified quote; otherwise it's 0.
   - Score = mean of the levels, rounded half up (1.5 → 2, 0.5 → 1, 0.25 → 0).
   - If `capAt1Unless` is set and that check's level is below 1, cap the score at 1.
   - `met` for a graded check = level ≥ 1.
3. **Warnings**: `warning: "baseline"` when (`warnOnZero` and score === 0) or any verified red
   flag. An N/A criterion never warns.
4. **Prompt**:
   - For conditional criteria, the judge prompt shows the `appliesWhen` text and asks for an
     applicability quote. Include "'Encouraged to apply' alone does not count".
   - For graded checks, show the 0/1/2 level text and ask for `level`.
5. **Fixtures**: run `record-fixtures.ts` for H3 and H5 on all three samples.
6. **`smoke.ts`** already loops over every rubric criterion. Make sure it prints H3 as N/A for
   the weak sample.

## Tests (no network)

- `applyRubric.test.ts`, table-driven:
  - H3:
    - not applicable (no preference language) → `score: null`, N/A, no warning
    - model says applicable but the quote is fake → N/A
    - applicable with only legalBasis → 1
    - all four checks → 2
    - applicable with nothing → 0 + warning
    - a verified `identityOnGeneralForms` red flag with all checks met → 0 + warning
    - a red flag with a fake quote → ignored
  - H5:
    - levels (2, 2, 2, 2) → 2
    - (2, 2, 2, 0) → capped at 1 by `d`
    - (1, 1, 0, 0) → 1
    - (1, 0, 0, 0) → 0
    - (2, 1, 1, 2) → 2
    - level 2 claimed without a verified quote → counted as 0
- `score.test.ts`: a full result set per sample gives 38, 58 and 100.
- `pipeline.test.ts`: all three criteria × three samples with fixtures. Assert:
  - weak: H1 1, H3 N/A, H5 0 → 38 Emerging
  - partial: H1 2, H3 0 + warning, H5 1 → 58 Developing
  - strong: 2/2/2 → 100 Leading

  If a fixture disagrees because the sample text doesn't support the target, log it for
  Non-tech C (08 calibrates). Don't change the rules to fit.

## Done when

- [ ] `npm test` and `npm run typecheck` pass
- [ ] `npm run smoke` shows all three criteria for `weak`, with H3 N/A, and the overall score and band
- [ ] `curl` the partial sample through scan → judge H3 and the result has `warning: "baseline"`
- [ ] No code mentions `"H3"` or `"H5"` outside tests and `rubric.json` (`grep -rn '"H[35]"' src --include=*.ts | grep -v test`)
