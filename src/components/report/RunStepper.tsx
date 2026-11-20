"use client";

import { CircleCheck, CircleX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CardState, RunState } from "@/state/runReducer";
import { criterionName } from "./format";

type StepStatus = "waiting" | "active" | "done" | "failed";

/** Reading document → Scanning document → one tick per criterion as each judge returns. */
export function RunStepper({ run }: { run: RunState }) {
  const scanStatus: StepStatus =
    run.phase === "scanning" ? "active" : run.phase === "failed" ? "failed" : run.scan ? "done" : "waiting";

  return (
    <ol aria-label="Assessment progress" className="flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:gap-x-6">
      <Step status="done" label="Reading document" />
      <Step
        status={scanStatus}
        label="Scanning document"
        note={run.scan && !run.scan.aiScanned ? "Keyword scan only" : undefined}
      />
      {run.order.map((id) => (
        <Step key={id} status={cardStep(run.cards[id])} label={`Checking ${run.rubric ? criterionName(run.rubric, id) : "criterion"}`} />
      ))}
    </ol>
  );
}

function cardStep(card: CardState | undefined): StepStatus {
  if (!card) return "waiting";
  if (card.kind === "pending" || card.kind === "retrying") return "active";
  if (card.kind === "done") return "done";
  return "failed";
}

function Step({ status, label, note }: { status: StepStatus; label: string; note?: string }) {
  return (
    <li className={cn("flex items-center gap-2", status === "waiting" && "text-white/50")}>
      {status === "active" && <Loader2 className="size-4 animate-spin text-gold" aria-hidden />}
      {status === "done" && <CircleCheck className="size-4 text-gold" aria-hidden />}
      {status === "failed" && <CircleX className="size-4 text-white/70" aria-hidden />}
      {status === "waiting" && <span className="size-4 rounded-full border border-white/30" aria-hidden />}
      <span>
        {label}
        <span className="sr-only">: {status}</span>
      </span>
      {note && <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/80">{note}</span>}
    </li>
  );
}
