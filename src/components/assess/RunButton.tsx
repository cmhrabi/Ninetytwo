"use client";

import { ArrowRight, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAssessment } from "@/state/assessment";
import { canRun, runBlocker } from "@/state/assessmentReducer";

/** The page's one gold button. Stays disabled until a document is loaded and consent is ticked. */
export function RunButton({ className }: { className?: string }) {
  const { state, run } = useAssessment();
  const blocker = runBlocker(state);

  return (
    <div className={cn("space-y-3", className)}>
      <Button
        variant="gold"
        size="xl"
        disabled={!canRun(state)}
        aria-describedby="run-hint"
        onClick={run}
      >
        Run assessment <ArrowRight data-icon="inline-end" aria-hidden />
      </Button>
      <p id="run-hint" aria-live="polite" className="text-sm text-muted-foreground">
        {state.ready ? (
          <span className="flex items-center gap-1.5 text-status-addressed">
            <CircleCheck className="size-4" aria-hidden />
            Document ready: {state.document?.paragraphs.length} paragraphs. Progress view coming next.
          </span>
        ) : (
          blocker ?? "Ready when you are."
        )}
      </p>
    </div>
  );
}
