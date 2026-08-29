import { describe, expect, it } from "vitest";
import { createAtlasPlan, getAtlasPageCoverage } from "@/utils/atlas";
import type { AtlasOptions, ExportRow } from "@/types/file";

const row = (
  label: string,
  count: number,
  width = 64,
  height = width,
): ExportRow => ({
  uuid: label,
  label,
  images: Array.from({ length: count }, (_, index) => `${label}-${index}`),
  frameWidth: width,
  frameHeight: height,
  fps: 12,
});

/** Share of the whole atlas — every page — filled with frames. */
const coverage = (rows: ExportRow[], options: Partial<AtlasOptions> = {}) => {
  const plan = createAtlasPlan(rows, { layout: "packed", ...options });
  const total = plan.pages.reduce(
    (area, page) => area + page.width * page.height,
    0,
  );
  const used = plan.placements.reduce((area, item) => area + item.w * item.h, 0);
  return used / total;
};

const page = (rows: ExportRow[], options: Partial<AtlasOptions> = {}) =>
  createAtlasPlan(rows, { layout: "packed", ...options }).pages[0];

describe("packed atlas quality", () => {
  /*
    The regression these guard: the old search only tried square pages, grew one
    by 25% until the frames fitted and kept the first size that did. 90 uniform
    frames landed on 704×704 at 74% — worse than the rows layout it is supposed
    to beat, with a visible L-shaped hole in the preview.
  */
  it("wastes nothing on a sheet whose frames are all one size", () => {
    expect(coverage([row("a", 30), row("b", 30), row("c", 30)])).toBe(1);
  });

  it("packs a frame count with no exact grid into near-full pages", () => {
    // 97 is prime: some waste is unavoidable, most of a page is not.
    expect(coverage([row("a", 97)])).toBeGreaterThan(0.95);
  });

  it("beats the rows layout on mixed frame sizes", () => {
    const rows = [row("a", 12, 64), row("b", 6, 96), row("c", 8, 32)];
    const packed = createAtlasPlan(rows, { layout: "packed" });
    const shelved = createAtlasPlan(rows, { layout: "rows" });

    expect(getAtlasPageCoverage(packed)).toBeGreaterThan(
      getAtlasPageCoverage(shelved),
    );
  });

  it.each([
    ["wide frames", [row("a", 24, 128, 32)]],
    ["tall frames", [row("a", 24, 32, 128)]],
    ["one frame", [row("a", 1)]],
    [
      "very mixed",
      [row("a", 3, 200), row("b", 20, 40), row("c", 9, 90, 30), row("d", 5, 16, 120)],
    ],
  ])("fills most of the page for %s", (_, rows) => {
    expect(coverage(rows)).toBeGreaterThan(0.9);
  });

  it("keeps the page roughly square rather than a long strip", () => {
    const packed = page([row("a", 30)]);
    const longest = Math.max(packed.width, packed.height);
    const shortest = Math.min(packed.width, packed.height);

    expect(longest / shortest).toBeLessThan(2);
  });

  it("stays under the max atlas size when a layout under it exists", () => {
    const packed = page([row("a", 40)], { maxAtlasSize: 512 });

    expect(packed.width).toBeLessThanOrEqual(512);
    expect(packed.height).toBeLessThanOrEqual(512);
  });

  it("fills multi-page atlases rather than spreading across extra pages", () => {
    const plan = createAtlasPlan([row("a", 40)], {
      layout: "packed",
      maxAtlasSize: 256,
      allowMultiPage: true,
    });

    // A 256×256 page holds 16 frames of 64px, so 40 frames need three.
    expect(plan.pages.length).toBe(3);
    expect(coverage([row("a", 40)], { maxAtlasSize: 256, allowMultiPage: true })).toBe(1);
  });

  it("accounts for padding, extrusion and margin in the slots it packs", () => {
    const rows = [row("a", 30)];
    const options = { padding: 2, extrude: 2, spriteMargin: 1 };
    const packed = page(rows, options);
    // Each 64px frame occupies 64 + 2*1 margin + 2*(2+2) gutter = 74px.
    const slots = Math.floor(packed.width / 74) * Math.floor(packed.height / 74);

    expect(slots).toBeGreaterThanOrEqual(30);
  });

  it("packs the same input to the same plan every time", () => {
    const rows = [row("a", 9, 40), row("b", 4, 90, 30), row("c", 6, 16, 120)];

    expect(createAtlasPlan(rows, { layout: "packed" })).toEqual(
      createAtlasPlan(rows, { layout: "packed" }),
    );
  });

  it("never overlaps two frames", () => {
    const plan = createAtlasPlan(
      [row("a", 12, 64), row("b", 7, 96), row("c", 9, 32)],
      { layout: "packed" },
    );

    for (const a of plan.placements) {
      for (const b of plan.placements) {
        if (a === b || a.page !== b.page) continue;
        const apart =
          a.slotX + a.slotW <= b.slotX ||
          b.slotX + b.slotW <= a.slotX ||
          a.slotY + a.slotH <= b.slotY ||
          b.slotY + b.slotH <= a.slotY;
        expect(apart).toBe(true);
      }
    }
  });

  it("packs a large sheet fast enough to run on every render", () => {
    const started = performance.now();
    createAtlasPlan([row("a", 500)], { layout: "packed" });

    expect(performance.now() - started).toBeLessThan(250);
  });
});
