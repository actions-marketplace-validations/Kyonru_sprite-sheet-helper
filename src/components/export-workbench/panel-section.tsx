import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type PanelSectionProps = {
  title: string;
  /** Right-aligned summary, so a collapsed section still reports its state. */
  hint?: ReactNode;
  defaultOpen?: boolean;
  /**
   * Keep children mounted while collapsed. Needed when a section owns effects
   * the rest of the app relies on — SequencePreview clamps `selectedRow`, which
   * `use-export` reads when adding a frame to a row.
   */
  keepMounted?: boolean;
  /**
   * Reveal the section the first time this turns true — capturing a first
   * sequence should surface the preview, the way it did before it lived behind
   * a disclosure. Only fires once, so a later collapse stays collapsed.
   */
  autoOpenOn?: boolean;
  children: ReactNode;
};

/**
 * One disclosure in the export rail.
 *
 * Sections are separated by tone and space rather than boxed in borders — in a
 * 320px column, eight bordered cards read as eight competing things.
 */
export function PanelSection({
  title,
  hint,
  defaultOpen = false,
  keepMounted = false,
  autoOpenOn,
  children,
}: PanelSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const autoOpened = useRef(false);

  useEffect(() => {
    if (!autoOpenOn || autoOpened.current) return;
    autoOpened.current = true;
    setOpen(true);
  }, [autoOpenOn]);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-t">
      <CollapsibleTrigger
        className={cn(
          "group flex w-full items-center gap-1.5 px-3 py-2.5 text-left",
          "transition-colors hover:bg-muted/50",
          "focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-[3px]",
        )}
      >
        <ChevronRight
          size={13}
          className={cn(
            "shrink-0 text-muted-foreground transition-transform duration-150",
            open && "rotate-90",
          )}
        />
        <span className="text-xs font-medium">{title}</span>
        {hint ? (
          <span className="ml-auto truncate text-[11px] text-muted-foreground tabular-nums">
            {hint}
          </span>
        ) : null}
      </CollapsibleTrigger>
      <CollapsibleContent
        forceMount={keepMounted || undefined}
        className={cn(
          "overflow-hidden",
          keepMounted
            ? "data-[state=closed]:hidden"
            : "data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down",
        )}
      >
        <div className="px-3 pb-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * A labelled row of controls inside a section — the unit of grouping that keeps
 * timing, size, and framing from reading as one undifferentiated grid.
 */
export function ControlGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}
