"use client";

import { useRef, useState } from "react";
import { Check, FileSearch, FileText, ShieldCheck, Upload, X } from "lucide-react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { ScoreRing } from "@/components/brand/ScoreRing";
import { cn } from "@/lib/utils";

/**
 * Apple-style "How it works": the steps scroll past on the left while one pinned policy document
 * on the right changes with scroll progress (lands → scanned → quotes checked → report).
 * Abstract visuals only: skeleton lines, no real policy text. The score is a labelled illustration.
 */

// Describes the product only; copy about CTA 92 lives in content/.
const steps = [
  {
    Icon: Upload,
    title: "Upload a policy",
    body: "Drop a PDF, DOCX or TXT policy, or pick a sample. It is read in memory and never stored.",
  },
  {
    Icon: FileSearch,
    title: "AI finds evidence",
    body: "One AI judge per criterion looks for exact quotes. It finds evidence only and never writes advice.",
  },
  {
    Icon: ShieldCheck,
    title: "Code checks and scores",
    body: "Every quote is checked word for word against your document. Code applies the weighted rubric.",
  },
  {
    Icon: FileText,
    title: "Read the report",
    body: "Your score, the verified evidence, the gaps, and where to learn more, each with its source.",
  },
];

// Skeleton paragraphs (line widths in %). `quote` marks a line the judge quotes, when the scan reaches
// it (`at`, scroll progress), when its quote check resolves (`check`) and whether it passes.
type Quote = { line: number; at: number; check: number; verified: boolean };
const paragraphs: { lines: number[]; quote?: Quote }[] = [
  { lines: [92, 86, 64] },
  { lines: [96, 90, 78, 40], quote: { line: 1, at: 0.31, check: 0.55, verified: true } },
  { lines: [88, 94, 52], quote: { line: 0, at: 0.37, check: 0.6, verified: false } },
  { lines: [90, 82, 96, 70], quote: { line: 2, at: 0.43, check: 0.65, verified: true } },
  { lines: [94, 60] },
];

const spring = { stiffness: 140, damping: 24, mass: 0.5 };

