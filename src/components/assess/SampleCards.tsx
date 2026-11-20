"use client";

import { useEffect, useState } from "react";
import { CircleCheck, LoaderCircle } from "lucide-react";
import type { Sample } from "@/shared";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAssessment } from "@/state/assessment";

/** The three fictional sample policies, loaded from /api/samples. */
export function SampleCards({ className }: { className?: string }) {
  const { state, chooseSample } = useAssessment();
  const [samples, setSamples] = useState<Sample[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    api.listSamples().then(
      (s) => live && setSamples(s),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, []);

  if (failed) return <p className="text-sm text-muted-foreground">Samples are unavailable right now.</p>;

  const selectedId = state.source?.kind === "sample" ? state.source.id : null;

  return (
    <ul className={cn("grid gap-3 md:grid-cols-3", className)}>
      {(samples ?? [null, null, null]).map((s, i) => {
        if (!s) return <li key={i} className="h-36 animate-pulse rounded-2xl bg-surface" aria-hidden />;
        const selected = s.id === selectedId;
        const loading = selected && state.loading === "sample";
        return (
          <li key={s.id}>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => chooseSample(s.id)}
              className={cn(
                "flex h-full w-full flex-col gap-3 rounded-2xl bg-card p-4 text-left ring-1 ring-border transition hover:ring-indigo/50 focus-visible:ring-2 focus-visible:ring-midnight focus-visible:outline-none",
                selected && "ring-2 ring-gold-edge bg-gold-wash/50 hover:ring-gold-edge",
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="text-muted-foreground">
                  Fictional sample
                </Badge>
                {loading ? (
                  <LoaderCircle className="size-4 animate-spin text-indigo" aria-label="Loading" />
                ) : selected && state.document ? (
                  <CircleCheck className="size-4 text-status-addressed" aria-label="Selected" />
                ) : null}
              </span>
              <span className="font-heading text-xl font-medium leading-tight text-midnight">{s.title}</span>
              <span className="text-sm text-muted-foreground">{s.summary}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
