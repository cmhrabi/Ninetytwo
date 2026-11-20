"use client";

import { Eyebrow, Section } from "@/components/brand/Section";
import { useAssessment } from "@/state/assessment";
import { ConsentBox } from "./ConsentBox";
import { DocTypeSelect } from "./DocTypeSelect";
import { HealthNotice } from "./HealthNotice";
import { Dropzone } from "./Dropzone";
import { LoadError } from "./LoadError";
import { RunButton } from "./RunButton";
import { SampleCards } from "./SampleCards";

/** Assess setup screen: document type → document → consent and run. */
export function AssessSetup() {
  return (
    <>
      <Section tone="midnight" className="py-14 md:py-20">
        <Eyebrow className="text-gold">Assess</Eyebrow>
        <h1 className="text-display max-w-[18ch]">Assess an internal policy</h1>
        <p className="mt-4 max-w-2xl text-white/80">
          Upload your policy or try a fictional sample. NinetyTwo marks the passages that matter, checks every quote
          against your document, and scores it against Call to Action 92.
        </p>
      </Section>
      <StepsLayout />
    </>
  );
}

function StepsLayout() {
  const { state } = useAssessment();
  return (
    <Section className="py-12 md:py-16" innerClassName="max-w-3xl">
      <HealthNotice />
      <ol className="space-y-12">
        <Step n={1} title="Document type">
          <DocTypeSelect value={state.docType} />
        </Step>
        <Step n={2} title="Your document">
          <Dropzone />
          <Divider>or try a fictional sample</Divider>
          <SampleCards />
          <LoadError className="mt-4" />
        </Step>
        <Step n={3} title="Consent and run">
          <ConsentBox />
          <RunButton className="mt-6" />
        </Step>
      </ol>
    </Section>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="grid gap-4 sm:grid-cols-[2.5rem_1fr] sm:gap-6">
      <span
        aria-hidden
        className="flex size-10 items-center justify-center rounded-full bg-midnight font-heading text-xl text-white"
      >
        {n}
      </span>
      <div className="min-w-0">
        <h2 className="mb-4 text-2xl sm:mt-1">
          <span className="sr-only">Step {n}: </span>
          {title}
        </h2>
        {children}
      </div>
    </li>
  );
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 flex items-center gap-4 text-sm text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      {children}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
