import { cn } from "@/lib/utils";

/** A quote found in the document: pale gold wash with a darker gold underline. */
export function QuoteMark({ className, ...props }: React.ComponentProps<"mark">) {
  return (
    <mark
      className={cn(
        "rounded-sm bg-gold-wash px-0.5 text-inherit underline decoration-gold-edge decoration-2 underline-offset-4 [box-decoration-break:clone]",
        className,
      )}
      {...props}
    />
  );
}
