# Ticket 08 · Calibrate + cached fallback · 1:45 · ~45 min (with Non-tech C)

**Branch:** `feat(backend)/08-calibrate-cache` · **Depends on:** 05 merged, and the real sample
texts from Non-tech C in `samples/*.txt`

## Paste this

```text
Read CLAUDE.md (hard rule 7, "Hosting on Vercel"), then implement phase 08 on a new branch
feat(backend)/08-calibrate-cache cut from main. If tech/08-calibrate-cache.md exists, follow it.
Stop and ask if anything contradicts CLAUDE.md.

Goal: prove the scores are stable on the 3 samples, and serve a clearly labelled cached result
when the AI is unreachable, for the 3 samples only.

- samples/expected.json:
  { "weak": { "H1": 1, "H3": null, "H5": 0, "overall": 38 },
    "partial": { "H1": 2, "H3": 0, "H5": 1, "overall": 58 },
    "strong": { "H1": 2, "H3": 2, "H5": 2, "overall": 100 } }
- src/server/core/hash.ts  hashParagraphs(paragraphs): sha256 of the normalized paragraph texts
  joined with \n (node:crypto). The same text gives the same hash however it arrived.
- src/scripts/calibrate.ts (npm run calibrate): calls the service functions directly (no HTTP),
  sample × 2 runs: scan → judge H1/H3/H5 → computeOverall. Print a table
  (sample, run, H1, H3, H5, overall, expected, ✓/✗, seconds, OpenRouter cost from usage) and list
  any check whose met value differs between runs. With --write, save each run-1 result that
  matches expected to cache/<sample>-<criterion>.json as
  { hash, result } with result.cached = true. Exit 1 if any sample misses its target.
- src/server/services/cache.ts  findCached(criterion, paragraphs): if the hash matches one of
  the cached samples, return its result with cached:true; else null.
- judge.ts: on HttpError ai_failed or rate_limited ONLY, try findCached; on a hit return
  200 with cached:true (the UI labels it "Cached run"); on a miss rethrow. Never use the cache
  when the AI succeeds. Scan: aiScanned:false is already its fallback.
- Confirm next.config.ts outputFileTracingIncludes still covers ./cache/**/* and ./samples/**/*.

TESTS (no network)
- hash: stable, whitespace-insensitive, different text gives a different hash.
- cache: sample hash → hit with cached:true; edited text → null.
- judge: AI throws ai_failed + sample text → cached result; AI throws + non-sample text → 502;
  AI succeeds → cached:false even for a sample.

Calibration loop (with Non-tech C): run npm run calibrate. For each ✗, decide whether the
sample text or the rubric/prompt is wrong. Non-tech C edits sample text; you edit phrases,
check labels or prompt wording, never TODO(team) copy. Re-run until all ✓ twice in a row, then
npm run calibrate -- --write and commit cache/.

DONE WHEN: npm test and typecheck pass; calibrate shows 6/6 ✓; cache/ holds 9 files; with
OPENROUTER_API_KEY blanked in .env.local and npm run dev restarted, judging the weak sample
returns cached:true, and an uploaded non-sample file returns 502 ai_failed. Restore the key.
Commit "08: calibrate and cache", push, open a PR.
```

## Acceptance
- [ ] All 3 samples hit their targets on 2 runs in a row
- [ ] The cached fallback fires only on AI failure and only for sample text, and is labelled `cached:true`
- [ ] Calibration table saved for the README (paste it into the PR description)
