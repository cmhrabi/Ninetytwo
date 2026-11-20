# 08 · Calibrate and cached fallback (Tech B with Non-tech C, 1:45)

Branch: `feat(backend)/08-calibrate-cache`

## Goal

Prove that the scores are stable and hit the sample targets, and save a clearly labelled
fallback in case the Wi-Fi or OpenRouter fails during judging.

## Steps

1. **`samples/expected.json`**:
   `{ "weak": { "H1": 1, "H3": null, "H5": 0, "percent": 38, "band": "Emerging" }, "partial": {...}, "strong": {...} }`
2. **`src/scripts/calibrate.ts`** (`npm run calibrate`, live):
   - For each sample, run the real pipeline twice. It runs in-process, calling the services
     directly with no dev server.
   - Print one table: sample × run × H1/H3/H5 × percent × band, against expected. Mark each
     mismatch, and mark a score that differs between run 1 and run 2 as **unstable**.
   - Print the total OpenRouter cost from `usage`.
   - Exit 1 on any mismatch.
3. **Fix loop with Non-tech C**:
   - A mismatch caused by the **sample text**: C edits the sample.
   - A mismatch caused by **check wording or phrases**: C and B edit `rubric.json`.
   - Never special-case code.
   - Re-run until two clean runs in a row pass.
4. **`core/hash.ts`**: `docHash(paragraphs)` = sha256 of the normalized paragraph texts (Node
   `crypto`).
5. **`services/cache.ts`**:
   - `writeCache(sample, criterion, result)` is used only by `calibrate --save`, after a clean
     run. It writes `cache/<sample>-<criterion>.json` with the result and the sample's
     `docHash`.
   - `readCache(paragraphs, criterion)`: if the doc hash matches a cached sample, return its
     result with `cached: true`; otherwise `null`.
6. **Judge fallback**: in `judgeCriterion`, when `completeJson` throws `ai_failed` or
   `rate_limited`, try `readCache`.
   - On a hit, return the cached result: `cached: true`, HTTP 200. Tech A shows a "Cached run"
     label.
   - Otherwise rethrow.
   - Never serve cache for uploaded documents. A hash that matches no sample → no cache.
7. `next.config.ts` already includes `./cache/**/*` for the API routes. Leave it.

## Tests (no network)

- `hash.test.ts`: the hash is stable across whitespace and curly-quote differences, and changes
  when the text changes.
- `cache.test.ts`, using a temporary `CACHE_DIR`: a sample hash returns `cached: true`; an
  unknown hash returns `null`.
- `judge.test.ts`:
  - `completeJson` rejects with `ai_failed` on the weak sample → the cached result has
    `cached: true`
  - the same failure on a non-sample document → 502
  - a success never reads the cache

## Done when

- [ ] `npm test` and `npm run typecheck` pass
- [ ] `npm run calibrate` gives two clean runs in a row (no mismatches, nothing unstable). Paste
      the table into the PR.
- [ ] `npm run calibrate -- --save` writes 9 files in `cache/`. Commit them.
- [ ] Clear `OPENROUTER_API_KEY` and restart dev. The weak sample still produces a full report
      with every card `cached: true`. An uploaded file gets a clear error. Then restore the key.
