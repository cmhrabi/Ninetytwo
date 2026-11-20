# Ticket 04A · Landing + Assess on mocks · 10:05 · ~55 min

**Branch:** `feat(frontend)/04a-landing-assess` · **Depends on:** 01F merged and backend 01
merged (`src/shared` types and `/api/rubric` exist)

## Paste this

```text
Read CLAUDE.md ("User flow", "API contract", "Pipeline"), src/shared/types.ts and
rubric/rubric.json, then implement 04A on a new branch feat(frontend)/04a-landing-assess cut
from main. Stop and ask if anything contradicts CLAUDE.md. Import types from @/shared only.
Never write learning copy.

Goal: the Landing page and the Assess page work end to end on mock data, through the same
client API that 06 will switch to the real server.

API CLIENT + MOCKS
- src/lib/api.ts: an `Api` interface with getHealth, getRubric, listSamples, getSample(id),
  extract(file), scan(paragraphs), judge(criterion, { paragraphs, scan }). The real
  implementation calls /api/*, parses ApiError bodies into a typed ApiClientError
  { status, code, message }, and is the only place that calls fetch. Export
  `api = process.env.NEXT_PUBLIC_USE_MOCKS === "1" ? mockApi : realApi`.
- src/mocks/: mockApi with realistic delays (scan ~800 ms, each judge 1.5–4 s, varied so the
  cards fill in one by one); 3 samples; DocumentText for each; CriterionResult fixtures for
  Weak (H1 1, H3 N/A, H5 0 → 38), Partial (H1 2, H3 0 + baseline warning + a red flag,
  H5 1 → 58) and Strong (2, 2, 2 → 100), with verified quotes that really appear in the mock
  paragraphs. Also a `?mockError=ai_failed|rate_limited|too_large` switch to test error states.
  Mock text is fictional and marked "Mock data". Mocks never ship as live scores (hard rule 7).

STATE
- src/state/assessment.tsx ("use client"): AssessmentProvider + useAssessment(). State:
  docType, document (DocumentText | null), sampleId, phase
  ("idle"|"extracting"|"scanning"|"judging"|"done"|"error"), scan, results by criterion,
  per-criterion status ("pending"|"running"|"done"|"error"), errors, rubric.
  Actions: chooseSample(id), uploadFile(file), run(), retryCriterion(id), reset().
  run(): scan once, then judge H1/H3/H5 in parallel with Promise.allSettled, updating each card
  as it resolves; keep a run id so a reset or new run ignores late responses.
  overall = computeOverall(results, rubric) from @/shared, once all are done.
- Mount the provider in src/app/layout.tsx.

LANDING (/), a server component using getContent():
- Hero with a one-line purpose and a "Start assessment" button → /assess.
- "What CTA 92 asks", "Why it matters", "What we learned" from content/landing.md and
  what-we-learned.md (render the Markdown; no hard-coded copy).
- "How it works": 4 steps (Upload → Scan → Judge with verified quotes → Report). This is the
  only tool-describing UI text you write; keep it factual about the software.
- "Built on OHRC, UNDRIP Art. 2, TRC CTA 92" strip linking to the source URLs from rubric.json
  sources.

ASSESS (/assess), a client component:
- Document-type select: "Hiring policy" enabled; Leadership, Consultation, Procurement,
  Education disabled with "Coming next".
- Dropzone (react-dropzone): accepts .pdf/.docx/.txt, ≤ 4 MB (reject in the client with a
  clear message, the server re-checks), shows the file name, and has a keyboard-accessible
  "browse" button.
- 3 SampleCards from listSamples() (title, summary, "Fictional sample" badge).
- ConsentBox: required checkbox "Your file is processed in memory and never stored. Emails and
  phone numbers are removed before AI analysis." Run stays disabled until a doc is chosen AND
  consent is ticked.
- Stepper: Extract → Scan document → Check each criterion by shortTitle (never the H# id) (three sub-cards that flip from
  spinner to score chip as each returns) → Report ready. aria-live="polite" announcements.
- When done, a "View report" button → /report (auto-navigate after 1 s is fine).
- Errors: friendly messages per ErrorCode (too_large, unsupported_type, no_text "Upload a text
  PDF or DOCX (scanned PDFs have no text)", rate_limited "Busy, try again in a moment",
  ai_failed with a per-card Retry). Never show stack traces.

Tests (no network, Vitest node env): src/state/assessment logic extracted into pure reducer
functions with tests (judge results arriving out of order, one judge failing, reset ignoring
late results); api.ts parses an ApiError body into ApiClientError; the mock results'
computeOverall gives 38 / 58 / 100.

DONE WHEN: npm test, typecheck and build pass; with NEXT_PUBLIC_USE_MOCKS=1 npm run dev you can
pick each sample, tick consent, run, watch the cards fill one by one, and reach /report; the
error switch shows each message; keyboard-only works (tab, space, enter). Commit "04A: landing
and assess on mocks", push, open a PR.
```

## Acceptance
- [ ] Landing copy comes only from `content/` and `rubric.json`
- [ ] Assess runs fully on mocks, and the cards fill in independently
- [ ] Run stays disabled until a document is chosen and consent is ticked
- [ ] Every error code has a friendly message
