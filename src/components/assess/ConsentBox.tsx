"use client";

import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAssessment } from "@/state/assessment";

export function ConsentBox({ className }: { className?: string }) {
  const { state, setConsent } = useAssessment();
  return (
    <label
      className={cn(
        "flex cursor-pointer gap-3 rounded-2xl p-4 ring-1 ring-border transition-colors has-focus-visible:ring-2 has-focus-visible:ring-midnight",
        state.consent && "bg-surface",
        className,
      )}
    >
      <input
        type="checkbox"
        required
        checked={state.consent}
        onChange={(e) => setConsent(e.target.checked)}
        className="mt-0.5 size-5 shrink-0 accent-midnight"
      />
      <span className="text-sm">
        <span className="flex items-center gap-1.5 font-medium text-midnight">
          <ShieldCheck className="size-4" aria-hidden /> I understand how my file is handled
        </span>
        <span className="mt-1 block text-muted-foreground">
          Your file is processed in memory and never stored. Emails and phone numbers are removed before AI analysis.
        </span>
      </span>
    </label>
  );
}
