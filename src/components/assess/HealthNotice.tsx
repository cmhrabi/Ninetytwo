"use client";

import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/** Non-blocking notice when the server has no OpenRouter key: samples still run from cached results. */
export function HealthNotice() {
  const [keyMissing, setKeyMissing] = useState(false);

  useEffect(() => {
    let live = true;
    api.getHealth().then(
      (h) => live && setKeyMissing(!h.keyLoaded),
      () => {}, // a failed health check says nothing useful here; the run shows its own errors
    );
    return () => {
      live = false;
    };
  }, []);

  if (!keyMissing) return null;
  return (
    <div
      role="status"
      className="mb-10 flex gap-3 rounded-2xl border border-gold-edge/40 bg-gold-wash text-midnight p-4 text-sm"
    >
      <Info className="mt-0.5 size-4 shrink-0 text-gold-edge" aria-hidden />
      <p>Live scoring isn&apos;t configured; sample policies will use cached runs.</p>
    </div>
  );
}
