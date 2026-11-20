# Ticket 02 · Extract and samples · 10:05 · ~40 min

**Branch:** `feat(backend)/02-extract-samples` · **Depends on:** 01 merged

## Paste this

```text
Read CLAUDE.md, then tech/02-extract-samples.md, and implement phase 02 on a new branch
feat(backend)/02-extract-samples cut from main. Stop and ask if anything contradicts CLAUDE.md.

Goal: turn an uploaded PDF/DOCX/TXT or a sample policy into numbered paragraphs (p1..pn) with
emails and phone numbers stripped, entirely in memory.

Build:
- src/server/core/paragraphs.ts  toParagraphs(raw): Paragraph[]
  normalize CRLF and NBSP, split on blank lines, join hard-wrapped lines, keep list items
  (-, •, 1.) as separate paragraphs, drop empty or page-number-only items, ids p1..pn in order.
- src/server/core/pii.ts  stripPii(text): emails → [email]; phones like (416) 555-0199,
  416-555-0199, +1 416 555 0199, 416.555.0199 → [phone]. Leave years, dates, "s. 14", $45,000 alone.
- src/server/services/extractText.ts  extractDocument(file: File): Promise<DocumentText>
  > 4 MB → 413 too_large; .pdf via unpdf, .docx via mammoth extractRawText({ buffer }),
  .txt as UTF-8, else 415 unsupported_type; stripPii every paragraph;
  < 50 chars total → 422 no_text "Upload a text PDF or DOCX (scanned PDFs have no text)".
  Never write to disk (no /tmp).
- src/server/services/samples.ts  listSamples() from samples/index.json, getSample(id) from
  samples/<id>.txt via toParagraphs + stripPii; unknown id → 404 not_found.
- Routes (no `runtime` export; every handler try/catch → toErrorResponse):
  POST /api/extract (request.formData(), missing file → 400 bad_request),
  GET /api/samples, GET /api/samples/[id] (params is a Promise).
- samples/weak.txt, partial.txt, strong.txt (6–10 paragraphs each, fictional company,
  first line "TODO(team): replace with the team's sample text") and samples/index.json.
  weak: "equal opportunity employer" only, nothing on advancement.
  partial: names Indigenous Peoples; "Indigenous candidates preferred" with no legal basis;
  informal mentorship; some promotion criteria.
  strong: Code s.14 special program with purpose, voluntary self-ID, community confirmation;
  formal sponsorship; objective promotion criteria; documented decisions; resourced
  Indigenous employee network.
- src/test/fixtures/policy.pdf and policy.docx (tiny).

Tests (no network): paragraphs, pii (all phone formats; years, s. 14, money and dates untouched),
extractText (txt, docx, pdf, png → 415, 4 MB + 1 → 413, blank → 422, email stripped),
route tests that call the handlers directly with a Request and assert the status + ApiError body.

Done when: npm test and npm run typecheck pass; with npm run dev running,
curl -F file=@samples/weak.txt localhost:3000/api/extract returns paragraphs,
curl -F file=@package.json returns 415, /api/samples lists 3, /api/samples/nope is a 404 ApiError,
and git status shows no files written by an upload. Then commit "02: extract and samples",
push, and open a PR to main.
```

## Acceptance
- [ ] PDF, DOCX and TXT all return `DocumentText`
- [ ] 413 / 415 / 422 / 400 return `ApiError` bodies
- [ ] Emails and phones are gone before anything reaches the AI
- [ ] 3 samples are served; placeholders are marked `TODO(team)`
