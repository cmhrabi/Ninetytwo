import ReactMarkdown, { type Components } from "react-markdown";
import { cn } from "@/lib/utils";

/** Paragraphs that are still `TODO(team): ...` render as a dashed placeholder, so layout can be reviewed. */
function Paragraph({ children }: { children?: React.ReactNode }) {
  const text = typeof children === "string" ? children : Array.isArray(children) ? children.join("") : "";
  if (typeof text === "string" && text.startsWith("TODO(team)")) {
    return (
      <p className="rounded-lg border border-dashed border-current/30 px-3 py-2 text-sm italic opacity-70">
        {children}
      </p>
    );
  }
  return <p>{children}</p>;
}

const components: Components = {
  p: Paragraph,
  h2: ({ children }) => <h2 className="mt-10 text-3xl first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-8 text-2xl first:mt-0">{children}</h3>,
  a: ({ href, children }) => (
    <a
      href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noreferrer" : undefined}
      className="font-medium underline decoration-gold-edge decoration-2 underline-offset-4 hover:decoration-current"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="list-disc space-y-2 pl-5 marker:text-gold-edge">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-2 pl-5 marker:text-gold-edge">{children}</ol>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-gold pl-4 font-heading text-2xl">{children}</blockquote>
  ),
};

/** Renders team-written markdown from content/*.md with brand styles. */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("space-y-4 leading-relaxed", className)}>
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  );
}
