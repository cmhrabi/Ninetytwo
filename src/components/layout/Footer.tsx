import Link from "next/link";
import { Markdown } from "@/components/Markdown";
import { Wordmark } from "@/components/brand/Wordmark";
import { getContent } from "@/lib/content";

export function Footer() {
  const acknowledgement = getContent("acknowledgement");
  return (
    <footer className="border-t border-white/10 bg-midnight-deep text-white/75">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1fr_2fr]">
        <div className="space-y-4">
          <Wordmark tone="dark" />
          <p className="text-sm">Not legal advice. Documents are processed in memory and never stored.</p>
        </div>
        <div className="space-y-6">
          {acknowledgement && <Markdown className="text-sm">{acknowledgement}</Markdown>}
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/assess" className="hover:text-white">Assess a policy</Link>
            <Link href="/methodology" className="hover:text-white">Methodology & Sources</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
