import type { Exporter } from "@/types/file";
import { buildSheetAssets } from "./helpers";

export const SpritesheetExporter: Exporter<"spritesheet"> = {
  id: "spritesheet",
  label: "Spritesheet",

  async run({
    exportedImages,
    includeNormalMap,
    atlasOptions,
    spritePostprocess,
  }) {
    const sheets = await buildSheetAssets(exportedImages, {
      includeNormalMap,
      atlasOptions,
      exporterId: "spritesheet",
      spritePostprocess,
    });

    return {
      filename: "spritesheet.zip",
      files: sheets.flatMap(({ base, assets }) => [
        ...assets.colorPages,
        ...assets.normalPages,
        {
          name: `${base}.json`,
          content: JSON.stringify(assets.json, null, 2),
        },
        assets.manifestFile,
      ]),
    };
  },
};
