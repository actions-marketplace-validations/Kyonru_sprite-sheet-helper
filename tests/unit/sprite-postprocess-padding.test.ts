import { describe, expect, it } from "vitest";
import {
  getSpritePostprocessFrameGrowth,
  getSpritePostprocessPadding,
} from "@/utils/sprite-postprocess";
import type { SpritePostprocessSnapshot } from "@/types/sprite-postprocess";

function snapshot(
  overrides: Partial<SpritePostprocessSnapshot> = {},
): SpritePostprocessSnapshot {
  return {
    enabled: true,
    selectedRow: 0,
    selectedFrame: 0,
    compareBeforeAfter: false,
    effects: [
      {
        id: "outline-1",
        type: "outerOutline",
        enabled: true,
        color: "#111111",
        opacity: 1,
        thickness: 3,
        outlineMode: "crisp",
      },
    ],
    ...overrides,
  };
}

describe("sprite postprocess padding", () => {
  it("reports what the effects need", () => {
    expect(getSpritePostprocessPadding(snapshot())).toBe(3);
  });

  it("reports nothing when postprocessing is off", () => {
    expect(getSpritePostprocessPadding(snapshot({ enabled: false }))).toBe(0);
    expect(getSpritePostprocessPadding(undefined)).toBe(0);
  });

  it("grows the frame by default", () => {
    expect(getSpritePostprocessFrameGrowth(snapshot())).toBe(3);
  });

  it("stops growing the frame when the size is preserved", () => {
    const preserved = snapshot({ preserveFrameSize: true });

    // The effect still needs the room; it just comes out of the reserved
    // margin instead of out of the frame size the user asked for.
    expect(getSpritePostprocessPadding(preserved)).toBe(3);
    expect(getSpritePostprocessFrameGrowth(preserved)).toBe(0);
  });
});
