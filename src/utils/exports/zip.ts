import type { Exporter } from "@/types/file";
import { getRowSheetName, groupRowsBySheet } from "./sheets";

export const zipExporter: Exporter<"zip"> = {
  id: "zip",
  label: "Images (ZIP)",

  async run({ exportedImages }) {
    // Raw frames are not packed, so a sheet is only a folder here — but it is
    // the same grouping the atlas formats write, so the archive matches what
    // the rest of the exports would have produced.
    const multi = groupRowsBySheet(exportedImages).length > 1;
    const files = [];

    for (const row of exportedImages) {
      const directory = multi ? `${getRowSheetName(row)}/` : "";
      for (let j = 0; j < row.images.length; j++) {
        files.push({
          name: `${directory}${row.label}/${row.uuid}_${j}.png`,
          content: row.images[j],
          base64: true,
        });
      }
    }

    return {
      filename: "images.zip",
      files,
    };
  },
};
