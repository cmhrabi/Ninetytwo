"use client";

import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocType } from "@/state/assessmentReducer";

const types: { id: DocType; label: string; enabled: boolean }[] = [
  { id: "hiring", label: "Hiring policy", enabled: true },
  { id: "leadership", label: "Leadership", enabled: false },
  { id: "consultation", label: "Consultation", enabled: false },
  { id: "procurement", label: "Procurement", enabled: false },
  { id: "education", label: "Education", enabled: false },
];

/** Only hiring policies are assessed today; the rest are shown as coming next. */
export function DocTypeSelect({ value, className }: { value: DocType; className?: string }) {
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="sr-only">Document type</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {types.map((t) => {
          const checked = t.id === value;
          return (
            <label
              key={t.id}
              className={cn(
                "relative flex min-h-16 flex-col justify-between gap-1 rounded-xl p-3 text-sm ring-1 transition-colors",
                t.enabled ? "cursor-pointer ring-border has-focus-visible:ring-2 has-focus-visible:ring-midnight" : "cursor-not-allowed bg-surface text-muted-foreground ring-border/60",
                checked && "bg-midnight text-white ring-midnight",
              )}
            >
              <input
                type="radio"
                name="docType"
                value={t.id}
                checked={checked}
                disabled={!t.enabled}
                readOnly
                className="sr-only"
              />
              <span className="flex items-center gap-1.5 font-medium">
                {t.enabled && <FileText className="size-4" aria-hidden />}
                {t.label}
              </span>
              {!t.enabled && <span className="text-xs">Coming next</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
