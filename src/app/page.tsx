import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Markdown } from "@/components/Markdown";
import { Reveal } from "@/components/brand/Reveal";
import { Eyebrow, Section } from "@/components/brand/Section";
import { ExamplePreview } from "@/components/landing/ExamplePreview";
import { FloatingDocument } from "@/components/landing/FloatingDocument";
import { ScrollStory } from "@/components/landing/ScrollStory";
import { buttonVariants } from "@/components/ui/button";
import { getContent, getLinks, getSection, isTodo } from "@/lib/content";
import { cn } from "@/lib/utils";

// TODO(tech-a): read labels, tiers and weights from /api/rubric once rubric.json exists.
const criteria = [
  { label: "Prohibits discrimination, incl. on grounds relevant to Indigenous identity", tier: "Baseline (law)", weight: 3 },
  { label: "Indigenous-specific hiring follows Ontario Human Rights Commission guidance", tier: "Conditional", weight: 2 },
  { label: "Retention and advancement supports exist", tier: "Leading practice", weight: 1 },
];

function Placeholder({ text, className }: { text: string; className?: string }) {
  return isTodo(text) ? <Markdown className={className}>{text || "TODO(team): copy"}</Markdown> : null;
}

export default function Home() {
  const headline = getSection("landing", "Hero headline");
  const subline = getSection("landing", "Hero subline");
  const asks = [1, 2, 3].map((n) => getSection("landing", `Ask ${n}`));
  const why = getSection("landing", "Why it matters");
  const whySource = getSection("landing", "Why it matters source");
  const builtOn = getLinks("sources", "Built on");
  const learned = getContent("what-we-learned");

  return (
    <>
      {/* 1. Hero */}
      <Section tone="midnight" className="relative overflow-hidden pt-16 md:pt-24" innerClassName="relative">
        <div className="relative grid items-center gap-14 lg:grid-cols-[1.25fr_1fr]">
          <Reveal>
            <Eyebrow className="text-gold">Truth and Reconciliation Commission · Call to Action 92</Eyebrow>
            {isTodo(headline) ? (
              <Placeholder text={headline} />
            ) : (
              <h1 className="text-display max-w-[16ch]">{headline}</h1>
            )}
            {isTodo(subline) ? (
              <Placeholder text={subline} className="mt-6 max-w-xl" />
            ) : (
              <p className="mt-6 max-w-xl text-lg text-white/80">{subline}</p>
            )}
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/assess" className={buttonVariants({ variant: "gold-on-dark", size: "xl" })}>
                Start assessment
                <ArrowRight data-icon="inline-end" />
              </Link>
              <Link href="/methodology" className={buttonVariants({ variant: "outline-on-dark", size: "xl" })}>
                How scoring works
              </Link>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-white/65">
              <ShieldCheck className="size-4 text-gold" aria-hidden />
              Processed in memory, never stored. Not legal advice.
            </p>
          </Reveal>
          <Reveal className="relative flex justify-center pt-16 lg:justify-end lg:pt-20">
            {/* Policy in, report out: the document sits behind the report it produces */}
            <div className="relative w-full max-w-sm">
              <FloatingDocument className="absolute -top-20 -left-24 hidden w-[15rem] sm:block lg:-left-32 lg:w-[17rem]" />
              <ExamplePreview className="relative z-10 bg-midnight bg-[linear-gradient(rgb(255_255_255/0.06),rgb(255_255_255/0.06))] shadow-2xl shadow-black/40" />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* 2. What CTA 92 asks */}
      <Section>
        <Reveal className="max-w-2xl">
          <Eyebrow>What Call to Action 92 asks</Eyebrow>
          <h2 className="text-4xl md:text-5xl">The three asks</h2>
        </Reveal>
        <ol className="mt-14 grid gap-5 md:grid-cols-3">
          {asks.map((ask, i) => (
            <li key={i}>
              <Reveal className="h-full">
                <div className="flex h-full flex-col rounded-2xl border bg-card p-7 transition-shadow hover:shadow-lg hover:shadow-midnight/5">
                  <span className="font-heading text-6xl leading-none text-gold-edge" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Markdown className="mt-6 text-ink">{ask || "TODO(team): copy"}</Markdown>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </Section>

      {/* 3. How it works */}
      <Section tone="surface" id="how-it-works">
        <Reveal className="max-w-2xl">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="text-4xl md:text-5xl">From policy to report in under a minute</h2>
          <p className="mt-5 text-lg text-muted-foreground">
            The AI only finds evidence. Code verifies every quote and does the scoring, so every score traces back to
            a sentence in your policy.
          </p>
        </Reveal>
        <div className="mt-6">
          <ScrollStory />
        </div>

        <Reveal className="mt-16">
          <h3 className="text-2xl md:text-3xl">What it checks</h3>
          <ul className="mt-6 divide-y overflow-hidden rounded-2xl bg-card ring-1 ring-border">
            {criteria.map((c) => (
              <li key={c.label} className="grid gap-2 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
                <span className="font-heading text-xl text-midnight">{c.label}</span>
                <span className="flex items-center gap-2 text-sm">
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-midnight">{c.tier}</span>
                  <span className="rounded-full bg-midnight px-2.5 py-1 font-medium text-white">×{c.weight}</span>
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>

      {/* 4. Built on */}
      <section aria-label="Built on" className="border-y bg-background">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-6 sm:px-6">
          <span className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">Built on</span>
          {builtOn.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="font-heading text-xl text-midnight underline-offset-4 hover:underline hover:decoration-gold-edge"
            >
              {s.label}
            </a>
          ))}
        </div>
      </section>

      {/* 5. Why it matters */}
      <Section tone="midnight" className="relative overflow-hidden" innerClassName="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-40 -left-8 font-heading text-[18rem] leading-none text-white/[0.04] select-none md:-top-56 md:text-[28rem]"
        >
          92
        </span>
        <Reveal className="relative mx-auto max-w-3xl text-center">
          <Eyebrow className="text-gold">Why it matters</Eyebrow>
          {isTodo(why) ? (
            <Placeholder text={why} />
          ) : (
            <blockquote className="font-heading text-3xl leading-tight text-balance md:text-5xl">{why}</blockquote>
          )}
          {whySource && <Markdown className="mt-6 text-sm text-white/70 [&_a]:text-white">{whySource}</Markdown>}
        </Reveal>
      </Section>

      {/* 6. What we learned */}
      <Section>
        <div className="grid gap-10 md:grid-cols-[1fr_2fr] md:gap-16">
          <Reveal className="md:sticky md:top-28 md:self-start">
            <Eyebrow>Our learning</Eyebrow>
            <h2 className="text-4xl md:text-5xl">What we learned</h2>
          </Reveal>
          <Reveal>
            <Markdown className="text-lg [&_h3]:border-t [&_h3]:pt-8 [&_h3:first-child]:border-0 [&_h3:first-child]:pt-0">
              {learned || "TODO(team): What we learned, with citations."}
            </Markdown>
          </Reveal>
        </div>
      </Section>

      {/* 7. Closing CTA */}
      <Section tone="surface" className="py-20 md:py-24">
        <Reveal className="flex flex-col items-start justify-between gap-8 rounded-3xl bg-card p-8 ring-1 ring-border md:flex-row md:items-center md:p-12">
          <div>
            <h2 className="text-3xl md:text-4xl">See where your policy stands.</h2>
            <p className="mt-3 text-muted-foreground">About two minutes. Nothing is stored.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/assess" className={buttonVariants({ variant: "gold", size: "xl" })}>
              Start assessment
              <ArrowRight data-icon="inline-end" />
            </Link>
            <Link
              href="/assess"
              className={cn("font-medium text-midnight underline decoration-gold-edge decoration-2 underline-offset-4")}
            >
              Try a sample policy
            </Link>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
