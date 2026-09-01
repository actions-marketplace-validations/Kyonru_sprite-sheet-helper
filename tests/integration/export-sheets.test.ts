import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderAtlasPages } from "@/utils/atlas-renderer";
import { SpritesheetExporter } from "@/utils/exports/spritesheet";
import { phaserExporter } from "@/utils/exports/phaser";
import { bevyExporter } from "@/utils/exports/bevy";
import {
  love2dVanillaExporter,
  love2dAnim8Exporter,
} from "@/utils/exports/love2d";
import { godotExporter } from "@/utils/exports/godot";
import { unityExporter } from "@/utils/exports/unity";
import { pygameExporter } from "@/utils/exports/pygame";
import { raylibExporter } from "@/utils/exports/raylib";
import { turboRustExporter } from "@/utils/exports/turbo";
import { zipExporter } from "@/utils/exports/zip";
import { exportRow, frame } from "../helpers/export-fixtures";

vi.mock("@/utils/atlas-renderer", () => ({ renderAtlasPages: vi.fn() }));

const renderAtlasPagesMock = vi.mocked(renderAtlasPages);

/** Two sheets, so every exporter has to write each one separately. */
const grouped = [
  exportRow("walk", [frame("c0"), frame("c1")], undefined, { sheet: "hero" }),
  exportRow("chest", [frame("c2")], undefined, { sheet: "props" }),
];

const ungrouped = [
  exportRow("walk", [frame("c0"), frame("c1")]),
  exportRow("chest", [frame("c2")]),
];

const run = (
  exporter: { run: (context: never) => Promise<{ files: { name: string }[] }> },
  exportedImages: typeof grouped,
) =>
  exporter.run({
    exportedImages,
    frameDelay: 100,
    includeNormalMap: false,
  } as never);

describe("grouping sequences into sheets", () => {
  beforeEach(() => {
    renderAtlasPagesMock.mockImplementation(async (_rows, plan) =>
      plan.pages.map((page) => `data:image/png;base64,atlas-${page.index}`),
    );
  });

  it.each([
    [SpritesheetExporter.label, SpritesheetExporter],
    [phaserExporter.label, phaserExporter],
    [love2dVanillaExporter.label, love2dVanillaExporter],
    [love2dAnim8Exporter.label, love2dAnim8Exporter],
    [godotExporter.label, godotExporter],
    [unityExporter.label, unityExporter],
    [pygameExporter.label, pygameExporter],
    [raylibExporter.label, raylibExporter],
    [turboRustExporter.label, turboRustExporter],
    [bevyExporter.label, bevyExporter],
  ])("%s writes one atlas per sheet", async (_, exporter) => {
    const names = (await run(exporter, grouped)).files.map((file) => file.name);

    expect(names).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/hero\.png$/),
        expect.stringMatching(/props\.png$/),
      ]),
    );
    expect(names).not.toContain("spritesheet.png");
    expect(names.filter((name) => name.endsWith(".png"))).toHaveLength(2);
  });

  it.each([
    [SpritesheetExporter.label, SpritesheetExporter, "spritesheet.png"],
    [phaserExporter.label, phaserExporter, "spritesheet.png"],
    [love2dVanillaExporter.label, love2dVanillaExporter, "spritesheet.png"],
    [godotExporter.label, godotExporter, "spritesheet.png"],
    [unityExporter.label, unityExporter, "spritesheet.png"],
    [pygameExporter.label, pygameExporter, "spritesheet.png"],
    [raylibExporter.label, raylibExporter, "spritesheet.png"],
    [turboRustExporter.label, turboRustExporter, "spritesheet.png"],
    [bevyExporter.label, bevyExporter, "assets/spritesheet.png"],
  ])(
    "%s is unchanged when nothing is assigned to a sheet",
    async (_, exporter, imageName) => {
      const names = (await run(exporter, ungrouped)).files.map(
        (file) => file.name,
      );

      expect(names).toContain(imageName);
      expect(names.filter((name) => name.endsWith(".png"))).toHaveLength(1);
    },
  );

  it("packs each sheet on its own rather than into one shared atlas", async () => {
    const result = await run(SpritesheetExporter, grouped);
    const read = (name: string) =>
      JSON.parse(
        result.files.find((file) => file.name === name)!.content as string,
      ) as { animations: { name: string }[] };

    expect(read("hero.json").animations.map((a) => a.name)).toEqual(["walk"]);
    expect(read("props.json").animations.map((a) => a.name)).toEqual(["chest"]);
  });

  it("names each sheet's manifest after the sheet it describes", async () => {
    const result = await run(SpritesheetExporter, grouped);
    const manifest = JSON.parse(
      result.files.find((file) => file.name === "props.manifest.json")!
        .content as string,
    ) as { sheet: string };

    expect(manifest.sheet).toBe("props");
  });

  it("gives raylib headers prefixed symbols so they can be included together", async () => {
    const result = await run(raylibExporter, grouped);
    const header = result.files.find((file) => file.name === "hero.h")!
      .content as string;

    expect(header).toContain("#ifndef HERO_SPRITESHEET_H");
    expect(header).toContain("} HeroAnimation;");
    expect(header).toContain("void UpdateHeroAnimation(");
  });

  it.each([
    [godotExporter.label, godotExporter, "HeroHelper.gd", "class_name HeroHelper"],
    [
      unityExporter.label,
      unityExporter,
      "HeroAnimator.cs",
      "public class HeroAnimator : MonoBehaviour",
    ],
  ])(
    "%s gives each sheet its own global type name",
    async (_, exporter, fileName, declaration) => {
      const result = await run(exporter, grouped);
      const file = result.files.find((item) => item.name === fileName);

      expect(file).toBeDefined();
      expect(file!.content as string).toContain(declaration);
    },
  );

  it("keeps raw frame exports flat until sheets are used", async () => {
    const flat = (await run(zipExporter, ungrouped)).files.map(
      (file) => file.name,
    );
    const nested = (await run(zipExporter, grouped)).files.map(
      (file) => file.name,
    );

    expect(flat.every((name) => name.startsWith("walk/") || name.startsWith("chest/"))).toBe(true);
    expect(nested).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^hero\/walk\//),
        expect.stringMatching(/^props\/chest\//),
      ]),
    );
  });
});
