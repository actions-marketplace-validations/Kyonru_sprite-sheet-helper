import type { Exporter, ExportFile } from "@/types/file";
import { createGif } from "../assets";
import { captureIntervalFromFps, dedupeFileNames } from "./helpers";

/**
 * Delay between frames, in milliseconds, for one row.
 *
 * The row's own rate wins: it is what the preview plays at and what every other
 * exporter writes into its manifest, so a GIF that ignored it would be the one
 * artifact whose timing disagreed with the rest of the export. `frameDelay` is
 * the global GIF delay, kept as the fallback for rows captured before the rate
 * was recorded — a row can carry 0 from an older project, and zero is not
 * nullish, so it is checked rather than defaulted.
 */
function frameDelayForRow(fps: number | undefined, fallbackMs: number) {
  if (Number.isFinite(fps) && (fps ?? 0) > 0) {
    return Math.max(1, Math.round(captureIntervalFromFps(fps)));
  }
  return Math.max(1, Math.round(fallbackMs));
}

export const gifExporter: Exporter<"gif"> = {
  id: "gif",
  label: "GIF (ZIP)",

  async run({ exportedImages, frameDelay }) {
    // Two sequences may share a label; the files they write may not.
    const names = dedupeFileNames(
      exportedImages.map((row) => `${row.label}.gif`),
    );

    const files: ExportFile[] = await Promise.all(
      exportedImages.map(async (row, index) => {
        const gifUrl = await createGif(
          row.images,
          row.frameWidth,
          row.frameHeight,
          frameDelayForRow(row.fps, frameDelay),
        );

        const raw = await fetch(gifUrl);
        const content = await raw.arrayBuffer();
        URL.revokeObjectURL(gifUrl);

        return {
          name: names[index],
          content,
        };
      }),
    );

    return {
      filename: "gif.zip",
      files,
    };
  },
};
