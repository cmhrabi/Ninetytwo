// Server-only: reads team-written copy from content/*.md. Never import from a "use client" file.
// Reads are synchronous so pages prerender statically under cacheComponents.
import { readFileSync } from "node:fs";
import path from "node:path";
import { RubricSchema, type Rubric } from "@/shared";
import rubricJson from "../../rubric/rubric.json";

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

/**
 * Body under `## <heading>` up to the next heading of the same level (case-insensitive).
 * Pass `level: 3` for `### ` sections. Missing → "".
 */
export function getSection(file: ContentFile, heading: string, level: 2 | 3 = 2): string {
  const md = getContent(file);
  const parts = md.split(new RegExp(`^#{${level}}\\s+`, "m")).slice(1);
  const hit = parts.find((p) => p.split("\n")[0].trim().toLowerCase() === heading.toLowerCase());
  return hit ? hit.slice(hit.indexOf("\n") + 1).trim() : "";
}

/**
 * Whole file minus one section (its heading and body, up to the next heading of the same level).
 * Lets a page lay out e.g. a `### Sources` list separately from the rest of the copy.
 */
export function getContentWithout(file: ContentFile, heading: string, level: 2 | 3 = 2): string {
  const md = getContent(file);
  const hashes = "#".repeat(level);
  const start = new RegExp(`^${hashes}\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "im").exec(md);
  if (!start) return md;
  const rest = md.slice(start.index + start[0].length);
  const next = new RegExp(`^${hashes}\\s`, "m").exec(rest);
  return (md.slice(0, start.index) + (next ? rest.slice(next.index) : "")).trim();
}

/** Markdown links `[label](url)` in a section, in order. */
export function getLinks(file: ContentFile, heading: string): { label: string; href: string }[] {
  return [...getSection(file, heading).matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)].map((m) => ({
    label: m[1],
    href: m[2],
  }));
}

/**
 * A single source in a section, written either as a markdown link `[label](url)`
 * or as a label line followed by a bare URL line. Missing or placeholder → null.
 */
export function getSource(file: ContentFile, heading: string): { label: string; href: string } | null {
  const [link] = getLinks(file, heading);
  if (link) return link;
  const lines = getSection(file, heading).split("\n").map((l) => l.trim()).filter(Boolean);
  const href = lines.find((l) => /^https?:\/\/\S+$/.test(l));
  if (!href) return null;
  return { label: lines.find((l) => l !== href) ?? href, href };
}

/** True when copy is still a team placeholder. */
export const isTodo = (text: string) => !text || text.trimStart().startsWith("TODO(team)");


/** rubric/rubric.json, validated. Bundled at build time, so pages that use it prerender statically. */
export function getRubric(): Rubric {
  return RubricSchema.parse(rubricJson);
}
