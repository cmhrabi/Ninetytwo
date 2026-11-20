// Server-only: reads team-written copy from content/*.md. Never import from a "use client" file.
// Reads are synchronous so pages prerender statically under cacheComponents.
import { readFileSync } from "node:fs";
import path from "node:path";

export type ContentFile = "landing" | "what-we-learned" | "data-note" | "sources" | "acknowledgement";

const stripComments = (md: string) => md.replace(/<!--[\s\S]*?-->/g, "");

/** Whole file as markdown (HTML comments removed). Missing file → "". */
export function getContent(file: ContentFile): string {
  try {
    return stripComments(readFileSync(path.join(process.cwd(), "content", `${file}.md`), "utf8")).trim();
  } catch {
    return "";
  }
}

/** Body under `## <heading>` up to the next `## ` heading (case-insensitive). Missing → "". */
export function getSection(file: ContentFile, heading: string): string {
  const md = getContent(file);
  const parts = md.split(/^##\s+/m).slice(1);
  const hit = parts.find((p) => p.split("\n")[0].trim().toLowerCase() === heading.toLowerCase());
  return hit ? hit.slice(hit.indexOf("\n") + 1).trim() : "";
}

/** Markdown links `[label](url)` in a section, in order. */
export function getLinks(file: ContentFile, heading: string): { label: string; href: string }[] {
  return [...getSection(file, heading).matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)].map((m) => ({
    label: m[1],
    href: m[2],
  }));
}

/** True when copy is still a team placeholder. */
export const isTodo = (text: string) => !text || text.trimStart().startsWith("TODO(team)");
