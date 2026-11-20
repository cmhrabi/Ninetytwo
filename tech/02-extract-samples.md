# 02 · Extract and samples (Tech B, 10:05)

Branch: `feat(backend)/02-extract-samples`

## Goal

Turn an uploaded PDF, DOCX or TXT (or a sample policy) into numbered paragraphs with emails and
phone numbers removed. All of it happens in memory.

## Read first

- `CLAUDE.md` hard rules 4 and 6, "Hosting on Vercel" (4 MB limit), and "API contract"
- `node_modules/unpdf/README.md` (`extractText`, `getDocumentProxy`) and `node_modules/mammoth/README.md` (`extractRawText({ buffer })`)

## Files

```
src/server/core/paragraphs.ts  paragraphs.test.ts
src/server/core/pii.ts  pii.test.ts
src/server/services/extractText.ts  extractText.test.ts
src/server/services/samples.ts
src/app/api/extract/route.ts  route.test.ts
src/app/api/samples/route.ts  route.test.ts
src/app/api/samples/[id]/route.ts  route.test.ts
samples/weak.txt  partial.txt  strong.txt  index.json
src/test/fixtures/policy.docx  policy.pdf   (tiny, generated once by a script or by hand)
```

## Steps

1. **`core/paragraphs.ts`**: `toParagraphs(raw: string): Paragraph[]`.
   - Normalize `\r\n` and non-breaking spaces.
   - Split on blank lines. Join hard-wrapped lines inside a paragraph.
   - Keep list items (`-`, `•`, `1.`) as separate paragraphs.
   - Drop empty items and items that are only a page number.
   - Ids are `p1…pn` in order.
2. **`core/pii.ts`**: `stripPii(text)` replaces emails with `[email]` and North American phone
   numbers (`(416) 555-0199`, `416-555-0199`, `+1 416 555 0199`, `416.555.0199`) with `[phone]`.
   It must leave years, dates, section numbers ("s. 14") and money amounts alone.
3. **`services/extractText.ts`**: `extractDocument(file: File): Promise<DocumentText>`.
   - Over 4 MB → 413 `too_large`.
   - Detect the type from the extension and MIME type: `.pdf` → unpdf, `.docx` → mammoth
     `extractRawText({ buffer })`, `.txt` → UTF-8. Anything else → 415 `unsupported_type`.
   - Run `stripPii` on every paragraph.
   - No paragraphs, or under 50 characters in total → 422 `no_text`, with the message "Upload
     a text PDF or DOCX (scanned PDFs have no text)".
   - Never write to disk. Keep `Buffer`/`ArrayBuffer` in memory only.
4. **`services/samples.ts`**: reads `samples/index.json` (`Sample[]`: id, title, summary) and
   `samples/<id>.txt` through `toParagraphs` + `stripPii`. An unknown id → 404 `not_found`.
5. **Routes**:
   - `POST /api/extract` reads `await request.formData()`, gets `file`, and calls
     `extractDocument`. A missing file → 400 `bad_request`.
   - `GET /api/samples` and `GET /api/samples/[id]`: `params` is a Promise.
   - All routes use `try/catch` → `toErrorResponse`.
6. **Samples**: write short placeholder policies (about 6–10 paragraphs each) for a fictional
   company. Start each file with a line `TODO(team): replace with the team's sample text`.
   Non-tech C writes the real ones. Never use real Kablamo text. Shape them toward the targets:
   - **weak**: "equal opportunity employer" only, nothing on advancement
   - **partial**: names Indigenous Peoples; "Indigenous candidates preferred" with no legal
     basis; informal mentorship and some promotion criteria
   - **strong**: Code s.14 special program with purpose, voluntary self-ID and community
     confirmation; formal sponsorship; objective promotion criteria; documented decisions; a
     resourced Indigenous employee network

## Tests (no network)

- `paragraphs.test.ts`: blank-line splitting, hard-wrap joining, bullets, page numbers dropped,
  CRLF, ids sequential.
- `pii.test.ts`: every phone format and emails are replaced; a year, "s. 14", "$45,000" and a
  date are left intact.
- `extractText.test.ts`:
  - `.txt` works
  - the real `.docx` and `.pdf` fixtures produce the expected first paragraph
  - `.png` → 415
  - 4 MB + 1 byte → 413
  - whitespace-only → 422
  - a text with an email comes back with `[email]`
- Route tests: call `POST(new Request(url, { method: "POST", body: formData }))` and assert the
  status plus `ApiError` body for each error case. The samples list has 3 items; an unknown
  sample → 404.

## Done when

- [ ] `npm test` and `npm run typecheck` pass
- [ ] `curl -s -F file=@samples/weak.txt localhost:3000/api/extract | head -c 300` returns paragraphs
- [ ] `curl -s -o /dev/null -w "%{http_code}" -F file=@package.json localhost:3000/api/extract` → `415`
- [ ] `curl -s localhost:3000/api/samples` lists 3 samples; `/api/samples/nope` → 404 `ApiError`
- [ ] Nothing new appears on disk after an upload (`git status` is clean apart from your source changes)
