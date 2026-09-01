import type { AtlasOptions, ExportFormat, ExportRow } from "@/types/file";
import type { SpritesheetJSON } from "./assets";
import {
  buildDirectionalAnimationGroups,
  getRowWorkflowMetadata,
} from "./export-row-metadata";

export const DEFAULT_ATLAS_OPTIONS: AtlasOptions = {
  layout: "rows",
  padding: 0,
  extrude: 0,
  scale: 1,
  maxAtlasSize: 2048,
  allowMultiPage: false,
  spriteMargin: 0,
};

export const ATLAS_EXPORT_FORMATS = new Set<ExportFormat>([
  "spritesheet",
  "love2d-lua",
  "love2d-anim8",
  "turbo",
  "bevy",
  "phaser",
  "godot",
  "pygame",
  "raylib",
  "unity",
]);

export const MULTI_PAGE_ATLAS_FORMATS = new Set<ExportFormat>(["spritesheet"]);

export type AtlasPage = {
  index: number;
  width: number;
  height: number;
};

export type AtlasPlacement = {
  rowIndex: number;
  frameIndex: number;
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  slotX: number;
  slotY: number;
  slotW: number;
  slotH: number;
};

export type AtlasPlan = {
  options: AtlasOptions;
  pages: AtlasPage[];
  placements: AtlasPlacement[];
};

export type AtlasFrameSlotSize = {
  w: number;
  h: number;
  slotW: number;
  slotH: number;
};

type PendingFrame = AtlasFrameSlotSize & {
  rowIndex: number;
  frameIndex: number;
};

type MutablePage = AtlasPage & {
  placements: AtlasPlacement[];
};

type FreeRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type MaxRectsPage = MutablePage & {
  freeRects: FreeRect[];
};

type PackAttempt = {
  pages: MutablePage[];
  /** The first frame that would not fit, when the bin was too small. */
  failedFrame?: PendingFrame;
};

type MaxRectsCandidate = {
  page: MaxRectsPage;
  rect: FreeRect;
  shortSideFit: number;
  longSideFit: number;
  areaFit: number;
};

function positiveInteger(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.round(value ?? fallback));
}

export function normalizeAtlasOptions(
  options: Partial<AtlasOptions> = {},
): AtlasOptions {
  return {
    layout: options.layout === "packed" ? "packed" : "rows",
    padding: positiveInteger(options.padding, DEFAULT_ATLAS_OPTIONS.padding),
    extrude: positiveInteger(options.extrude, DEFAULT_ATLAS_OPTIONS.extrude),
    scale:
      Number.isFinite(options.scale) && (options.scale ?? 0) > 0
        ? Number(options.scale)
        : DEFAULT_ATLAS_OPTIONS.scale,
    maxAtlasSize: Math.max(
      1,
      positiveInteger(options.maxAtlasSize, DEFAULT_ATLAS_OPTIONS.maxAtlasSize),
    ),
    allowMultiPage: Boolean(options.allowMultiPage),
    spriteMargin: positiveInteger(
      options.spriteMargin,
      DEFAULT_ATLAS_OPTIONS.spriteMargin,
    ),
  };
}

function scaledSize(value: number, scale: number): number {
  return Math.max(1, Math.round(value * scale));
}

export function getAtlasFrameSlotSize(
  row: ExportRow,
  options: Partial<AtlasOptions> = {},
): AtlasFrameSlotSize {
  const normalized = normalizeAtlasOptions(options);
  const gutter = normalized.padding + normalized.extrude;
  const margin = normalized.spriteMargin;
  // The margin is part of the frame rect, so it scales the slot too.
  const w = scaledSize(row.frameWidth, normalized.scale) + margin * 2;
  const h = scaledSize(row.frameHeight, normalized.scale) + margin * 2;

  return {
    w,
    h,
    slotW: w + gutter * 2,
    slotH: h + gutter * 2,
  };
}

