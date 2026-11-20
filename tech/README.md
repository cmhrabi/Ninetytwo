# Phase prompts

Each file here is one prompt for a fresh Claude Code session. Start every session with:

> Read CLAUDE.md, then do tech/0X-<name>.md. Stop and ask if anything contradicts CLAUDE.md.

A phase is done only when every item in its **Done when** list passes, starting with `npm test`
and `npm run typecheck`. Then commit (`0X: <what>`), push, and open a PR to `main`.

## Before the first phase

1. `nvm use` (Node 24; Node 18 can't run Next 16), then `npm ci`.
2. Paste the OpenRouter key into `.env.local` after `OPENROUTER_API_KEY=` (gitignored, never
   committed). `.env.example` shows the variables.

## Branches

One branch per phase, cut from an up-to-date `main`:

```bash
git switch main && git pull && git switch -c "feat(backend)/01-foundation"
```

Tech B uses `feat(backend)/0X-name`; Tech A uses `feat(frontend)/0X-name`. Git forbids `:` in
branch names, so the scope is followed by `/`.

## Phases

| # | File | Owner | Start | What it delivers |
| --- | --- | --- | --- | --- |
| 01 | [01-foundation.md](01-foundation.md) | Tech B | 9:45 | Shared contract + score math, OpenRouter client, rubric, `/api/health`, `/api/rubric`, `test:ai`. **Unblocks Tech A.** |
| 02 | [02-extract-samples.md](02-extract-samples.md) | Tech B | 10:05 | PDF/DOCX/TXT → numbered paragraphs, PII strip, `/api/extract`, `/api/samples` |
| 03 | [03-scan-and-judge-h1.md](03-scan-and-judge-h1.md) | Tech B | 10:45 | Scan stage (keywords + red flags + AI), judge H1, quote check, rules engine, pipeline test, `smoke` |
| 04 | not written here | Tech A | 10:05 | Landing + Assess + Report on mock JSON (`src/mocks/`) |
| 05 | [05-h3-h5-scoring.md](05-h3-h5-scoring.md) | Tech B | 1:00 | H3 (N/A, red flags), H5 (graded average), baseline warnings |
| 06 | not written here | Tech A | 1:00 | Wire UI to the API: extract/sample → scan → 3 judges in parallel; loading and error states |
| 07 | not written here | Tech A | 1:40 | Evidence viewer, Methodology & Sources page |
| 08 | [08-calibrate-cache.md](08-calibrate-cache.md) | Tech B + Non-tech C | 1:45 | Calibrate on the 3 samples, cached fallback |
| 09 | [09-readme-tech.md](09-readme-tech.md) | Tech B | 2:30 | README tech sections, clean-install check |

Feature freeze 3:00 pm. If a gate slips, cut scope in the order given in the plan (before/after,
evidence highlighter, motion), never samples, verified quotes or Methodology & Sources.

## How the backend fits together

```
POST /api/extract | GET /api/samples/:id  →  DocumentText { paragraphs p1..pn }
POST /api/scan     { paragraphs }          →  ScanResult    (keywords + red flags + SCAN_MODEL)
POST /api/judge/H1|H3|H5 { paragraphs, scan } ×3 parallel → CriterionResult (JUDGE_MODEL)
computeOverall(results, rubric)            →  Overall       (in the browser)
```

No database. All AI calls go through `completeJson()` in `src/server/services/openrouter.ts`.

## Tests at a glance

| Command | Network | When |
| --- | --- | --- |
| `npm test` | none | every phase, before every commit |
| `npm run typecheck` | none | every phase |
| `npm run test:ai` | OpenRouter, about 2 tiny calls | after 01, and whenever the key or models change |
| `npm run smoke` | OpenRouter, 4 calls | after 03 and 05, with `npm run dev` running |
| `npm run calibrate` | OpenRouter, 24 calls | 08 |
