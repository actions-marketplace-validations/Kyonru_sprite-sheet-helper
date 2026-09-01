import { describe, expect, it } from "vitest";
import {
  createAtlasPlan,
  createSpritesheetJSONFromAtlasPlan,
  getAtlasFrameSlotSize,
  normalizeAtlasOptions,
} from "@/utils/atlas";
import type { ExportRow } from "@/types/file";

function row(overrides: Partial<ExportRow> = {}): ExportRow {
  return {
    uuid: "row-1",
    label: "walk",
    images: ["a", "b"],
    frameWidth: 64,
    frameHeight: 64,
    fps: 12,
    ...overrides,
  } as ExportRow;
}

describe("atlas sprite margin", () => {
  it("defaults to zero and normalizes junk", () => {
    expect(normalizeAtlasOptions({}).spriteMargin).toBe(0);
    expect(normalizeAtlasOptions({ spriteMargin: -4 }).spriteMargin).toBe(0);
    expect(normalizeAtlasOptions({ spriteMargin: 2.6 }).spriteMargin).toBe(3);
  });

  it("grows the frame rect, not just the slot", () => {
    const plain = getAtlasFrameSlotSize(row(), { spriteMargin: 0 });
    const margined = getAtlasFrameSlotSize(row(), { spriteMargin: 4 });

    expect(plain.w).toBe(64);
    expect(margined.w).toBe(72);
    expect(margined.slotW).toBe(72);
  });

  it("is distinct from padding, which stays outside the frame rect", () => {
    const padded = getAtlasFrameSlotSize(row(), { padding: 4 });
    const margined = getAtlasFrameSlotSize(row(), { spriteMargin: 4 });

    // Padding leaves the rect alone and widens the slot around it.
    expect(padded.w).toBe(64);
    expect(padded.slotW).toBe(72);
    // The margin travels inside the rect an engine reads.
    expect(margined.w).toBe(72);
  });

  it("composes with scale", () => {
    const size = getAtlasFrameSlotSize(row(), { scale: 2, spriteMargin: 3 });

    expect(size.w).toBe(64 * 2 + 6);
  });

  it("reports the margin in the spritesheet metadata", () => {
    const rows = [row()];
    const plan = createAtlasPlan(rows, { spriteMargin: 5 });
    const json = createSpritesheetJSONFromAtlasPlan(rows, plan);

    expect(json.meta.margin).toBe(5);
    expect(json.animations[0].frameWidth).toBe(74);
    expect(json.animations[0].quads[0].w).toBe(74);
  });

  it("keeps quads inside the page", () => {
    const rows = [row()];
    const plan = createAtlasPlan(rows, { spriteMargin: 5 });

    for (const placement of plan.placements) {
      const page = plan.pages[placement.page];
      expect(placement.x + placement.w).toBeLessThanOrEqual(page.width);
      expect(placement.y + placement.h).toBeLessThanOrEqual(page.height);
    }
  });
});
