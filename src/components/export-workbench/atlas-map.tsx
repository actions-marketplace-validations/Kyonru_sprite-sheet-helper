import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { AtlasPlan } from "@/utils/atlas";

/**
 * Checkerboard is what transparency looks like in every sprite tool, so the map
 * reads as an image with holes in it rather than as a chart.
 */
const CHECKER =
  "repeating-conic-gradient(var(--atlas-checker) 0% 25%, transparent 0% 50%) 0 0 / 8px 8px";

/** Tallest the map may get inside the rail, in px. */
const MAX_MAP_HEIGHT = 168;

type AtlasMapProps = {
  plan: AtlasPlan | null;
  frameCount: number;
  sequenceCount: number;
  className?: string;
};

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

/**
 * A miniature of the page that is actually going to be written.
 *
 * Rows keep their capture order so a sequence is recognisable by its strip.
 * Filled cells read as solid; the checkerboard only shows through where the page
 * is genuinely unused, so waste is the thing that stands out.
 */
export function AtlasMap({
  plan,
  frameCount,
  sequenceCount,
  className,
}: AtlasMapProps) {
  const page = plan?.pages[0] ?? null;

  const { placements, coverage, rowCount } = useMemo(() => {
    if (!plan || !page) {
      return { placements: [], coverage: 0, rowCount: 0 };
    }

    const onPage = plan.placements.filter((item) => item.page === page.index);
    const filled = onPage.reduce((acc, item) => acc + item.w * item.h, 0);
    const area = page.width * page.height;
    const rows = new Set(onPage.map((item) => item.rowIndex));

    return {
      placements: onPage,
      coverage: area > 0 ? filled / area : 0,
      rowCount: rows.size,
    };
  }, [page, plan]);

  return (
    <div className={cn("grid gap-2", className)}>
      <div
        className="relative mx-auto w-full overflow-hidden rounded-md border border-border/70 bg-card"
        style={{
          aspectRatio: page ? `${page.width} / ${page.height}` : "2 / 1",
          // The map is a readout, not a hero image: cap the height so a square
          // atlas cannot push the controls below the fold, and let wide pages
          // keep the full column width.
          maxWidth: `calc(${MAX_MAP_HEIGHT}px * ${
            page ? page.width / page.height : 2
          })`,
          background: CHECKER,
          // Tuned per theme so the checker reads as texture, never as content.
          ["--atlas-checker" as string]: "color-mix(in oklch, var(--muted-foreground) 12%, transparent)",
        }}
      >
        {page
          ? placements.map((item) => (
              <span
                key={`${item.rowIndex}:${item.frameIndex}`}
                className="absolute bg-primary"
                style={{
                  left: `${(item.x / page.width) * 100}%`,
                  top: `${(item.y / page.height) * 100}%`,
                  width: `${(item.w / page.width) * 100}%`,
                  height: `${(item.h / page.height) * 100}%`,
                  // A hairline of the page colour between cells, or a full row
                  // of frames reads as one solid bar instead of a strip.
                  boxShadow: "inset 0 0 0 1px var(--background)",
                  // Later rows sit slightly back so strips stay tellable apart
                  // without introducing a second hue.
                  opacity: 0.78 + ((item.rowIndex % 4) * 0.06),
                }}
              />
            ))
          : null}

        {!page && (
          <span className="absolute inset-0 grid place-items-center text-[11px] text-muted-foreground">
            No frames captured
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-sm font-semibold tabular-nums">
          {page ? `${page.width}×${page.height}` : "—"}
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {sequenceCount} seq · {frameCount} frames
          {plan && plan.pages.length > 1 ? ` · ${plan.pages.length} pages` : ""}
        </span>
      </div>

      {page && (
        <div className="flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/60"
              style={{ width: formatPercent(coverage) }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {formatPercent(coverage)} used
          </span>
        </div>
      )}

      {rowCount > 0 && rowCount < sequenceCount && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400">
          {sequenceCount - rowCount} sequence
          {sequenceCount - rowCount === 1 ? "" : "s"} spill onto later pages.
        </p>
      )}
    </div>
  );
}
