import { TriangleAlert } from "lucide-react";

export type BannerWarning = { id: string; anchor: string; text: string; title: string };

/** Baseline warnings, shown above the score whatever the percentage. */
export function WarningBanner({ warnings }: { warnings: BannerWarning[] }) {
  if (warnings.length === 0) return null;
  return (
    <div
      role="alert"
      className="flex gap-3 rounded-2xl border border-gold-edge/40 bg-gold-wash text-midnight p-4 sm:p-5"
    >
      <TriangleAlert className="mt-0.5 size-5 shrink-0 text-gold-edge" aria-hidden />
      <div>
        <p className="font-semibold">Baseline not met</p>
        <ul className="mt-1 space-y-1 text-sm">
          {warnings.map((w) => (
            <li key={w.id}>
              <a href={`#${w.anchor}`} className="underline underline-offset-4">
                {w.text}
              </a>
              <span className="text-indigo">: {w.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
