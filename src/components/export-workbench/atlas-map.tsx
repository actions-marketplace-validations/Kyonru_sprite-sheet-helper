import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { addDataToImageIfNeeded } from "@/utils/images";
import { useImagesStore } from "@/store/next/images";
import { getAtlasPageCoverage, type AtlasPlan } from "@/utils/atlas";

/** Tallest the map may get inside the rail, in px. */
const MAX_MAP_HEIGHT = 168;

type AtlasMapProps = {
  plan: AtlasPlan | null;
  frameCount: number;
  sequenceCount: number;
  /**
   * Drop the caption and coverage rows. For surfaces that already state those
   * numbers beside the map — printing them twice makes the reader check
   * whether they are two different measurements.
   */
  compact?: boolean;
  /**
   * Tallest the map may get. The rail caps it low so a square atlas cannot push
   * the controls below the fold; the export dialog has room to show it properly.
   */
  maxHeight?: number;
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
  compact = false,
  maxHeight = MAX_MAP_HEIGHT,
  className,
}: AtlasMapProps) {
  const rows = useImagesStore((state) => state.images);
  const page = plan?.pages[0] ?? null;

  const { placements, coverage, rowCount } = useMemo(() => {
    if (!plan || !page) {
      return { placements: [], coverage: 0, rowCount: 0 };
    }

    const onPage = plan.placements.filter((item) => item.page === page.index);
    const rows = new Set(onPage.map((item) => item.rowIndex));

    return {
      placements: onPage,
      coverage: getAtlasPageCoverage(plan, page.index),
      rowCount: rows.size,
    };
  }, [page, plan]);

  return (
    <div className={cn("grid gap-2", className)}>
      <div
        className={cn(
          "checkerboard relative w-full overflow-hidden rounded-md border border-stroke",
          compact ? "me-auto" : "mx-auto",
        )}
        style={{
          aspectRatio: page ? `${page.width} / ${page.height}` : "2 / 1",
          // The map is a readout, not a hero image: cap the height so a square
          // atlas cannot push the controls below the fold, and let wide pages
          // keep the full column width.
          maxWidth: `calc(${maxHeight}px * ${
            page ? page.width / page.height : 2
          })`,
        }}
      >
        {page
          ? placements.map((item) => {
              const src = rows[item.rowIndex]?.images[item.frameIndex];
              return (
                <span
                  key={`${item.rowIndex}:${item.frameIndex}`}
                  className="absolute"
                  style={{
                    left: `${(item.x / page.width) * 100}%`,
                    top: `${(item.y / page.height) * 100}%`,
                    width: `${(item.w / page.width) * 100}%`,
                    height: `${(item.h / page.height) * 100}%`,
                    // A hairline of the page colour between cells, or a full
                    // row of frames reads as one solid bar instead of a strip.
                    boxShadow: "inset 0 0 0 1px var(--stroke)",
                  }}
                >
                  {/*
                    The map shows what is actually going to be written. A grid
                    of solid blocks tells you the packing worked; the frames
                    themselves tell you whether it packed the right thing —
                    a wrong sequence or an empty capture is visible here and
                    nowhere else before export.
                  */}
                  {src ? (
                    <img
                      src={addDataToImageIfNeeded(src)}
                      alt=""
                      aria-hidden="true"
                      draggable={false}
                      className="size-full object-contain"
                      style={{ imageRendering: "pixelated" }}
                    />
                  ) : (
                    <span className="block size-full bg-primary/70" />
                  )}
                </span>
              );
            })
          : null}

        {!page && (
          <span className="absolute inset-0 grid place-items-center text-[11px] text-muted-foreground">
            No frames captured
          </span>
        )}
      </div>

      {!compact && (
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[11px] font-semibold tabular-nums">
          {page ? `${page.width}×${page.height}` : "—"}
        </span>
        <span className="font-mono text-[10px] text-faint-foreground tabular-nums">
          {sequenceCount} seq · {frameCount} frames
          {plan && plan.pages.length > 1 ? ` · ${plan.pages.length} pages` : ""}
        </span>
      </div>
      )}

      {page && !compact && (
        <div className="flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: formatPercent(coverage) }}
            />
          </div>
          <span className="font-mono text-[10px] text-faint-foreground tabular-nums">
            {formatPercent(coverage)} used
          </span>
        </div>
      )}

      {rowCount > 0 && rowCount < sequenceCount && (
        <p className="text-[10px] text-warn">
          {sequenceCount - rowCount} sequence
          {sequenceCount - rowCount === 1 ? "" : "s"} spill onto later pages.
        </p>
      )}
    </div>
  );
}
