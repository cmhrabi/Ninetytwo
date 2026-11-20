import type { Metadata } from "next";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { Monogram, Wordmark } from "@/components/brand/Wordmark";
import { QuoteMark } from "@/components/brand/QuoteMark";
import { ScoreRing } from "@/components/brand/ScoreRing";
import { Eyebrow, Section } from "@/components/brand/Section";
import { StatusChip } from "@/components/brand/StatusChip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Design system · NinetyTwo",
  robots: { index: false, follow: false },
};

// Contrast ratios computed with the WCAG 2 formula. AA: 4.5 body text, 3.0 large text and graphics.
const colours = [
  { name: "Midnight", token: "midnight", hex: "#29275A", use: "Hero and report panels, primary, text on gold", swatch: "bg-midnight", text: "text-white", ratio: "White 13.7 · Gold 8.6" },
  { name: "Indigo", token: "indigo", hex: "#4F4E7E", use: "Secondary text, chart track", swatch: "bg-indigo", text: "text-white", ratio: "On white 7.7" },
  { name: "Gold", token: "gold", hex: "#FFC419", use: "One CTA per view, score ring, selection", swatch: "bg-gold", text: "text-midnight", ratio: "Midnight on gold 8.6 · on white 1.6, needs edge" },
  { name: "Gold edge", token: "gold-edge", hex: "#A87800", use: "Border on gold over white, quote underline", swatch: "bg-gold-edge", text: "text-white", ratio: "On white 3.9: borders and graphics only" },
  { name: "Gold wash", token: "gold-wash", hex: "#FFF3CC", use: "Background of verified quotes", swatch: "bg-gold-wash", text: "text-ink", ratio: "Ink on wash 16.0" },
  { name: "Ink", token: "ink", hex: "#16152F", use: "Body text", swatch: "bg-ink", text: "text-white", ratio: "On white 17.8" },
  { name: "Surface", token: "surface", hex: "#F6F5FA", use: "Alternate section background", swatch: "bg-surface", text: "text-ink", ratio: "Indigo on surface 7.1" },
  { name: "Midnight deep", token: "midnight-deep", hex: "#1C1A44", use: "Footer", swatch: "bg-midnight-deep", text: "text-white", ratio: "White 16.4" },
];

const statuses = [
  { status: "Addressed" as const, ratio: "5.7" },
  { status: "Partly addressed" as const, ratio: "5.4 (burnt orange, never gold)" },
  { status: "Not found" as const, ratio: "6.1" },
  { status: "Not applicable" as const, ratio: "6.6" },
];

const typeScale = [
  { name: "Display", className: "text-display font-heading", sample: "Ninety Two", spec: "Instrument Serif · clamp(44px, 7vw, 72px)" },
  { name: "H1", className: "font-heading text-5xl", sample: "Report", spec: "Instrument Serif · 48px" },
  { name: "H2", className: "font-heading text-4xl", sample: "How it works", spec: "Instrument Serif · 36px" },
  { name: "H3", className: "font-heading text-2xl", sample: "What it checks", spec: "Instrument Serif · 24px" },
  { name: "Body", className: "text-[17px]", sample: "Code verifies every quote and does the scoring.", spec: "Geist · 17px / 1.6" },
  { name: "Small", className: "text-sm text-muted-foreground", sample: "Processed in memory, never stored.", spec: "Geist · 14px" },
  { name: "Eyebrow", className: "text-sm font-medium tracking-[0.14em] uppercase text-muted-foreground", sample: "Methodology", spec: "Geist · 14px · tracked caps" },
];

