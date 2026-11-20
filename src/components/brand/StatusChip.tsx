import { CircleCheck, CircleDashed, CircleMinus, CircleX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Status } from "@/shared";

/**
 * Brand palette only. Status reads from fill weight plus icon, never colour alone:
 * Addressed = solid midnight, Partly = gold wash, Not found = outline, Not applicable = muted.
 */
const styles: Record<Status, { className: string; iconClassName: string; Icon: typeof CircleCheck }> = {
  Addressed: { className: "bg-midnight text-white", iconClassName: "text-gold", Icon: CircleCheck },
  "Partly addressed": {
    className: "bg-gold-wash text-midnight ring-1 ring-gold-edge/40",
    iconClassName: "text-gold-edge",
    Icon: CircleDashed,
  },
  "Not found": { className: "bg-white text-midnight ring-1 ring-midnight/25", iconClassName: "text-indigo", Icon: CircleX },
  "Not applicable": { className: "bg-surface text-indigo", iconClassName: "text-indigo/70", Icon: CircleMinus },
};

/** Criterion status chip. Icon + label, so status never relies on colour alone. */
export function StatusChip({ status, className }: { status: Status; className?: string }) {
  const { className: tone, iconClassName, Icon } = styles[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm leading-none font-medium whitespace-nowrap",
        tone,
        className,
      )}
    >
      <Icon className={cn("size-3.5", iconClassName)} aria-hidden />
      {status}
    </span>
  );
}
