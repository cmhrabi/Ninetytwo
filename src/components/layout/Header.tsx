import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/assess", label: "Assess" },
  { href: "/methodology", label: "Methodology & Sources" },
];

/**
 * Sticky midnight header. Landing and Report open on midnight panels, so it reads as one surface.
 * The header CTA is an outline: the page's one gold button lives in the hero.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-midnight text-white print:hidden">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="NinetyTwo home" className="rounded-lg focus-visible:ring-3 focus-visible:ring-gold/50 focus-visible:outline-none">
          <Wordmark tone="dark" />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hidden rounded-full px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/assess" className={cn(buttonVariants({ variant: "outline-on-dark", size: "sm" }), "rounded-full px-3")}>
            Start assessment
            <ArrowRight data-icon="inline-end" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