function flattenRows(rows: ExportRow[], options: AtlasOptions): PendingFrame[] {
  return rows.flatMap((row, rowIndex) => {
    const { w, h, slotW, slotH } = getAtlasFrameSlotSize(row, options);

    return row.images.map((_, frameIndex) => ({
      rowIndex,
      frameIndex,
      w,
      h,
      slotW,
      slotH,
    }));
  });
}

function createPage(index: number): MutablePage {
  return {
    index,
    width: 0,
    height: 0,
    placements: [],
  };
}

function createMaxRectsPage(
  index: number,
  width: number,
  height: number,
): MaxRectsPage {
  const page = createPage(index) as MaxRectsPage;
  page.freeRects = [{ x: 0, y: 0, w: width, h: height }];
  return page;
}

function addPlacement(
  page: MutablePage,
  frame: PendingFrame,
  x: number,
  y: number,
  options: AtlasOptions,
) {
  const contentOffset = options.padding + options.extrude;
  const placement: AtlasPlacement = {
    rowIndex: frame.rowIndex,
    frameIndex: frame.frameIndex,
    page: page.index,
    x: x + contentOffset,
    y: y + contentOffset,
    w: frame.w,
    h: frame.h,
    slotX: x,
    slotY: y,
    slotW: frame.slotW,
    slotH: frame.slotH,
  };

  page.placements.push(placement);
  page.width = Math.max(page.width, x + frame.slotW);
  page.height = Math.max(page.height, y + frame.slotH);
}

function buildRowsPlan(rows: ExportRow[], options: AtlasOptions): AtlasPlan {
  const pages = [createPage(0)];
  let page = pages[0];

  if (!options.allowMultiPage) {
    let y = 0;
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const rowFrames = flattenRows([rows[rowIndex]], options).map(
        (frame) => ({
          ...frame,
          rowIndex,
        }),
      );
      let x = 0;
      let rowHeight = 0;
      for (const frame of rowFrames) {
        addPlacement(page, frame, x, y, options);
        x += frame.slotW;
        rowHeight = Math.max(rowHeight, frame.slotH);
      }
      y += rowHeight;
    }
  } else {
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const rowFrames = flattenRows([rows[rowIndex]], options).map((frame) => ({
        ...frame,
        rowIndex,
      }));
      let x = 0;
      let y = page.height;
      let shelfHeight = 0;

      for (const frame of rowFrames) {
        if (x > 0 && x + frame.slotW > options.maxAtlasSize) {
          x = 0;
          y += shelfHeight;
          shelfHeight = 0;
        }

        if (
          page.placements.length > 0 &&
          y + frame.slotH > options.maxAtlasSize
        ) {
          page = createPage(pages.length);
          pages.push(page);
          x = 0;
          y = 0;
          shelfHeight = 0;
        }

        addPlacement(page, frame, x, y, options);
        x += frame.slotW;
        shelfHeight = Math.max(shelfHeight, frame.slotH);
      }
    }
  }

  return finishPlan(pages, options);
}

/**
 * Frames laid out in shelves of a fixed width.
 *
 * Frames arrive sorted tallest-first, so each shelf is only as tall as its
 * first frame and the waste under a shelf is small. For a sheet whose frames
 * are all one size — the usual case here — this is simply a grid, and a grid is
 * the optimum: the only waste is the remainder of the last row.
 */
function packShelves(
  frames: PendingFrame[],
  binWidth: number,
  binHeight: number | null,
  options: AtlasOptions,
  allowNewPages: boolean,
): PackAttempt {
  const pages = [createPage(0)];
  let page = pages[0];
  let x = 0;
  let y = 0;
  let shelfHeight = 0;

  for (const frame of frames) {
    if (frame.slotW > binWidth) return { pages, failedFrame: frame };

    if (x > 0 && x + frame.slotW > binWidth) {
      x = 0;
      y += shelfHeight;
      shelfHeight = 0;
    }

    if (binHeight !== null && y + frame.slotH > binHeight) {
      if (!allowNewPages) return { pages, failedFrame: frame };
      page = createPage(pages.length);
      pages.push(page);
      x = 0;
      y = 0;
      shelfHeight = 0;
    }

    addPlacement(page, frame, x, y, options);
    x += frame.slotW;
    shelfHeight = Math.max(shelfHeight, frame.slotH);
  }

  return { pages };
}

