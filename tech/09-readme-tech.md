# 09 · README (tech) and clean install (Tech B, 2:30)

Branch: `feat(backend)/09-readme-tech`

## Goal

Claude and Gemini judge 40% of the score by reading the repo. Make the technical sections of
`README.md` easy to check, and prove a fresh clone works.

## Steps

1. Add these sections to `README.md`. Non-tech D owns the rest.
   - **Creative Use of Technology (criterion 4)**:
     - AI as evidence finder, code as scorer
     - the two-stage AI (fast scan, then a focused judge per criterion)
     - verified quotes, with the normalization rules
     - the rubric as config: show adding a criterion to `rubric.json` with no code change
   - **Technical Functionality (criterion 5)**:
     - the architecture diagram from `tech/README.md`
     - the API table
     - what's live vs the labelled cached fallback
     - the test layers and how to run them
     - the latest `calibrate` table
   - **How the AI is used safely**:
     - OpenRouter over `fetch`, JSON-schema output validated with zod
     - documents treated as data
     - emails and phones stripped before any AI call
     - nothing stored, no database
     - the prompt-injection test
   - **Run it**: `nvm use`, `npm ci`, `cp .env.example .env.local`, paste the key,
     `npm run dev`. Also the demo mode (`npm run demo`) and Vercel env vars.
2. Check that every claim in those sections matches the code. Link to the files, for example
   `src/server/core/quoteCheck.ts`.

## Done when

- [ ] In a fresh clone (`git clone … /tmp/ninetytwo-check && cd /tmp/ninetytwo-check`), these
      all pass: `nvm use && npm ci && npm test && npm run typecheck && npm run build`
- [ ] With a key in `.env.local` there: `npm run demo`, then `BASE_URL=http://localhost:8787 npm run smoke` passes
- [ ] `git grep -n "sk-or-"` finds nothing (no key committed)
- [ ] README renders on GitHub with a working table of contents
