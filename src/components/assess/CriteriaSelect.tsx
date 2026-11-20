"use client";

import { Check } from "lucide-react";
import { tierLabel } from "@/components/report/format";
import { cn } from "@/lib/utils";
import type { Criterion } from "@/shared";
import { useAssessment } from "@/state/assessment";
import { selectedIds } from "@/state/assessmentReducer";

export type CriterionOption = Pick<Criterion, "id" | "title" | "shortTitle" | "tier" | "weight">;

/** Areas beyond hiring, shown as coming next. */
const comingNext = ["Leadership", "Consultation", "Procurement", "Education"];

/** Step 1: which criteria to check. All are ticked by default; at least one must stay ticked to run. */
export function CriteriaSelect({ criteria, className }: { criteria: CriterionOption[]; className?: string }) {
  const { state, setCriteria } = useAssessment();
  const all = criteria.map((c) => c.id);
  const selected = selectedIds(state, all);

  const toggle = (id: string) =>
    setCriteria(selected.includes(id) ? selected.filter((x) => x !== id) : all.filter((x) => x === id || selected.includes(x)));

  return (
    <div className={cn("min-w-0 space-y-6", className)}>
      <fieldset className="min-w-0">
        <legend className="mb-3 text-sm text-muted-foreground">
          Hiring policy criteria. All are selected by default; untick any that don&apos;t apply to this document.
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {criteria.map((c) => {
            const checked = selected.includes(c.id);
            return (
              <label
                key={c.id}
                title={c.title}
                className={cn(
                  "relative flex min-h-24 cursor-pointer flex-col justify-between gap-2 rounded-xl p-3 text-sm ring-1 ring-border transition-colors has-focus-visible:ring-2 has-focus-visible:ring-midnight",
                  checked && "bg-midnight text-white ring-midnight",
                )}
              >
                <input
                  type="checkbox"
                  name="criteria"
                  value={c.id}
                  checked={checked}
                  onChange={() => toggle(c.id)}
                  className="sr-only"
                />
                <span className="flex items-start justify-between gap-2 font-medium">
                  {c.shortTitle}
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-md ring-1",
                      checked ? "bg-gold text-midnight ring-gold" : "ring-border",
                    )}
                  >
                    {checked && <Check className="size-3.5" />}
                  </span>
                </span>
                <span className={cn("text-xs", checked ? "text-white/75" : "text-muted-foreground")}>
                  {tierLabel[c.tier]} · ×{c.weight}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div>
        <p className="mb-3 text-sm text-muted-foreground">Other policy areas</p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {comingNext.map((label) => (
            <li
              key={label}
              aria-disabled
              className="flex min-h-16 cursor-not-allowed flex-col justify-between gap-1 rounded-xl bg-surface p-3 text-sm text-muted-foreground ring-1 ring-border/60"
            >
              <span className="font-medium">{label}</span>
              <span className="text-xs">Coming next</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
