# Frontend tickets: Tech A

To run a stage, open a **fresh Claude Code session** in the repo and paste the block under
**Paste this**. Run the tickets in order; each one needs the one before it merged into `main`
(except where a ticket says otherwise).

Before every ticket:
```bash
git switch main && git pull && nvm use && npm install
```

Shared rules for every ticket (they're also in `CLAUDE.md`):
- **Ownership.** Tech A owns pages (`src/app/**/page.tsx`, `layout.tsx`), `src/components/`,
  `src/state/`, `src/lib/`, `src/mocks/`. Don't edit `src/app/api/`, `src/server/` or
  `src/shared/`. If you need a contract change, ask Tech B.
- **Never write learning copy.** All text about CTA 92, Indigenous Peoples, why things matter, and
  sources comes from `content/*.md` or `rubric.json`. Missing copy shows the `TODO(team): …`
  placeholder as is.
- **No AI advice in the UI.** Gaps show the team-written "What Addressed looks like", "Why it
  matters" and "Where to learn" fields from the rubric, never generated suggestions.
- **Import types from `@/shared`**, never redeclare them. `src/lib/api.ts` is the only place
  that calls `fetch`.
- **`src/server/` is never imported by a `"use client"` file.**
- Add shadcn components with `npx shadcn add <name>` (style `base-nova`); don't hand-write `ui/`.
- Next 16 is newer than your training data: read `node_modules/next/dist/docs/` before writing
  Next-specific code.

## Tickets

| # | File | Start | Depends on | Delivers |
| --- | --- | --- | --- | --- |
| 01F | [01-frontend-shell.md](01-frontend-shell.md) | 9:45 | nothing (parallel with backend 01) | Theme, fonts, layout, Header/Footer, 4 page placeholders, Markdown, `content.ts` |
| 04A | [04a-landing-assess.md](04a-landing-assess.md) | 10:05 | 01F + backend 01 (`src/shared`) | Landing page, Assess page UI, assessment state, mock API |
| 04B | [04b-report-mocks.md](04b-report-mocks.md) | 11:00 | 04A | Report page on mock Weak/Partial/Strong results |
| 06 | [06-wire-api.md](06-wire-api.md) | 1:00 | 04B + backend 03 | Real API: extract/sample → scan → 3 judges in parallel; loading and errors |
| 07 | [07-evidence-methodology.md](07-evidence-methodology.md) | 1:40 | 06 | Evidence viewer, Methodology & Sources page |
| 10 | [10-polish-print.md](10-polish-print.md) | 2:30 | 07 | Motion, Print / Save PDF, accessibility, cold-test fixes |

Feature freeze 3:00 pm.

## If you're behind schedule

Cut in this order and note it in the PR:
1. motion
2. the evidence highlighter (keep the quotes; drop the split pane)
3. the document-type select (fix it to "Hiring policy")

Never cut sample cards, verified quotes, the baseline warning, "Not legal advice", or the
Methodology & Sources page.
