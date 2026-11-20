# Ticket 09 · README tech + clean-install check · 2:30 · ~30 min

**Branch:** `feat(backend)/09-readme-tech` · **Depends on:** 08 merged; Non-tech D owns the
other README sections

## Paste this

```text
Read CLAUDE.md and README.md, then do phase 09 on a new branch feat(backend)/09-readme-tech cut
from main. If tech/09-readme-tech.md exists, follow it. Don't write or edit content about
Indigenous Peoples, the learning copy, or the OCAP®/business/sustainability sections. Those are
team-written; leave TODO(team) markers where they are missing.

Goal: judges (including AI reviewers reading GitHub) can see how the tech works and that it's
real, and a fresh clone builds and runs.

README sections to write (Tech B's part):
1. "Creative use of technology" (judging criterion 4): AI as evidence finder, code as scorer;
   the two-stage pipeline (scan → judge) with a small diagram; verified quotes; rubric as config
   (show a trimmed rubric.json snippet); prompts treat the document as data; no AI-written advice.
2. "Technical functionality" (criterion 5): live upload → real AI → report; what's tested (the
   3 test layers and how to run each); the calibration table from phase 08 (paste the real
   numbers); the cached fallback and how it's labelled; error handling (413/415/422/429/502).
3. "Run it": Node 24, npm ci, .env.local with OPENROUTER_API_KEY / JUDGE_MODEL / SCAN_MODEL,
   npm run dev, npm run demo, npm test, npm run smoke; Vercel deploy steps and env vars.
4. "Privacy by design" (technical facts only; Non-tech D writes the OCAP® framing): files in
   memory only, never on disk; emails and phones stripped before AI; no database, no accounts;
   what is sent to OpenRouter (paragraph text only) and to which models.
5. "Architecture": the folder map for src/server and src/app/api, and the API table.

Clean-install check:
- git clone the repo into a temp folder (not inside this repo), cp .env.local into it, then
  npm ci, npm run typecheck, npm test, npm run build, npm run demo, and curl /api/health on
  :8787. Fix anything that fails (lockfile, missing traced files, env names) in this branch.
- grep the repo for secrets: no OPENROUTER key or "sk-or-" in tracked files; .env.local is
  ignored.

DONE WHEN: all of the above pass from the fresh clone, the README renders on GitHub with no
broken links, and every claim in the tech sections matches the code. Commit "09: README tech
sections", push, open a PR, and post the repo link for Non-tech D.
```

## Acceptance
- [ ] README maps the tech to criteria 4 and 5 with real numbers
- [ ] A fresh clone runs `npm ci && npm run build && npm run demo` cleanly
- [ ] No secrets in git
