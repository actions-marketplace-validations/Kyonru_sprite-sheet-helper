import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PanelEmptyProps = {
  icon: LucideIcon;
  /** The state, stated flatly — "No frames captured", not "Nothing here yet!". */
  title: string;
  /** One line on what would fill it. */
  description?: string;
  /**
   * Draw a dashed outline. For an empty that stands in for a specific artefact
   * — the atlas map, a preview — so the reader sees the shape of the missing
   * thing. A panel-filling empty gets no box; there is nothing to outline.
   */
  boxed?: boolean;
  /** Optional call to action. */
  children?: ReactNode;
  className?: string;
};

/** The one way this app says "nothing here", in every rail. */
export function PanelEmpty({
  icon: Icon,
  title,
  description,
  boxed = false,
  children,
  className,
}: PanelEmptyProps) {
  return (
    <div
      className={cn(
        "grid content-center justify-items-center px-6 text-center",
        boxed ? "rounded-md border border-dashed px-3 py-6" : "h-full py-8",
        className,
      )}
    >
      <Icon size={18} className="text-muted-foreground/60" />
      <p className="mt-2 text-xs font-medium">{title}</p>
      {description ? (
        <p className="mt-1 max-w-[26ch] text-pretty text-[11px] text-muted-foreground">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
