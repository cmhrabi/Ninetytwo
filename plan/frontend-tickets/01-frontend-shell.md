# Ticket 01F · Frontend shell · 9:45 · ~20 min

**Branch:** `feat(frontend)/01-shell` · **Depends on:** nothing; runs in parallel with backend
01. Don't touch `src/shared/` (Tech B is writing it).

## Paste this

```text
Read CLAUDE.md (hard rules 1, 2, 8, "Stack", "User flow", "Working agreements") and
node_modules/next/dist/docs/ for layouts, next/font, next/link and Cache Components, then
implement the frontend shell on a new branch feat(frontend)/01-shell cut from main. Stop and
ask if anything contradicts CLAUDE.md. Never write learning copy: create placeholders only.

Goal: every page and shared piece exists, so later tickets only fill them in.

Build:
- Theme in src/app/globals.css (Tailwind 4, no tailwind.config.js): colour tokens as CSS
  variables (background, foreground, muted, primary, accent, and status colours for
  Addressed / Partly addressed / Not found / Not applicable / warning), light and dark.
  If the team has prototype colours and fonts, port them here (ask me for them; otherwise
  keep neutral defaults and leave a TODO(team) comment).
- Fonts via next/font (already Geist). Body text ≥ 16px; WCAG AA contrast for every token pair.
- src/components/layout/Header.tsx: product name, nav (Home /, Assess /assess,
  Methodology /methodology) with next/link and an active state; a mobile menu that works at 375px.
- src/components/layout/Footer.tsx: "Not legal advice", a link to Methodology & Sources, and
  the acknowledgement rendered from content/acknowledgement.md.
- src/app/layout.tsx: Header + main + Footer, skip-to-content link, metadata title/description.
  (The AssessmentProvider is added in 04A.)
- Pages as placeholders with a heading each: src/app/page.tsx, assess/page.tsx,
  report/page.tsx, methodology/page.tsx, plus src/app/not-found.tsx with a link home.
- content/landing.md, what-we-learned.md, data-note.md, sources.md, acknowledgement.md:
  create each file with only a heading and "TODO(team): ..." (if a file already exists, leave it
  alone).
- src/lib/content.ts  getContent(name): reads content/<name>.md with fs in server components
  only (import "server-only" if installed; otherwise a comment). Typed union of the 5 names.
- src/components/Markdown.tsx: react-markdown wrapper with styled headings, lists and links
  (external links get target=_blank rel=noopener noreferrer). Renders a TODO(team) line in a
  visible dashed "Copy coming from the team" box so gaps are obvious in demos.
- npx shadcn add card badge separator alert tooltip (more come later).

Tests (no network): src/lib/content.test.ts reads each content file; a tiny Markdown test is
optional (Vitest runs in node, so test logic, not rendering).

DONE WHEN: npm test, npm run typecheck and npm run build pass; npm run dev shows the 4 pages
with header, footer and working nav at desktop width and at 375px; no learning copy was
written. Commit "01F: frontend shell", push, open a PR to main.
```

## Acceptance
- [ ] 4 pages + 404 render inside a shared layout
- [ ] Content placeholders exist, and `TODO(team)` lines are visibly marked
- [ ] The build passes; mobile nav works
