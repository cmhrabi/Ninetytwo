# Team copy to write

The app shows team-written words in several places. Those places are still empty: on the site
each one shows as a grey dashed box starting with "TODO(team)". The AI is not allowed to write
any of this, so it has to come from the team.

**How to fill one in:** send the text to a dev (Slack is fine), or edit the file yourself.
Replace the whole `TODO(team): …` line. Keep the `##` / `###` headings exactly as they are,
because the site finds each slot by its heading. Put any source in as a link:
`[Source name](https://…)`.

---

## 🔴 High priority

### 1. What we learned (landing page, near the bottom)
File: `content/what-we-learned.md`. Three short sections, a paragraph or a few bullets each, citing sources where you make a claim.
- [ ] **Day 1**: what we learned on Day 1
- [ ] **Research**: what we learned from research
- [ ] **Day 2**: what we learned while building

### 2. Landing page hero subline (under the big headline)
File: `content/landing.md` → `## Hero subline`
- [ ] 1–2 sentences on what the tool does for HR, People & Culture and recruitment leads.
- [ ] Also **confirm or rewrite** the headline under `## Hero headline`. It currently reads: "Check your internal policies against Call to Action 92."

### 3. Footer acknowledgement (beside the NinetyTwo logo, on every page)
File: `content/acknowledgement.md`
- [ ] The team's acknowledgement, 1–3 sentences.

---

## 🟠 Landing page

File: `content/landing.md`
- [ ] **Ask 1** (`## Ask 1`): the first thing Call to Action 92 asks of corporate Canada, in your own words, with a citation. 1–2 sentences.
- [ ] **Ask 2** (`## Ask 2`): the second thing, with a citation.
- [ ] **Ask 3** (`## Ask 3`): the third thing, with a citation.
- [ ] **Why it matters** (`## Why it matters`): one short pull quote on why this matters for employers. One sentence, shown large.
- [ ] **Why it matters source** (`## Why it matters source`): the source link for that quote.

## 🟠 Methodology & Sources page

- [ ] **Your data**, `content/data-note.md`: the data and OCAP® note. What happens to uploaded documents and how the team thought about data and content. A short paragraph or a few bullets.
- [ ] **All sources**, `content/sources.md` → `## All sources`: the full source list and attributions, one link per line.
- [ ] **Built on**, `content/sources.md` → `## Built on`: check that each of the three links goes to the exact page we cite (Ontario Human Rights Commission, UNDRIP Art. 2, TRC Call to Action 92).

## 🟠 Report page: the "gap" text for each criterion

File: `rubric/rubric.json` (a dev can paste these in; just send the text). Each criterion needs two pieces:
- **What Addressed looks like**: 1–2 sentences describing a policy that fully meets it.
- **Why it matters**: in your own words, citing the sources listed for that criterion.

- [ ] **The policy prohibits discrimination, including on grounds relevant to Indigenous identity**: What Addressed looks like / Why it matters
- [ ] **Indigenous-specific hiring follows Ontario Human Rights Commission guidance**: What Addressed looks like / Why it matters
- [ ] **Retention and advancement supports exist**: What Addressed looks like / Why it matters

## 🟡 Report page: "Coming next" cards

File: `rubric/rubric.json` → `comingNext`. These are 18 greyed-out cards for criteria we haven't built yet. Each needs a short title, a few words, like "Leadership: Indigenous representation on the board".
- [ ] Leadership × 3
- [ ] Consultation × 4
- [ ] Hiring × 4
- [ ] Procurement × 3
- [ ] Education × 4

## 🟡 Sample policies

Files: `samples/weak.txt`, `samples/partial.txt`, `samples/strong.txt`
- [ ] Once the sample text is final, delete the first line (`TODO(team): replace with the team's sample text`). **Tell Tech B first**, because a test checks for that line.
