import { CircleCheck, CircleDashed, CircleMinus, CircleX } from "lucide-react";
import { cn } from "@/lib/utils";

// TODO(tech-a): replace with `import type { Status } from "@/shared"` once phase 01 adds the contract.
type Status = "Addressed" | "Partly addressed" | "Not found" | "Not applicable";

const styles: Record<Status, { className: string; Icon: typeof CircleCheck }> = {
  Addressed: { className: "bg-status-addressed-bg text-status-addressed", Icon: CircleCheck },
  "Partly addressed": { className: "bg-status-partly-bg text-status-partly", Icon: CircleDashed },
  "Not found": { className: "bg-status-notfound-bg text-status-notfound", Icon: CircleX },
  "Not applicable": { className: "bg-status-na-bg text-status-na", Icon: CircleMinus },
};

/** Criterion status chip. Icon + label, so status never relies on colour alone. */
export function StatusChip({ status, className }: { status: Status; className?: string }) {
  const { className: tone, Icon } = styles[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm leading-none font-medium whitespace-nowrap",
        tone,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {status}
    </span>
  );
}
