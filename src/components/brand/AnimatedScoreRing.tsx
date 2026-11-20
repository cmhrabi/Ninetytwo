"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
} from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Score ring that fills from 0 to `value` (and counts up) the first time it scrolls into view, then
 * replays whenever the pointer enters the closest `[data-ring-trigger]` ancestor (or the ring itself).
 * Static under prefers-reduced-motion. The accessible label always carries the final value.
 * Same look as the static ScoreRing (dark tone only: it is used on midnight surfaces).
 */
export function AnimatedScoreRing({
  value,
  label,
  size = 160,
  className,
}: {
  value: number;
  label?: string;
  size?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const stroke = size * 0.085;
  const r = (size - stroke) / 2;

  const ref = useRef<HTMLDivElement>(null);
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.5 });

  const progress = useMotionValue(0);
  const dash = useTransform(progress, (v) => `${v} 100`);
  const arcOpacity = useTransform(progress, (v) => (v > 0.5 ? 1 : 0));
  const shown = useTransform(progress, (v) => Math.round(v));

  useEffect(() => {
    if (reduce) {
      controls.current?.stop();
      progress.set(pct);
      return;
    }
    const play = () => {
      controls.current?.stop();
      progress.set(0);
      controls.current = animate(progress, pct, { duration: 1.2, ease: [0.22, 1, 0.36, 1] });
    };
    if (inView) play();
    const root = ref.current?.closest<HTMLElement>("[data-ring-trigger]") ?? ref.current;
    if (!inView || !root) return;
    root.addEventListener("pointerenter", play);
    return () => root.removeEventListener("pointerenter", play);
  }, [inView, reduce, pct, progress]);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={`Score ${pct} percent${label ? `, ${label}` : ""}`}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-white/12" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          pathLength={100}
          className="stroke-gold"
          style={{ strokeDasharray: dash, opacity: arcOpacity }}
        />
      </svg>
      <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading leading-none font-semibold text-white tabular-nums" style={{ fontSize: size * 0.3 }}>
          <motion.span>{shown}</motion.span>
          <span style={{ fontSize: size * 0.14 }}>%</span>
        </span>
        {label && (
          <span className="mt-1 font-medium text-gold" style={{ fontSize: Math.max(11, size * 0.085) }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