/** Total pixels the pages of an attempt occupy, waste included. */
function attemptArea(pages: MutablePage[]): number {
  return pages.reduce((area, page) => area + page.width * page.height, 0);
}

/** The longest edge across an attempt's pages — how square the result is. */
function attemptMaxDimension(pages: MutablePage[]): number {
  return pages.reduce(
    (longest, page) => Math.max(longest, page.width, page.height),
    0,
  );
}

/**
 * How much larger than the smallest result a page may be and still be chosen
 * for its shape.
 *
 * Minimising area alone picks strips: 160×704 and 320×352 hold the same frames
 * in the same pixels, and the tall one wins on a tiebreak nobody asked for.
 * Within a few percent the pixels are not the difference that matters, so the
 * squarer page — the one an engine is happier to upload — takes it.
 */
const PACKED_SHAPE_TOLERANCE = 1.06;

/** How many distinctly-shaped shelf results get the expensive MaxRects squeeze. */
const SQUEEZED_WIDTH_COUNT = 6;

/** How many frames contribute a side-by-side candidate width. */
const PREFIX_WIDTH_COUNT = 32;

/** Orders results smallest-first: fewest pages, least area, squarest. */
function compareAttempts(a: MutablePage[], b: MutablePage[]): number {
  return (
    a.length - b.length ||
    attemptArea(a) - attemptArea(b) ||
    attemptMaxDimension(a) - attemptMaxDimension(b) ||
    (a[0]?.width ?? 0) - (b[0]?.width ?? 0)
  );
}

function isSmallerAttempt(next: MutablePage[], best: MutablePage[]): boolean {
  return compareAttempts(next, best) < 0;
}

/**
 * Pick the atlas to write from every layout the search found.
 *
 * Order of preference: fewer pages, then staying under the max atlas size —
 * a page over it is a blocked export, so a roomier page that exports beats a
 * tighter one that does not — then area, then shape.
 */
function choosePackedPages(
  candidates: MutablePage[][],
  options: AtlasOptions,
): MutablePage[] | null {
  const withinMax = candidates.filter((pages) =>
    pages.every(
      (page) =>
        page.width <= options.maxAtlasSize &&
        page.height <= options.maxAtlasSize,
    ),
  );
  const pool = withinMax.length > 0 ? withinMax : candidates;
  if (pool.length === 0) return null;

  const smallest = pool.reduce((best, next) =>
    isSmallerAttempt(next, best) ? next : best,
  );
  const budget = attemptArea(smallest) * PACKED_SHAPE_TOLERANCE;

  return pool
    .filter(
      (pages) =>
        pages.length === smallest.length && attemptArea(pages) <= budget,
    )
    .reduce((best, next) => {
      const nextMax = attemptMaxDimension(next);
      const bestMax = attemptMaxDimension(best);
      if (nextMax !== bestMax) return nextMax < bestMax ? next : best;

      const nextArea = attemptArea(next);
      const bestArea = attemptArea(best);
      if (nextArea !== bestArea) return nextArea < bestArea ? next : best;

      // Never let iteration order decide.
      return (next[0]?.width ?? 0) < (best[0]?.width ?? 0) ? next : best;
    });
}

/**
 * The page widths worth trying for a single-page atlas.
 *
 * The old search only ever tried squares, growing one by 25% until the frames
 * fitted and stopping at the first size that did — which for 90 uniform frames
 * settled on 704×704 at 74% coverage when 640×576 holds them exactly. So the
 * width is searched instead of guessed: whole columns of the widest slot (the
 * grid a uniform sheet wants), a sweep either side of the square, and the
 * single-strip extreme.
 */
