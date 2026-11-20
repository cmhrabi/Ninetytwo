import type { Rubric } from "@/shared";

// From ticket 04B's wording; product roadmap, not learning copy.
const EXTRA = ["Assessing several documents together", "A gold-standard policy set reviewed by an Indigenous organization"];

/** Greyed cards for criteria and features that aren't scored yet. */
export function ComingNext({ rubric }: { rubric: Rubric }) {
  const items = [
    ...rubric.comingNext.map((c) => ({ key: c.id, code: c.id, title: c.title })),
    ...EXTRA.map((title) => ({ key: title, code: null, title })),
  ];
  return (
    <section aria-labelledby="coming-next">
      <h2 id="coming-next" className="mb-4 text-2xl text-midnight">
        Coming next
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <li
            key={c.key}
            className="flex gap-2 rounded-2xl border border-dashed border-border bg-surface p-4 text-sm text-muted-foreground"
          >
            {c.code && <span className="font-mono text-xs leading-6">{c.code}</span>}
            <span>{c.title}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
