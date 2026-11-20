# 01 · Foundation (Tech B, 9:45, unblocks Tech A)

Branch: `feat(backend)/01-foundation`

## Goal

Write the frozen contract (`src/shared/`), the OpenRouter client, the rubric file and loader, and
the first two routes, so Tech A can build on real types and you can prove the key works.

## Read first

- `CLAUDE.md`, especially "AI calls (OpenRouter)", "API contract", "Criteria and scoring" and "Testing"
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` (section "With Cache Components")
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`

## Files

```
src/shared/index.ts  types.ts  rubric.ts  score.ts  score.test.ts  rubric.test.ts
src/server/config.ts  paths.ts  http/errors.ts  http/errors.test.ts
src/server/services/openrouter.ts  openrouter.test.ts  rubricStore.ts  rubricStore.test.ts
src/app/api/health/route.ts  route.test.ts
src/app/api/rubric/route.ts  route.test.ts
src/scripts/test-ai.ts
rubric/rubric.json
package.json   (add one script: "smoke": "tsx src/scripts/smoke.ts"; the file comes in 03)
```

## Steps

1. **`src/shared/types.ts`**: copy the API contract from CLAUDE.md exactly, including the scan
   types. `index.ts` re-exports `types`, `rubric` and `score`. The `@/shared` alias already works
   (`tsconfig.json`, `vitest.config.ts`).
2. **`src/shared/rubric.ts`**: a zod `RubricSchema` and inferred types (`Rubric`, `Criterion`,
   `Check`, `RedFlagDef`, `Scoring`, `Band`, `Link`). The shape is:
   ```ts
   {
     version: string,
     bands: { min: number; max: number; label: string }[],          // 0–39 Emerging … 80–100 Leading
     criteria: {
       id: string; title: string;
       tier: "baseline" | "conditional" | "leading";
       weight: number;                                               // H1 3, H3 2, H5 1
       appliesWhen: "always" | string;                               // H3: the condition text
       warnOnZero: boolean;                                          // H1, H3 true
       checks: { id: string; label: string; graded: boolean;
                 levels?: { "0": string; "1": string; "2": string } }[];
       scoring:
         | { type: "rules"; rules: { score: 0 | 1 | 2; allOf?: string[]; anyOf?: string[] }[] }
         | { type: "average"; capAt1Unless?: string };
       levels: { "0": string; "1": string; "2": string };           // what each score means
       phrases: string[];                                            // keyword scan
       redFlags: { id: string; label: string; phrases: string[] }[]; // verified → score 0 + warning
       addressedLooksLike: string; whyItMatters: string;             // TODO(team)
       sources: { title: string; url: string }[];
       resources: { title: string; url: string }[];
     }[],
     comingNext: { id: string; title: string }[]
   }
   ```
   Add `.superRefine` checks: every id in `allOf`/`anyOf`/`capAt1Unless` exists in that
   criterion's `checks`; `average` criteria have only graded checks; the bands cover 0–100 with
   no gaps.
3. **`rubric/rubric.json`**: H1, H3 and H5 with the structure filled in from `CLAUDE.md` and
   `plan.md`.
   - H1 checks: `ban` (clear ban on discrimination in hiring or employment), `eoStatement`
     (general equal-opportunity statement), `grounds` (names Indigenous Peoples, or at least two
     of ancestry, place of origin, ethnic origin, colour, creed). Rules: 2 = allOf
     [ban, grounds]; 1 = anyOf [ban, eoStatement].
   - H3 (conditional) checks: `legalBasis` (cites Code s.14 special program / OHRC guidance),
     `purpose` (states the disadvantage it addresses), `voluntarySelfId`,
     `communityConfirmation` (identity is not confirmed by the employer alone with one
     document). Rules: 2 = allOf all four; 1 = anyOf [legalBasis, purpose]. Red flags:
     `identityOnGeneralForms` and `employerAloneConfirms`, each with a few phrases.
   - H5: graded checks `a` mentorship, `b` promotion criteria, `c` transparency, `d`
     Indigenous-specific support, using the level text from the H5 table in `plan.md`. Scoring
     `{ "type": "average", "capAt1Unless": "d" }`.
   - Sources and resources: copy the URLs from `plan.md`.
   - `addressedLooksLike` and `whyItMatters`: put `"TODO(team): ..."`. Never write this copy.
   - `comingNext`: L1–L3, C1–C4, H2, H4, H6, H7, P1–P3, E1–E4, with short titles.
4. **`src/shared/score.ts`**:
   - `bandFor(percent, rubric)`
   - `computeOverall(results, rubric): Overall`, using percent =
     round(100 × Σ(score × weight) ÷ Σ(2 × weight)) over applicable criteria with a non-null
     score. `warnings` holds one message per result with `warning === "baseline"`.
   - Use `Math.round` (half up) for the percent.
