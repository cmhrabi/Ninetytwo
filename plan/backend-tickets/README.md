# Backend tickets: phases 02, 03, 05, 08, 09 (Tech B)

To run a stage, open a **fresh Claude Code session** in the repo and paste the block under
**Paste this**. Each ticket is self-contained. Run them in order; each one needs the one before it
merged into `main`.

Before every ticket:
```bash
git switch main && git pull && nvm use && npm install
```

Definitions used below:
- **verified quote**: passes `quoteCheck` (verbatim after normalizing case, whitespace and
  curly quotes).
- **no network**: `npm test` never calls OpenRouter. Stub `globalThis.fetch` or `completeJson`.

- [Ticket 02](02-extract-samples.md)
- [Ticket 03](03-scan-and-judge-h1.md)
- [Ticket 05](05-h3-h5-scoring.md)
- [Ticket 08](08-calibrate-cache.md)
- [Ticket 09](09-readme-tech.md)

## If you're behind schedule

Cut in this order and note it in the PR:
1. smoke timings
2. the `--write` automation (copy the cache files by hand)
3. the H5 table edge cases beyond the five listed

Never cut verified quotes, the injection test, the sample targets or the labelled fallback.
