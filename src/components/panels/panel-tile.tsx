import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PanelTileProps = {
  /** Uppercase micro-title. Omit for a tile that is only an action. */
  title?: string;
  /** Right-aligned readout — a count, a size, a state. */
  hint?: ReactNode;
  /**
   * Raise the tile a step up the tonal ladder. Depth here is tone, never a
   * shadow: a shadow beside the artwork softens edges the user is judging.
   */
  raised?: boolean;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

/**
 * The unit of structure in a rail.
 *
 * Replaces the bordered-card-per-section pattern: sections are separated by
 * tone and a hairline, so eight of them read as one system rather than eight
 * competing things.
 */
export function PanelTile({
  title,
  hint,
  raised = false,
  children,
  className,
  bodyClassName,
}: PanelTileProps) {
  return (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-lg border border-stroke p-2",
        raised ? "bg-surface-high" : "bg-card",
        className,
      )}
    >
      {title ? (
        <div className="mb-[7px] flex items-baseline gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
          {hint ? (
            <span className="ml-auto truncate font-mono text-[10px] text-faint-foreground tabular-nums">
              {hint}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className={cn("flex min-h-0 flex-1 flex-col", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