export function ScrollStory() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start center", "end center"] });
  const smooth = useSpring(scrollYProgress, spring);
  // Reduced motion: hold a static "evidence checked" frame and show every step at full strength.
  const still = useMotionValue(0.7);
  const p = reduce ? still : smooth;

  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.min(3, Math.max(0, Math.floor(v * 4)))));

  // 1. Lands flat.  4. Steps back so the report can come forward.
  const rotateX = useTransform(p, [0, 0.18, 0.75, 0.92], [38, 0, 0, 8]);
  const rotateY = useTransform(p, [0, 0.18, 0.75, 0.92], [-28, 0, 0, 22]);
  const y = useTransform(p, [0, 0.18], [120, 0]);
  const scale = useTransform(p, [0, 0.18, 0.75, 0.92], [0.82, 1, 1, 0.84]);
  const x = useTransform(p, [0.75, 0.92], ["0%", "-14%"]);
  const opacity = useTransform(p, [0, 0.12], [0.3, 1]);

  // 2. The judge's scan line sweeps the page.
  const scanTop = useTransform(p, [0.25, 0.5], ["-12%", "108%"]);
  const scanOpacity = useTransform(p, [0.24, 0.27, 0.48, 0.51], [0, 1, 1, 0]);

  // 4. Report card.
  const cardOpacity = useTransform(p, [0.78, 0.9], [0, 1]);
  const cardY = useTransform(p, [0.78, 0.9], [48, 0]);

  return (
    <div ref={ref} className="relative grid gap-10 lg:grid-cols-2 lg:gap-16">
      {/* Pinned document */}
      <div className="sticky top-16 z-10 -mx-4 flex h-[46vh] items-center justify-center bg-surface px-4 py-4 sm:-mx-6 sm:px-6 lg:order-2 lg:mx-0 lg:h-[calc(100vh-4rem)] lg:self-start lg:bg-transparent lg:px-0">
        <div aria-hidden className="relative h-full max-h-[34rem] [perspective:1400px]">
          <motion.div
            style={{ rotateX, rotateY, y, scale, x, opacity }}
            className="relative aspect-[8.5/11] h-full overflow-hidden rounded-lg bg-white p-[8%] shadow-2xl ring-1 shadow-midnight/20 ring-border"
          >
            <div className="mb-[8%] flex items-center justify-between">
              <div className="h-3 w-2/5 rounded-full bg-midnight/80" />
              <div className="h-2 w-1/6 rounded-full bg-midnight/15" />
            </div>
            <div className="space-y-[6%]">
              {paragraphs.map((para, i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-5 shrink-0 font-mono text-[10px] leading-none text-indigo/60">p{i + 1}</span>
                  <div className="flex-1 space-y-2">
                    {para.lines.map((w, j) =>
                      para.quote?.line === j ? (
                        <QuoteLine key={j} width={w} p={p} quote={para.quote} />
                      ) : (
                        <div key={j} style={{ width: `${w}%` }} className="h-2 rounded-full bg-midnight/12" />
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>
            <motion.div
              style={{ top: scanTop, opacity: scanOpacity }}
              className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-gold/35 to-transparent"
            />
          </motion.div>

          <motion.div
            style={{ opacity: cardOpacity, y: cardY }}
            className="absolute -right-6 bottom-6 flex items-center gap-4 rounded-2xl bg-card p-4 shadow-xl ring-1 shadow-midnight/15 ring-border sm:-right-10 sm:p-5"
          >
            <ScoreRing value={88} label="Leading" size={96} tone="light" />
            <div className="text-sm">
              <p className="font-semibold text-midnight">2 of 3 quotes verified</p>
              <p className="text-muted-foreground">Example report</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Steps */}
      <ol className="lg:order-1">
        {steps.map(({ Icon, title, body }, i) => (
          <li
            key={title}
            className={cn(
              "flex min-h-[60vh] flex-col justify-center transition-opacity duration-500 lg:min-h-[75vh]",
              // Step 1 starts right under the intro instead of floating mid-screen.
              i === 0 && "min-h-[45vh] justify-start pt-12 lg:min-h-[60vh] lg:pt-16",
              !reduce && active !== i && "opacity-30",
            )}
          >
            <div className="flex items-center gap-4">
              <span className="inline-flex size-12 items-center justify-center rounded-xl bg-midnight text-gold">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="font-heading text-3xl text-indigo/50" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="mt-6 text-3xl md:text-4xl">{title}</h3>
            <p className="mt-4 max-w-md text-lg text-muted-foreground">{body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** A quoted line: gold highlight wipes in as the scan passes, then a check or cross as the quote is verified. */
function QuoteLine({
  width,
  p,
  quote,
}: {
  width: number;
  p: MotionValue<number>;
  quote: Quote;
}) {
  const fill = useTransform(p, [quote.at, quote.at + 0.04], [0, 1]);
  const badge = useTransform(p, [quote.check, quote.check + 0.03], [0, 1]);
  // Unverified quotes lose their highlight once checked.
  const highlight = useTransform(p, [quote.check, quote.check + 0.03], [1, quote.verified ? 1 : 0.15]);

  return (
    <div className="relative flex items-center" style={{ width: `${width}%` }}>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-midnight/12">
        <motion.div
          style={{ scaleX: fill, opacity: highlight }}
          className="absolute inset-0 origin-left rounded-full bg-gold"
        />
      </div>
      <motion.span
        style={{ scale: badge, opacity: badge }}
        className={cn(
          "absolute -right-7 inline-flex size-5 items-center justify-center rounded-full",
          quote.verified ? "bg-status-addressed-bg text-status-addressed" : "bg-status-notfound-bg text-status-notfound",
        )}
      >
        {quote.verified ? <Check className="size-3" strokeWidth={3} /> : <X className="size-3" strokeWidth={3} />}
      </motion.span>
    </div>
  );
}