function candidatePackedWidths(frames: PendingFrame[]): number[] {
  const maxSlotWidth = frames.reduce(
    (widest, frame) => Math.max(widest, frame.slotW),
    1,
  );
  const totalArea = frames.reduce(
    (area, frame) => area + frame.slotW * frame.slotH,
    0,
  );
  const totalWidth = frames.reduce((sum, frame) => sum + frame.slotW, 0);
  const square = Math.max(maxSlotWidth, Math.ceil(Math.sqrt(totalArea)));
  const widths = new Set<number>([maxSlotWidth, square, totalWidth]);

  // Column counts, capped: past a few dozen columns the pages are all much the
  // same shape, and every extra candidate is another pass over every frame.
  const maxColumns = Math.min(frames.length, 64);
  for (let columns = 1; columns <= maxColumns; columns += 1) {
    widths.add(maxSlotWidth * columns);
  }

  // Sheets whose frames differ in size do not want a column grid, so sweep
  // around the square as well.
  for (const factor of [0.5, 0.65, 0.8, 0.9, 1.1, 1.25, 1.5, 2]) {
    widths.add(Math.max(maxSlotWidth, Math.round(square * factor)));
  }

  // Widths where a shelf boundary falls naturally: the first k frames laid side
  // by side. On a sheet of two sizes these are the only widths that hold a
  // whole number of each, and a sweep of round numbers walks straight past them.
  let prefix = 0;
  for (const frame of frames.slice(0, PREFIX_WIDTH_COUNT)) {
    prefix += frame.slotW;
    widths.add(Math.max(maxSlotWidth, prefix));
  }

  return [...widths].sort((a, b) => a - b);
}

/**
 * Squeeze a shelf result by re-packing it into shorter bins.
 *
 * MaxRects can slot a short frame under a tall one where a shelf cannot, but
 * only when the bin leaves it no room to wander: given a bin far larger than
 * the frames need, best-short-side-fit walks down the left edge and leaves an
 * L-shaped hole. Handing it a bin that is already nearly full is what makes it
 * useful — so it is used to shorten a known-good shelf layout rather than to
 * find one, and the shelf result stands whenever it fails.
 */
function squeezeWithMaxRects(
  frames: PendingFrame[],
  width: number,
  shelfPages: MutablePage[],
  options: AtlasOptions,
): MutablePage[] {
  if (shelfPages.length !== 1) return shelfPages;

  const totalArea = frames.reduce(
    (area, frame) => area + frame.slotW * frame.slotH,
    0,
  );
  const tallestSlot = frames.reduce(
    (tallest, frame) => Math.max(tallest, frame.slotH),
    1,
  );

  let best = shelfPages;
  let low = Math.max(tallestSlot, Math.ceil(totalArea / width));
  let high = shelfPages[0].height - 1;

  // Around a dozen packs at most: the search halves the remaining height each
  // time rather than trying every value between the two bounds.
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const attempt = packFramesIntoMaxRectsPages(
      frames,
      width,
      mid,
      options,
      false,
    );

    if (attempt.failedFrame) {
      low = mid + 1;
      continue;
    }

    if (isSmallerAttempt(attempt.pages, best)) best = attempt.pages;
    high = Math.min(mid, attempt.pages[0]?.height ?? mid) - 1;
  }

  return best;
}

