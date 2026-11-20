"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Decorative 3D "policy document" that tilts toward the cursor and rolls back as the page scrolls.
 * Abstract only: skeleton lines stand in for paragraphs, gold lines for verified quotes. No real text.
 * Hidden from assistive tech; static under prefers-reduced-motion.
 */

// Skeleton paragraphs: each number is a line width in %. `hit` marks the line drawn as a verified quote.
const paragraphs: { lines: number[]; hit?: number }[] = [
  { lines: [92, 86, 64] },
  { lines: [96, 90, 78, 40], hit: 1 },
  { lines: [88, 94, 52] },
  { lines: [90, 82, 96, 70], hit: 2 },
  { lines: [94, 60] },
];

const spring = { stiffness: 120, damping: 18, mass: 0.6 };

export function FloatingDocument({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Pointer position across the viewport, -0.5 .. 0.5.
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => {
      px.set(e.clientX / window.innerWidth - 0.5);
      py.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [px, py, reduce]);

  // Scroll progress while the document passes through the viewport.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const mouseY = useTransform(px, [-0.5, 0.5], [-22, 22]);
  const mouseX = useTransform(py, [-0.5, 0.5], [16, -16]);
  const scrollX = useTransform(scrollYProgress, [0.3, 1], [0, 38]);
  const scrollZ = useTransform(scrollYProgress, [0.3, 1], [-8, 6]);
  const lift = useTransform(scrollYProgress, [0.3, 1], [0, -80]);

  const rotateY = useSpring(useTransform(() => -18 + mouseY.get()), spring);
  const rotateX = useSpring(useTransform(() => 14 + mouseX.get() + scrollX.get()), spring);
  const rotateZ = useSpring(scrollZ, spring);
  const y = useSpring(lift, spring);

  // Glare follows the pointer across the paper.
  const glareX = useTransform(px, [-0.5, 0.5], ["10%", "90%"]);
  const glareY = useTransform(py, [-0.5, 0.5], ["5%", "95%"]);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgb(255 255 255 / 0.55), transparent 55%)`;

  return (
    <div ref={ref} aria-hidden className={cn("pointer-events-none [perspective:1200px]", className)}>
      <motion.div
        style={reduce ? { rotateX: 14, rotateY: -18, rotateZ: -8 } : { rotateX, rotateY, rotateZ, y }}
        className="relative aspect-[8.5/11] w-full [transform-style:preserve-3d]"
      >
        {/* Back sheet for depth */}
        <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-lg bg-white/30 [transform:translateZ(-30px)]" />

        {/* Page */}
        <div className="absolute inset-0 overflow-hidden rounded-lg bg-white p-[8%] shadow-2xl shadow-black/40">
          <div className="mb-[8%] flex items-center justify-between">
            <div className="h-2.5 w-2/5 rounded-full bg-midnight/80" />
            <div className="h-2 w-1/6 rounded-full bg-midnight/15" />
          </div>

          <div className="space-y-[6%]">
            {paragraphs.map((p, i) => (
              <div key={i} className="flex gap-2">
                <span className="w-4 shrink-0 pt-px font-mono text-[9px] leading-none text-indigo/50">p{i + 1}</span>
                <div className="flex-1 space-y-1.5">
                  {p.lines.map((w, j) => (
                    <div
                      key={j}
                      style={{ width: `${w}%` }}
                      className={cn(
                        "h-1.5 rounded-full",
                        p.hit === j ? "bg-gold ring-2 ring-gold/40" : "bg-midnight/12",
                      )}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Judge scanning the page */}
          {!reduce && (
            <motion.div
              className="absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-gold/25 to-transparent"
              animate={{ top: ["-15%", "105%"] }}
              transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
            />
          )}

          {!reduce && <motion.div className="absolute inset-0 mix-blend-soft-light" style={{ background: glare }} />}
        </div>
      </motion.div>
    </div>
  );
}