function Block({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-6 border-t py-12 md:grid-cols-[14rem_1fr]">
      <div>
        <h2 className="text-3xl">{title}</h2>
        {note && <p className="mt-2 text-sm text-muted-foreground">{note}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default function DesignPage() {
  return (
    <>
      <Section tone="midnight" className="py-16 md:py-20">
        <Eyebrow className="text-gold">Design system</Eyebrow>
        <h1 className="text-display">Midnight and gold</h1>
        <p className="mt-4 max-w-2xl text-white/80">
          Tokens and components for NinetyTwo. Text on gold is always midnight. Gold on white gets a darker gold edge.
          Gold on midnight needs none. Status never relies on colour alone.
        </p>
      </Section>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <Block title="Colour" note="Tailwind classes: bg-<token>, text-<token>, border-<token>.">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {colours.map((c) => (
              <li key={c.token} className="overflow-hidden rounded-2xl ring-1 ring-border">
                <div className={`${c.swatch} ${c.text} flex h-24 items-end p-3 font-mono text-sm`}>{c.hex}</div>
                <div className="space-y-1 p-3 text-sm">
                  <p className="font-semibold text-midnight">
                    {c.name} <code className="font-mono text-xs font-normal text-muted-foreground">{c.token}</code>
                  </p>
                  <p className="text-muted-foreground">{c.use}</p>
                  <p className="text-xs text-indigo">Contrast: {c.ratio}</p>
                </div>
              </li>
            ))}
          </ul>
        </Block>

        <Block title="Type" note="Instrument Serif for headings, Geist for everything else.">
          <ul className="space-y-6">
            {typeScale.map((t) => (
              <li key={t.name} className="grid gap-1 sm:grid-cols-[6rem_1fr] sm:items-baseline">
                <span className="text-xs font-medium text-muted-foreground uppercase">{t.name}</span>
                <div className="min-w-0">
                  <p className={t.className}>{t.sample}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{t.spec}</p>
                </div>
              </li>
            ))}
          </ul>
        </Block>

        <Block title="Brand" note="Wordmark and 92 monogram.">
          <div className="flex flex-wrap items-center gap-6">
            <Wordmark />
            <span className="rounded-xl bg-midnight p-3">
              <Wordmark tone="dark" />
            </span>
            <Monogram className="size-14 rounded-2xl text-3xl" />
          </div>
        </Block>

        <Block title="Buttons" note="One gold button per view. Use buttonVariants() on a Link for navigation.">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl p-6 ring-1 ring-border">
              <Button variant="gold" size="xl">
                Start assessment <ArrowRight data-icon="inline-end" />
              </Button>
              <Button variant="gold">Gold</Button>
              <Button>Primary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-midnight p-6">
              <Button variant="gold-on-dark" size="xl">
                Start assessment <ArrowRight data-icon="inline-end" />
              </Button>
              <Button variant="gold-on-dark">Gold on dark</Button>
              <Button variant="outline-on-dark">Outline on dark</Button>
            </div>
          </div>
        </Block>

        <Block title="Status" note="Icon and label on a tint. Ratios are text on its tint.">
          <ul className="flex flex-wrap gap-4">
            {statuses.map((s) => (
              <li key={s.status} className="space-y-2">
                <StatusChip status={s.status} />
                <p className="text-xs text-muted-foreground">{s.ratio}</p>
              </li>
            ))}
          </ul>
        </Block>

        <Block title="Score ring" note="Sample targets: Weak 38, Partial 58, Strong 100.">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-wrap gap-6 rounded-2xl bg-midnight p-6">
              <ScoreRing value={38} label="Emerging" size={128} />
              <ScoreRing value={58} label="Developing" size={128} />
              <ScoreRing value={100} label="Leading" size={128} />
            </div>
            <ScoreRing value={58} label="Developing" size={128} tone="light" />
          </div>
        </Block>

        <Block title="Evidence" note="A quote verified in the document.">
          <blockquote className="max-w-2xl rounded-2xl bg-card p-6 text-lg ring-1 ring-border">
            The company does not discriminate in hiring.{" "}
            <QuoteMark>Indigenous identity is a protected ground under this policy</QuoteMark>, and complaints are
            handled by People &amp; Culture.
            <footer className="mt-3 text-sm text-muted-foreground">Paragraph p4 · Example text</footer>
          </blockquote>
        </Block>

        <Block title="Warning" note="Baseline warning, shown above the score whatever the percentage.">
          <div
            role="alert"
            className="flex max-w-2xl gap-3 rounded-2xl border border-status-notfound/25 bg-status-notfound-bg p-4 text-status-notfound"
          >
            <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">Baseline warning</p>
              <p className="text-sm">Example: Prohibits discrimination scored 0. A legal baseline is not met.</p>
            </div>
          </div>
        </Block>

        <Block title="Cards" note="shadcn Card with brand radius.">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3">
                  <span>Prohibits discrimination</span>
                  <StatusChip status="Addressed" />
                </CardTitle>
                <CardDescription>Baseline (law) · weight ×3</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Card body.</CardContent>
            </Card>
            <Card className="opacity-60">
              <CardHeader>
                <CardTitle>Coming next</CardTitle>
                <CardDescription>Greyed card for criteria not yet assessed.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </Block>

        <Block title="Sections" note="Section tone: light, surface, midnight.">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-background p-6 ring-1 ring-border">light</div>
            <div className="rounded-2xl bg-surface p-6 ring-1 ring-border">surface</div>
            <div className="rounded-2xl bg-midnight p-6 text-white">midnight</div>
          </div>
          <Separator className="my-8" />
          <p className="text-sm text-muted-foreground">
            Rhythm: py-24 md:py-32 · width max-w-6xl · gutter 16px on phones · radius 14px base.
          </p>
        </Block>
      </div>
    </>
  );
}