function buildPackedPlan(rows: ExportRow[], options: AtlasOptions): AtlasPlan {
  const frames = flattenRows(rows, options).sort(
    (a, b) =>
      b.slotH - a.slotH ||
      b.slotW - a.slotW ||
      a.rowIndex - b.rowIndex ||
      a.frameIndex - b.frameIndex,
  );

  if (frames.length === 0) {
    return finishPlan([], options);
  }

  if (options.allowMultiPage) {
    const size = Math.max(
      options.maxAtlasSize,
      ...frames.map((frame) => Math.max(frame.slotW, frame.slotH)),
    );
    const shelved = packShelves(frames, size, size, options, true);
    const maxRects = packFramesIntoMaxRectsPages(
      frames,
      size,
      size,
      options,
      true,
    );

    const best =
      !maxRects.failedFrame && isSmallerAttempt(maxRects.pages, shelved.pages)
        ? maxRects.pages
        : shelved.pages;

    return finishPlan(best, options);
  }

  // Every candidate width is shelf-packed with no height limit, so every one of
  // them fits — the search is over how good the result is, never over whether
  // there is one.
  const shelved: { width: number; pages: MutablePage[] }[] = [];
  for (const width of candidatePackedWidths(frames)) {
    const attempt = packShelves(frames, width, null, options, false);
    if (attempt.failedFrame) continue;
    shelved.push({ width, pages: attempt.pages });
  }

  // Squeezing is the expensive half — a dozen MaxRects packs per width — so it
  // only runs on the most promising widths. Deduplicated by the shape they
  // produce first: a dozen widths can shelve into the identical page, and
  // taking the best six by size alone spent all six on one shape and never
  // tried the arrangement that actually squeezes smaller.
  const seenShapes = new Set<string>();
  const promising = [...shelved]
    .sort((a, b) => compareAttempts(a.pages, b.pages))
    .filter((entry) => {
      const shape = entry.pages
        .map((page) => `${page.width}x${page.height}`)
        .join(",");
      if (seenShapes.has(shape)) return false;
      seenShapes.add(shape);
      return true;
    })
    .slice(0, SQUEEZED_WIDTH_COUNT);

  const candidates = [
    ...shelved.map((entry) => entry.pages),
    ...promising.map((entry) =>
      squeezeWithMaxRects(frames, entry.width, entry.pages, options),
    ),
  ];

  const chosen = choosePackedPages(candidates, options);
  if (!chosen) throw new Error("Unable to create a packed atlas plan.");

  return finishPlan(chosen, options);
}

function packFramesIntoMaxRectsPages(
  frames: PendingFrame[],
  binWidth: number,
  binHeight: number,
  options: AtlasOptions,
  allowNewPages: boolean,
): PackAttempt {
  const pages = [createMaxRectsPage(0, binWidth, binHeight)];

  for (const frame of frames) {
    let candidate = findBestMaxRectsCandidate(pages, frame);

    if (!candidate && allowNewPages) {
      const nextWidth = Math.max(binWidth, frame.slotW);
      const nextHeight = Math.max(binHeight, frame.slotH);
      const currentPage = pages[pages.length - 1];
      const nextPage =
        currentPage.placements.length === 0
          ? createMaxRectsPage(currentPage.index, nextWidth, nextHeight)
          : createMaxRectsPage(pages.length, nextWidth, nextHeight);
      if (currentPage.placements.length === 0) {
        pages[pages.length - 1] = nextPage;
      } else {
        pages.push(nextPage);
      }
      candidate = findBestMaxRectsCandidate([nextPage], frame);
    }

    if (!candidate) {
      return { pages, failedFrame: frame };
    }

    placeMaxRectsFrame(candidate, frame, options);
  }

  return { pages };
}

function findBestMaxRectsCandidate(
  pages: MaxRectsPage[],
  frame: PendingFrame,
): MaxRectsCandidate | null {
  let best: MaxRectsCandidate | null = null;

  for (const page of pages) {
    for (const rect of page.freeRects) {
      if (frame.slotW > rect.w || frame.slotH > rect.h) continue;

      const leftoverW = rect.w - frame.slotW;
      const leftoverH = rect.h - frame.slotH;
      const candidate: MaxRectsCandidate = {
        page,
        rect,
        shortSideFit: Math.min(leftoverW, leftoverH),
        longSideFit: Math.max(leftoverW, leftoverH),
        areaFit: rect.w * rect.h - frame.slotW * frame.slotH,
      };

      if (!best || compareMaxRectsCandidates(candidate, best) < 0) {
        best = candidate;
      }
    }
  }

  return best;
}

