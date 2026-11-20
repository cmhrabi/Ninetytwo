# Ticket 06 · Wire to the real API · 1:00 · ~40 min

**Branch:** `feat(frontend)/06-wire-api` · **Depends on:** 04B merged and backend 03 merged
(`/api/scan`, `/api/judge` live). Backend 05 (H3/H5) may land during this ticket; until then H3
and H5 can return 501, which the UI must show as a card error, not a crash.

## Paste this

```text
Read CLAUDE.md ("API contract", "Pipeline", hard rule 7) and src/lib/api.ts, then implement 06
on a new branch feat(frontend)/06-wire-api cut from main. Stop and ask if anything contradicts
CLAUDE.md. Don't edit src/app/api, src/server or src/shared.

Goal: the full flow runs on real AI with no mocks: upload or sample → extract → scan once →
3 judges in parallel → report.

- Default to realApi (NEXT_PUBLIC_USE_MOCKS unset). Mocks remain available only with
  NEXT_PUBLIC_USE_MOCKS=1 for UI work; add a visible "MOCK DATA" ribbon when mocks are on.
- Upload: POST /api/extract with FormData; sample: GET /api/samples/:id. Then POST /api/scan
  once, then POST /api/judge/H1|H3|H5 in parallel with { paragraphs, scan }.
- If scan.aiScanned is false, show a small note in the stepper ("Keyword scan only"); still
  judge.
- Fetch timeouts: AbortController at 65 s per judge (server maxDuration is 60); the "New
  assessment" and reset actions abort in-flight requests.
- Errors per card: 429 → "Busy, retrying…" with one automatic retry after 3 s, then a Retry
  button; 502 ai_failed → Retry button; 501 → "Coming soon" grey card; network failure →
  "You're offline" + Retry. One failed card never blocks the others; the overall score waits
  until all applicable criteria have a result, and otherwise shows "Incomplete: retry <H#>".
- Cached results (cached:true) show the "Cached run" badge on the card and the report header.
- Health check on /assess mount: if keyLoaded is false, show a non-blocking notice "Live
  scoring isn't configured; sample policies will use cached runs".
- Never log document text to the console.

Tests (no network): api.ts against a stubbed fetch (success, ApiError parsing, 429 retry once,
abort); the reducer handles 501 and partial failure; overall only computed when complete.

DONE WHEN: npm test, typecheck and build pass; with npm run dev and a real OPENROUTER key:
each sample runs end to end in under ~30 s, the cards fill in one by one, and the report shows
real verified quotes; uploading the .docx and .pdf fixtures works; uploading a .png shows the
unsupported message; turning off Wi-Fi mid-run shows the offline state and Retry recovers.
Commit "06: wire real API", push, open a PR.
```

## Acceptance
- [ ] There are no mocks in the default run path, and mocks are clearly labelled when on
- [ ] Scan runs once and the judges run in parallel; cards fill in independently
- [ ] Every failure mode shows a recoverable state
- [ ] Cached runs are labelled
