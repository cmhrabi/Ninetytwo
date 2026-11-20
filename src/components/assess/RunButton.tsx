"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAssessment } from "@/state/assessment";
import { canRun, runBlocker } from "@/state/assessmentReducer";

/** The page's one gold button. Stays disabled until a document is loaded and consent is ticked. */
export function RunButton({ className }: { className?: string }) {
  const { state, startAssessment } = useAssessment();
  const router = useRouter();
  const blocker = runBlocker(state);

  const onRun = () => {
    if (startAssessment()) router.push("/report");
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Button variant="gold" size="xl" disabled={!canRun(state)} aria-describedby="run-hint" onClick={onRun}>
        Run assessment <ArrowRight data-icon="inline-end" aria-hidden />
      </Button>
      <p id="run-hint" aria-live="polite" className="text-sm text-muted-foreground">
        {blocker ?? `Ready: ${state.document?.paragraphs.length} paragraphs.`}
      </p>
    </div>
  );
}
