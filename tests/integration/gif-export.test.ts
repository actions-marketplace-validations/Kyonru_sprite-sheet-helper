import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGif } from "@/utils/assets";
import { gifExporter } from "@/utils/exports/gif";
import { exportRow, frame } from "../helpers/export-fixtures";

vi.mock("@/utils/assets", () => ({ createGif: vi.fn() }));

const createGifMock = vi.mocked(createGif);

/** The delay each row was encoded with, in the order the rows were exported. */
const encodedDelays = () =>
  createGifMock.mock.calls.map((call) => call[3]);

describe("gif exporter timing", () => {
  beforeEach(() => {
    createGifMock.mockResolvedValue("blob:gif");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ arrayBuffer: async () => new ArrayBuffer(1) })),
    );
    URL.revokeObjectURL = vi.fn();
  });

  it("encodes each row at its own rate rather than the global delay", async () => {
    await gifExporter.run({
      exportedImages: [
        exportRow("walk", [frame("c0"), frame("c1")], undefined, { fps: 10 }),
        exportRow("idle", [frame("c0")], undefined, { fps: 4 }),
      ],
      frameDelay: 100,
      includeNormalMap: false,
    });

    expect(encodedDelays()).toEqual([100, 250]);
  });

  it("rounds fractional rates to whole milliseconds", async () => {
    await gifExporter.run({
      exportedImages: [
        exportRow("walk", [frame("c0")], undefined, { fps: 12 }),
      ],
      frameDelay: 100,
      includeNormalMap: false,
    });

    expect(encodedDelays()).toEqual([83]);
  });

  it.each([0, Number.NaN, undefined as unknown as number])(
    "falls back to the global delay for a row carrying %s",
    async (fps) => {
      await gifExporter.run({
        exportedImages: [exportRow("walk", [frame("c0")], undefined, { fps })],
        frameDelay: 40,
        includeNormalMap: false,
      });

      expect(encodedDelays()).toEqual([40]);
    },
  );
});
