import { cn } from "@/lib/utils";

/**
 * Fades content up as it scrolls into view, using CSS scroll-driven animation (`.reveal` in globals.css).
 * Content is visible by default: no JS, no hidden server render. Browsers without `animation-timeline`
 * or with prefers-reduced-motion simply show it.
 */
export function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("reveal", className)}>{children}</div>;
}
