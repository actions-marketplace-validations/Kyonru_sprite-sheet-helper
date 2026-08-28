import type { ComponentProps } from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * Tabs at rail scale.
 *
 * The shadcn defaults are sized for a page (`h-9`, `text-sm`); inside a 320px
 * column they read as the loudest thing on screen. These wrappers pull them
 * down to the same 11–12px scale the panel headers and sections use, so a tab
 * strip is navigation rather than a headline.
 */
export function PanelTabsList({
  className,
  ...props
}: ComponentProps<typeof TabsList>) {
  return (
    <TabsList
      className={cn("h-7 w-full shrink-0 rounded-md p-[2px]", className)}
      {...props}
    />
  );
}

export function PanelTabsTrigger({
  className,
  ...props
}: ComponentProps<typeof TabsTrigger>) {
  return (
    <TabsTrigger
      className={cn(
        "h-full px-2 text-xs font-medium [&_svg:not([class*='size-'])]:size-3.5",
        className,
      )}
      {...props}
    />
  );
}
