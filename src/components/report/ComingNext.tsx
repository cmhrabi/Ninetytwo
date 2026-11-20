import { ArrowRight, Sparkles } from "lucide-react";
import type { Rubric } from "@/shared";

// Product roadmap, not learning copy.
const EXTRAS = ["checking several documents at once", "a gold-standard policy set reviewed by an Indigenous organization"];

/** Groups the rubric's comingNext entries by area (the title, or the part before ":"), keeping rubric order. */
function areasOf(rubric: Rubric): { area: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const c of rubric.comingNext) {
    const area = c.title.split(":")[0].trim() || "More";
    counts.set(area, (counts.get(area) ?? 0) + 1);
  }
  return [...counts].map(([area, count]) => ({ area, count }));
}

/** Roadmap teaser: one compact banner instead of a card per upcoming check. */
export function ComingNext({ rubric }: { rubric: Rubric }) {
  const areas = areasOf(rubric);
  const total = rubric.comingNext.length;
  return (
    <section
      aria-labelledby="coming-next"
      className="rounded-3xl bg-midnight px-6 py-7 text-white md:px-10 md:py-9"
    >
      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-gold uppercase">
            <Sparkles className="size-3.5" aria-hidden /> Coming next
          </p>
          <h2 id="coming-next" className="text-2xl text-white md:text-3xl">
            Hiring is just the start.
          </h2>
          <p className="mt-2 max-w-xl text-sm text-white/70">
            {total} more checks are on the way, so one upload covers more of your organization&rsquo;s response to
            Call to Action 92. Plus: {EXTRAS.join(" and ")}.
          </p>
        </div>
        <ul className="flex flex-wrap gap-2 md:max-w-sm md:justify-end">
          {areas.map(({ area, count }) => (
            <li
              key={area}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm"
            >
              {area}
              <span className="rounded-full bg-gold/90 px-1.5 text-xs font-semibold text-midnight">+{count}</span>
            </li>
          ))}
          <li className="inline-flex items-center gap-1 px-1 py-1.5 text-sm text-white/60">
            and more <ArrowRight className="size-3.5" aria-hidden />
          </li>
        </ul>
      </div>
    </section>
  );
}
