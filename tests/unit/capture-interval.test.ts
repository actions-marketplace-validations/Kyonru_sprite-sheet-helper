import { describe, expect, it } from "vitest";
import {
  captureIntervalFromFps,
  fpsFromCaptureInterval,
} from "@/utils/exports/helpers";

describe("fpsFromCaptureInterval", () => {
  it("keeps whole rates whole", () => {
    expect(fpsFromCaptureInterval(100)).toBe(10);
    expect(fpsFromCaptureInterval(250)).toBe(4);
    expect(fpsFromCaptureInterval(500)).toBe(2);
    expect(fpsFromCaptureInterval(1000)).toBe(1);
  });

  it("never returns zero for a slow capture", () => {
    // Rounding to a whole fps used to yield 0 past 2000ms, which reached the
    // exported manifest as `fps: 0`.
    for (const interval of [2001, 2500, 3000, 10_000]) {
      expect(fpsFromCaptureInterval(interval)).toBeGreaterThan(0);
    }
  });

  it("round-trips the interval it was given", () => {
    for (const interval of [30, 100, 700, 1500, 2500, 3000]) {
      const roundTripped = captureIntervalFromFps(
        fpsFromCaptureInterval(interval),
      );
      // Within a millisecond — three decimals of fps is finer than any
      // interval the UI can express.
      expect(Math.abs(roundTripped - interval)).toBeLessThan(1);
    }
  });

  it("falls back for nonsense input rather than dividing by zero", () => {
    expect(fpsFromCaptureInterval(0)).toBe(10);
    expect(fpsFromCaptureInterval(-5)).toBe(10);
    expect(fpsFromCaptureInterval(Number.NaN)).toBe(10);
  });
});

describe("captureIntervalFromFps", () => {
  it("converts a rate back to milliseconds", () => {
    expect(captureIntervalFromFps(10)).toBe(100);
    expect(captureIntervalFromFps(2)).toBe(500);
  });

  it("honours rates below one frame per second", () => {
    // The old preview clamped to >= 1fps, so a 2500ms sequence played at 1000ms.
    expect(captureIntervalFromFps(0.4)).toBe(2500);
  });

  it("falls back to 12fps when a row carries no usable rate", () => {
    expect(captureIntervalFromFps(0)).toBeCloseTo(1000 / 12);
    expect(captureIntervalFromFps(undefined)).toBeCloseTo(1000 / 12);
    expect(captureIntervalFromFps(Number.NaN)).toBeCloseTo(1000 / 12);
  });
});