function compareMaxRectsCandidates(
  a: MaxRectsCandidate,
  b: MaxRectsCandidate,
): number {
  return (
    a.shortSideFit - b.shortSideFit ||
    a.longSideFit - b.longSideFit ||
    a.areaFit - b.areaFit ||
    a.page.index - b.page.index ||
    a.rect.y - b.rect.y ||
    a.rect.x - b.rect.x ||
    a.rect.h - b.rect.h ||
    a.rect.w - b.rect.w
  );
}

function placeMaxRectsFrame(
  candidate: MaxRectsCandidate,
  frame: PendingFrame,
  options: AtlasOptions,
) {
  const usedRect: FreeRect = {
    x: candidate.rect.x,
    y: candidate.rect.y,
    w: frame.slotW,
    h: frame.slotH,
  };

  addPlacement(candidate.page, frame, usedRect.x, usedRect.y, options);
  splitMaxRectsFreeRects(candidate.page, usedRect);
}

function splitMaxRectsFreeRects(page: MaxRectsPage, used: FreeRect) {
  const nextRects: FreeRect[] = [];

  for (const rect of page.freeRects) {
    if (!rectsIntersect(rect, used)) {
      nextRects.push(rect);
      continue;
    }

    const rectRight = rect.x + rect.w;
    const rectBottom = rect.y + rect.h;
    const usedRight = used.x + used.w;
    const usedBottom = used.y + used.h;

    if (used.x > rect.x) {
      nextRects.push({
        x: rect.x,
        y: rect.y,
        w: used.x - rect.x,
        h: rect.h,
      });
    }

    if (usedRight < rectRight) {
      nextRects.push({
        x: usedRight,
        y: rect.y,
        w: rectRight - usedRight,
        h: rect.h,
      });
    }

    if (used.y > rect.y) {
      nextRects.push({
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: used.y - rect.y,
      });
    }

    if (usedBottom < rectBottom) {
      nextRects.push({
        x: rect.x,
        y: usedBottom,
        w: rect.w,
        h: rectBottom - usedBottom,
      });
    }
  }

  page.freeRects = pruneFreeRects(nextRects);
}

