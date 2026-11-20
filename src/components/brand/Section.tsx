import { cn } from "@/lib/utils";

type Tone = "light" | "surface" | "midnight";

const tones: Record<Tone, string> = {
  light: "bg-background text-foreground",
  surface: "bg-surface text-foreground",
  midnight: "bg-midnight text-white [--muted-foreground:rgb(255_255_255/0.72)]",
};

/** Page section: full-bleed background, centred max-w-6xl content, 16px gutter on phones. */
export function Section({
  tone = "light",
  className,
  innerClassName,
  children,
  ...props
}: React.ComponentProps<"section"> & { tone?: Tone; innerClassName?: string }) {
  return (
    <section data-tone={tone} className={cn("py-24 md:py-32", tones[tone], className)} {...props}>
      <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", innerClassName)}>{children}</div>
    </section>
  );
}

/** Small uppercase label above a section heading. */
export function Eyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("mb-4 text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase", className)}
      {...props}
    />
  );
}
