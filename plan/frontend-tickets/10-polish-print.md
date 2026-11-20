# Ticket 10 · Polish, Print / Save PDF, cold-test fixes · 2:30 · ~30 min

**Branch:** `feat(frontend)/10-polish` · **Depends on:** 07 merged; Non-tech C's cold-test bug
list. Feature freeze is 3:00, so only fixes after that.

## Paste this

```text
Read CLAUDE.md and the cold-test bug list I paste below, then do 10 on a new branch
feat(frontend)/10-polish cut from main. Stop and ask if anything contradicts CLAUDE.md. Fix
bugs first, then polish. Don't add features.

Bug list from the cold test:
<paste Non-tech C's list here>

1. BUGS: fix every item on the list, smallest change first. Re-test each one.
2. PRINT / SAVE PDF: the Report's "Print / Save PDF" button calls window.print(). Add an
   @media print stylesheet: hide header nav, buttons, the viewer toggle and coming-next cards;
   show the document name, date, score, band, warnings, all three cards with verified quotes,
   gaps, sources (print link URLs after their text), "Not legal advice", and "Cached run" if
   applicable; avoid breaking a card across pages (break-inside: avoid); A4 and Letter both fit.
3. MOTION (motion/react; skip if behind): the gauge animates to its value; cards fade and slide
   in as they resolve on Assess; the evidence highlight pulses. Respect prefers-reduced-motion
   (no animation).
4. ACCESSIBILITY PASS: all interactive elements reachable by keyboard with a visible focus
   ring; images and icons labelled; colour isn't the only signal (status chips have text);
   headings in order; contrast AA; the dropzone and consent are labelled.
5. DEMO READINESS: page <title>s per route; favicon; no console errors or warnings in a full
   run; npm run demo serves everything on :8787.

Tests: existing tests still pass; add tests for any pure helper you change.

DONE WHEN: npm test, typecheck and build pass; the bug list is all fixed or noted as "won't
fix" with a reason; printing a report to PDF looks clean on 1–2 pages; a full run with
keyboard only works; npm run demo runs the whole flow on :8787. Commit "10: polish and print",
push, open a PR before 3:00.
```

## Acceptance
- [ ] The cold-test bug list is closed
- [ ] The printed report is clean and complete
- [ ] Reduced motion is respected; the keyboard-only flow works
- [ ] `npm run demo` is booth-ready