function rectsIntersect(a: FreeRect, b: FreeRect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function pruneFreeRects(rects: FreeRect[]): FreeRect[] {
  const positiveRects = rects.filter((rect) => rect.w > 0 && rect.h > 0);
  const pruned = positiveRects.filter(
    (rect, index) =>
      !positiveRects.some(
        (other, otherIndex) =>
          otherIndex !== index && rectContainedIn(rect, other),
      ),
  );

  return pruned.sort(
    (a, b) => a.y - b.y || a.x - b.x || a.h - b.h || a.w - b.w,
  );
}

function rectContainedIn(rect: FreeRect, other: FreeRect): boolean {
  return (
    rect.x >= other.x &&
    rect.y >= other.y &&
    rect.x + rect.w <= other.x + other.w &&
    rect.y + rect.h <= other.y + other.h
  );
}

function finishPlan(pages: MutablePage[], options: AtlasOptions): AtlasPlan {
  const placements = pages
    .flatMap((page) => page.placements)
    .sort(
      (a, b) =>
        a.rowIndex - b.rowIndex ||
        a.frameIndex - b.frameIndex ||
        a.page - b.page,
    );

  return {
    options,
    pages: pages
      .filter((page) => page.placements.length > 0)
      .map((page) => ({
        index: page.index,
        width: Math.max(1, Math.ceil(page.width)),
        height: Math.max(1, Math.ceil(page.height)),
      })),
    placements,
  };
}

export function createAtlasPlan(
  rows: ExportRow[],
  options: Partial<AtlasOptions> = {},
): AtlasPlan {
  const normalized = normalizeAtlasOptions(options);
  if (normalized.layout === "packed") {
    return buildPackedPlan(rows, normalized);
  }
  return buildRowsPlan(rows, normalized);
}

/**
 * Fraction of a page's area the placed frames actually cover.
 *
 * Waste is the number worth reading on a packing result, and two surfaces
 * report it — the rail's map and the export dialog. Both read it from the same
 * plan through here, so they cannot drift into disagreeing about one atlas.
 */
export function getAtlasPageCoverage(
  plan: AtlasPlan | null | undefined,
  pageIndex = 0,
): number {
  const page = plan?.pages.find((item) => item.index === pageIndex);
  if (!plan || !page) return 0;

  const area = page.width * page.height;
  if (area <= 0) return 0;

  const filled = plan.placements.reduce(
    (acc, item) => (item.page === page.index ? acc + item.w * item.h : acc),
    0,
  );

  return filled / area;
}

export function atlasPageFileName(baseName: string, pageIndex: number): string {
  if (pageIndex === 0) return baseName;
  const dot = baseName.lastIndexOf(".");
  if (dot === -1) return `${baseName}_${pageIndex + 1}`;
  return `${baseName.slice(0, dot)}_${pageIndex + 1}${baseName.slice(dot)}`;
}

export function createSpritesheetJSONFromAtlasPlan(
  rows: ExportRow[],
  plan: AtlasPlan,
  imageName = "spritesheet.png",
  normalImageName?: string,
): SpritesheetJSON {
  const placementKey = (rowIndex: number, frameIndex: number) =>
    `${rowIndex}:${frameIndex}`;
  const placements = new Map(
    plan.placements.map((placement) => [
      placementKey(placement.rowIndex, placement.frameIndex),
      placement,
    ]),
  );
  const multiPage = plan.pages.length > 1;
  const meta: SpritesheetJSON["meta"] = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    imageWidth: plan.pages[0]?.width ?? 0,
    imageHeight: plan.pages[0]?.height ?? 0,
    frameCount: rows.reduce((acc, row) => acc + row.images.length, 0),
    animationCount: rows.length,
    spacing: plan.options.padding * 2 + plan.options.extrude * 2,
    margin: plan.options.spriteMargin,
  };

  if (normalImageName) {
    meta.normalImage = normalImageName;
  }

  if (multiPage) {
    meta.pages = plan.pages.map((page) => {
      const entry: NonNullable<SpritesheetJSON["meta"]["pages"]>[number] = {
        index: page.index,
        image: atlasPageFileName(imageName, page.index),
        width: page.width,
        height: page.height,
      };
      if (normalImageName) {
        entry.normalImage = atlasPageFileName(normalImageName, page.index);
      }
      return entry;
    });
  }

  const directionalAnimations = buildDirectionalAnimationGroups(rows);

  return {
    meta,
    animations: rows.map((row, rowIndex) => {
      const workflow = getRowWorkflowMetadata(row);

      return {
        name: row.label,
        frames: row.images.length,
        fps: row.fps ?? 12,
        frameWidth: getAtlasFrameSlotSize(row, plan.options).w,
        frameHeight: getAtlasFrameSlotSize(row, plan.options).h,
        ...(workflow ? { workflow } : {}),
        quads: row.images.map((_, frameIndex) => {
          const placement = placements.get(placementKey(rowIndex, frameIndex));
          if (!placement) {
            throw new Error(
              `Missing atlas placement for ${row.label}:${frameIndex}`,
            );
          }

          const quad = {
            x: placement.x,
            y: placement.y,
            w: placement.w,
            h: placement.h,
          };
          return multiPage ? { ...quad, page: placement.page } : quad;
        }),
      };
    }),
    ...(directionalAnimations.length > 0 ? { directionalAnimations } : {}),
  };
}
