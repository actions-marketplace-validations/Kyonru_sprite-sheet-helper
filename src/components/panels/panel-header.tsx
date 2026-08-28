import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PanelHeaderProps = {
  icon: LucideIcon;
  title: string;
  /**
   * Right-aligned readout — a count, a size, a state. Replaces the subtitle
   * line the panels used to carry: in a rail this narrow, a second line of
   * prose costs more vertical space than the fact is worth.
   */
  hint?: ReactNode;
  /** Trailing icon actions, kept to the right of the hint. */
  children?: ReactNode;
  className?: string;
};

/**
 * The top row of a panel, shared by every rail so the two sides of the app
 * start on the same baseline.
 *
 * Fixed at `min-h-9` rather than sized by its contents: a header that grows
 * when a hint appears makes the left and right rails disagree by a few pixels,
 * which reads as misalignment long before anyone can name it.
 */
export function PanelHeader({
  icon: Icon,
  title,
  hint,
  children,
  className,
}: PanelHeaderProps) {
  return (
    <header
      className={cn(
        "flex min-h-9 shrink-0 items-center gap-2 px-3 py-2",
        className,
      )}
    >
      <Icon size={15} className="shrink-0 text-muted-foreground" />
      <h2 className="truncate text-xs font-semibold tracking-wide">{title}</h2>
      {hint ? (
        <span className="ml-auto shrink-0 truncate text-[11px] text-muted-foreground tabular-nums">
          {hint}
        </span>
      ) : null}
      {children ? (
        <div
          className={cn(
            "flex shrink-0 items-center gap-0.5",
            hint ? "-mr-1" : "-mr-1 ml-auto",
          )}
        >
          {children}
        </div>
      ) : null}
    </header>
  );
}
