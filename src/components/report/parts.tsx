"use client";

import { ExternalLink } from "lucide-react";
import type { Link } from "@/shared";
import { cn } from "@/lib/utils";
import { useEvidence } from "./EvidenceContext";
import { isTodo } from "./format";

const chipClass =
  "inline-flex shrink-0 items-center rounded-md bg-surface px-1.5 py-0.5 font-mono text-xs text-indigo ring-1 ring-border";

/** Paragraph chip (p7). Inside a report it opens the evidence viewer at that paragraph. */
export function ParagraphChip({ id }: { id: string }) {
  const evidence = useEvidence();
  if (!evidence) return <span className={chipClass}>{id}</span>;
  return (
    <button
      type="button"
      onClick={(e) => evidence.openAt(id, e.currentTarget)}
      aria-label={`Show paragraph ${id.replace(/^p/, "")} in the document`}
      className={cn(
        chipClass,
        "cursor-pointer transition-colors hover:bg-gold-wash hover:ring-gold-edge/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
      )}
    >
      {id}
    </button>
  );
}

/** A verified quote with its paragraph chip. Inside a report, clicking the quote shows it in the document. */
export function Quote({ quote, paragraphId, tone = "default" }: { quote: string; paragraphId: string; tone?: "default" | "flag" }) {
  const evidence = useEvidence();
  const text = <>&ldquo;{quote}&rdquo;</>;
  return (
    <blockquote
      className={cn(
        "flex items-start gap-2 border-l-2 py-0.5 pl-3 text-sm",
        tone === "flag" ? "border-midnight text-midnight" : "border-gold-edge/60 text-ink",
      )}
    >
      {evidence ? (
        <button
          type="button"
          onClick={(e) => evidence.openAt(paragraphId, e.currentTarget)}
          className="min-w-0 flex-1 cursor-pointer rounded-sm text-left italic underline decoration-current/0 underline-offset-4 transition-colors hover:decoration-current/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {text}
          <span className="sr-only"> (show in the document)</span>
        </button>
      ) : (
        <span className="min-w-0 flex-1 italic">{text}</span>
      )}
      <ParagraphChip id={paragraphId} />
    </blockquote>
  );
}

/** Team-written copy from rubric.json. TODO(team) placeholders are shown as they are, but muted. */
export function TeamCopy({ text, className }: { text: string; className?: string }) {
  return <p className={cn("text-sm", isTodo(text) && "text-xs italic text-muted-foreground", className)}>{text}</p>;
}

export function LinkList({ links, className }: { links: Link[]; className?: string }) {
  if (links.length === 0) return null;
  return (
    <ul className={cn("space-y-1.5", className)}>
      {links.map((l) => (
        <li key={l.url}>
          <a
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="print-url inline-flex items-start gap-1.5 text-sm text-midnight underline decoration-gold-edge/50 underline-offset-4 hover:decoration-gold-edge"
          >
            <span>{l.title}</span>
            <ExternalLink className="mt-1 size-3 shrink-0 print:hidden" aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function ColumnHeading({ children }: { children: React.ReactNode }) {
  return <h4 className="mb-3 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">{children}</h4>;
}
