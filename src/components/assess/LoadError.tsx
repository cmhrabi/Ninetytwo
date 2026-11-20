"use client";

import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAssessment } from "@/state/assessment";
import { messageFor } from "./errorMessages";

/** Inline friendly error for a failed sample load or upload. */
export function LoadError({ className }: { className?: string }) {
  const { state } = useAssessment();
  if (!state.error) return null;
  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-2xl border border-status-notfound/25 bg-status-notfound-bg p-4 text-sm text-status-notfound",
        className,
      )}
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{messageFor(state.error)}</p>
    </div>
  );
}