5. **`src/server/config.ts`**: `getConfig()` reads `process.env` at call time, not at import:
   `{ apiKey?: string; judgeModel; scanModel }` with defaults from CLAUDE.md.
   **`paths.ts`**: `ROOT = process.cwd()`, plus `RUBRIC_PATH`, `SAMPLES_DIR` and `CACHE_DIR`.
6. **`src/server/http/errors.ts`**:
   - `class HttpError(status, code: ErrorCode, message)` and `notFound(what)`
   - `toErrorResponse(err)` returns `Response.json({ error: { code, message } }, { status })`
   - Unknown errors map to 500 `internal`, logged with `console.error` and never echoed.
7. **`src/server/services/openrouter.ts`**: implement `completeJson()` exactly as CLAUDE.md
   "AI calls (OpenRouter)" describes. Also:
   - Take `fetch` from `globalThis` at call time, so tests can stub it.
   - Without a key, throw `HttpError(502, "ai_failed", "OPENROUTER_API_KEY is not set")`.
   - Use `z.toJSONSchema(schema)`. Assert in a test that object schemas come out with
     `additionalProperties: false`; structured outputs need it. If they don't, post-process
     the schema to add it.
8. **`src/server/services/rubricStore.ts`**: `loadRubric()` reads `RUBRIC_PATH` with
   `fs/promises`, validates with `RubricSchema`, and caches in a module variable.
   `getCriterion(id)` throws `notFound` for unknown ids.
9. **Routes** (no `runtime` export, which `cacheComponents` forbids):
   - `GET /api/health`: `await connection()` first (from `next/server`), **outside** the
     `try/catch`, so it isn't prerendered. Catching it breaks `npm run build` with
     `HANGING_PROMISE_REJECTION`. Then return `Health` with `keyLoaded = Boolean(apiKey)`. Never
     return the key.
   - `GET /api/rubric`: returns `loadRubric()`.
   - Wrap both in `try/catch` and return `toErrorResponse`.
10. **`src/scripts/test-ai.ts`**: one tiny `completeJson` call each to `judgeModel` and
    `scanModel` with the schema `{ ok: boolean, word: string }`. Print the parsed data, the
    served model and `usage`. Exit 1 on failure with a helpful message (key missing, 401, 402).
    Run with `npm run test:ai`.

## Tests (must pass, no network)

- `score.test.ts`:
  - H1=1, H3=N/A, H5=1 → 50 Developing
  - Weak (1, N/A, 0) → 38 Emerging
  - Partial (2, 0, 1) → 58 Developing
  - Strong (2, 2, 2) → 100 Leading
  - every band edge (39/40, 59/60, 79/80)
  - all N/A → 0, not NaN
  - baseline warnings collected
- `rubric.test.ts`:
  - the real `rubric/rubric.json` parses
  - a bad check id in `allOf` fails
  - a gap in the bands fails
- `errors.test.ts`: `HttpError` maps to its status and body; an unknown error → 500 `internal`
  without leaking its message.
- `openrouter.test.ts`, with `vi.stubGlobal("fetch", vi.fn())`:
  - Sends the right URL, auth header, `response_format.json_schema.strict === true` and
    `provider.require_parameters`, and no `temperature`.
  - Parses valid JSON content.
  - Retries once on invalid JSON, then succeeds.
  - Two invalid replies → `ai_failed`.
  - 401, 402, 429 and 500 map to the right codes.
  - An aborted (timeout) call → `ai_failed`.
  - A missing key → `ai_failed`, and `fetch` is never called.
  - The JSON schema has `additionalProperties: false`.
- `rubricStore.test.ts`: loads the rubric; an unknown criterion → 404 `HttpError`.
- `health/route.test.ts`, `rubric/route.test.ts`:
  - Call `GET()` directly and assert status and body shape.
  - The health body never contains the key value.
  - Mock `next/server`'s `connection` if it throws outside a request.

## Done when

- [ ] `npm test` passes and `npm run typecheck` passes
- [ ] `npm run build` passes with no errors, and shows `/api/health` as `ƒ` (dynamic)
- [ ] `npm run dev`, then `curl -s localhost:3000/api/health` returns
      `{"ok":true,"judgeModel":"anthropic/claude-sonnet-5.5","scanModel":"anthropic/claude-haiku-5.5","keyLoaded":true}`
- [ ] `curl -s localhost:3000/api/rubric | head -c 300` shows the rubric with H1, H3 and H5
- [ ] `npm run test:ai` prints a parsed reply from both models (needs the key in `.env.local`)
- [ ] `git status` shows no `.env.local`. Commit `01: foundation`, push, and tell Tech A the
      contract is in.
