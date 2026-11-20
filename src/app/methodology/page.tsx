import type { Metadata } from "next";
import { Markdown } from "@/components/Markdown";
import { Eyebrow, Section } from "@/components/brand/Section";
import { LinkList, TeamCopy } from "@/components/report/parts";
import { getContent, getLinks, getRubric, getSection } from "@/lib/content";
import { allSources, criteriaRows, workedExample } from "@/lib/methodology";
import type { Criterion } from "@/shared";

export const metadata: Metadata = { title: "Methodology & Sources · NinetyTwo" };

const LEVELS = ["2", "1", "0"] as const;
const levelName = { "2": "Addressed", "1": "Partly addressed", "0": "Not found" } as const;

/** How scoring works, what the AI does, the data note and every source. Generated from rubric.json. */
export default function MethodologyPage() {
  const rubric = getRubric();
  const rows = criteriaRows(rubric);
  const example = workedExample(rubric);
  const contentLinks = [...getLinks("sources", "Built on"), ...getLinks("sources", "All sources")].map((l) => ({
    title: l.label,
    url: l.href,
  }));
  const sources = allSources(rubric, contentLinks);
  const allSourcesCopy = getSection("sources", "All sources");
  const dataNote = getContent("data-note");

  return (
    <>
      <Section tone="midnight" className="py-14 md:py-20">
        <Eyebrow className="text-gold">Methodology &amp; Sources</Eyebrow>
        <h1 className="text-display max-w-3xl">How the score is made</h1>
        <nav aria-label="On this page" className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
          <a href="#scoring" className="hover:text-white">How scoring works</a>
          <a href="#ai" className="hover:text-white">What the AI does</a>
          <a href="#data" className="hover:text-white">Your data</a>
          <a href="#sources" className="hover:text-white">Sources</a>
          <a href="#version" className="hover:text-white">Version</a>
        </nav>
      </Section>

      <Section id="scoring" className="scroll-mt-16 py-14 md:py-20" innerClassName="space-y-12">
        <div>
          <Eyebrow>How scoring works</Eyebrow>
          <h2 className="text-3xl text-midnight sm:text-4xl">Criteria and weights</h2>
          <div className="mt-6 overflow-x-auto rounded-2xl ring-1 ring-border">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-surface text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Criterion</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Tier</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Weight</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Max points</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Counts when</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.key} className="align-top">
                    <th scope="row" className="px-4 py-3 font-medium text-midnight">{r.title}</th>
                    <td className="px-4 py-3">{r.tier}</td>
                    <td className="px-4 py-3 font-mono">×{r.weight}</td>
                    <td className="px-4 py-3 font-mono">{r.maxPoints}</td>
                    <td className="px-4 py-3">{r.whenItCounts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-3xl text-midnight sm:text-4xl">What each criterion checks</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Each criterion scores 0, 1 or 2. A check counts only when at least one quote for it is found word for word in
            the document. A verified red flag sets the criterion to 0. A score of 0 on a criterion marked baseline raises
            a warning above the score, whatever the percentage.
          </p>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {rubric.criteria.map((c) => (
              <CriterionMethod key={c.id} criterion={c} />
            ))}
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl text-midnight sm:text-4xl">Overall score</h2>
            <p className="mt-4 rounded-2xl bg-surface px-5 py-4 font-mono text-sm text-midnight">
              round(100 × Σ(score × weight) ÷ Σ(2 × weight))
            </p>
            <p className="mt-3 text-sm text-muted-foreground">Only criteria that apply are counted.</p>
            <h3 className="mt-8 font-sans text-base font-semibold text-midnight">Worked example</h3>
            <ul className="mt-3 space-y-1 text-sm">
              {example.rows.map((r) => (
                <li key={r.key} className="flex justify-between gap-4 border-b border-border py-1.5">
                  <span>{r.name}</span>
                  <span className="font-mono">
                    {r.score === null ? "N/A (left out)" : `${r.score} × ${r.weight} = ${r.score * r.weight}`}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 font-mono text-sm text-midnight">
              round(100 × {example.earned} ÷ {example.possible}) = {example.percent} → {example.band}
            </p>
          </div>
          <div>
            <h2 className="text-3xl text-midnight sm:text-4xl">Bands</h2>
            <table className="mt-6 w-full text-left text-sm">
              <tbody className="divide-y divide-border">
                {rubric.bands.map((b) => (
                  <tr key={b.label}>
                    <td className="py-2 pr-4 font-mono">
                      {b.min}–{b.max}
                    </td>
                    <th scope="row" className="py-2 font-medium text-midnight">{b.label}</th>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      <Section id="ai" tone="surface" className="scroll-mt-16 py-14 md:py-20" innerClassName="grid gap-10 lg:grid-cols-2">
        <div>
          <Eyebrow>What the AI does</Eyebrow>
          <h2 className="text-3xl text-midnight sm:text-4xl">The AI finds evidence. Code does the scoring.</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="font-sans text-base font-semibold text-midnight">The AI does</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm marker:text-gold-edge">
              <li>Scan the whole document once to point out passages that may be relevant to each criterion.</li>
              <li>For each criterion, report which checks it found evidence for, with exact quotes from the document.</li>
              <li>Write one or two sentences describing what it found.</li>
            </ul>
          </div>
          <div>
            <h3 className="font-sans text-base font-semibold text-midnight">The AI never</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm marker:text-gold-edge">
              <li>Gives a score. Code checks every quote against the document and applies the rubric rules.</li>
              <li>Writes advice or recommends changes to a policy.</li>
              <li>Follows instructions inside an uploaded document. Documents are treated as data only.</li>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              A quote that can&apos;t be found word for word in the document is discarded and never counts.
            </p>
          </div>
        </div>
      </Section>

      <Section id="data" className="scroll-mt-16 py-14 md:py-20" innerClassName="max-w-3xl">
        <Eyebrow>Your data</Eyebrow>
        <Markdown>{dataNote || "TODO(team): Data and content note."}</Markdown>
      </Section>

      <Section id="sources" tone="surface" className="scroll-mt-16 py-14 md:py-20" innerClassName="max-w-3xl space-y-6">
        <div>
          <Eyebrow>Sources and attributions</Eyebrow>
          <h2 className="text-3xl text-midnight sm:text-4xl">Sources</h2>
        </div>
        {allSourcesCopy && <Markdown>{allSourcesCopy}</Markdown>}
        <LinkList links={sources} />
      </Section>

      <Section id="version" className="scroll-mt-16 py-10">
        <p className="text-sm text-muted-foreground">
          Rubric version <span className="font-mono text-midnight">{rubric.version}</span>. Not legal advice.
        </p>
      </Section>
    </>
  );
}

function CriterionMethod({ criterion }: { criterion: Criterion }) {
  return (
    <article className="rounded-3xl bg-white p-6 ring-1 ring-border">
      <h3 className="text-xl leading-snug text-midnight">{criterion.title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {criterion.scoring.type === "average" ? "Each check is graded 0–2; the score is their average." : "Score set by which checks are met."}
      </p>
      <h4 className="mt-5 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">Checks</h4>
      <ul className="mt-2 space-y-2 text-sm">
        {criterion.checks.map((k) => (
          <li key={k.id}>
            {k.label}
            {k.graded && k.levels && (
              <ul className="mt-1 ml-4 space-y-0.5 text-xs text-muted-foreground">
                {LEVELS.map((l) => (
                  <li key={l}>
                    <span className="font-mono">{l}</span>: {k.levels![l]}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      {criterion.redFlags.length > 0 && (
        <>
          <h4 className="mt-5 text-xs font-semibold tracking-[0.12em] text-status-notfound uppercase">Red flags (score set to 0)</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {criterion.redFlags.map((f) => (
              <li key={f.id}>{f.label}</li>
            ))}
          </ul>
        </>
      )}
      <h4 className="mt-5 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">Scores</h4>
      <dl className="mt-2 space-y-1.5 text-sm">
        {LEVELS.map((l) => (
          <div key={l} className="grid grid-cols-[8.5rem_1fr] gap-2">
            <dt className="font-medium text-midnight">
              {l} · {levelName[l]}
            </dt>
            <dd>
              <TeamCopy text={criterion.levels[l]} className="text-sm" />
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
