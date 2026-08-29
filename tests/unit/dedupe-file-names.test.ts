import { describe, expect, it } from "vitest";
import { dedupeFileNames } from "@/utils/exports/helpers";

describe("dedupeFileNames", () => {
  it("leaves unique names alone", () => {
    expect(dedupeFileNames(["a.png", "b.json"])).toEqual(["a.png", "b.json"]);
  });

  it("suffixes collisions before the extension", () => {
    // Two sequences may share a label; the files they write may not — without
    // this the second silently overwrote the first inside the archive.
    expect(dedupeFileNames(["Animation.gif", "Animation.gif"])).toEqual([
      "Animation.gif",
      "Animation-2.gif",
    ]);
  });

  it("keeps counting past the second collision", () => {
    expect(dedupeFileNames(["run.gif", "run.gif", "run.gif"])).toEqual([
      "run.gif",
      "run-2.gif",
      "run-3.gif",
    ]);
  });

  it("suffixes the file, not the directory", () => {
    expect(
      dedupeFileNames(["assets/sheet.png", "assets/sheet.png"]),
    ).toEqual(["assets/sheet.png", "assets/sheet-2.png"]);
  });

  it("handles compound extensions", () => {
    expect(
      dedupeFileNames(["sheet.manifest.json", "sheet.manifest.json"]),
    ).toEqual(["sheet.manifest.json", "sheet-2.manifest.json"]);
  });

  it("handles names with no extension", () => {
    expect(dedupeFileNames(["LICENSE", "LICENSE"])).toEqual([
      "LICENSE",
      "LICENSE-2",
    ]);
  });

  it("tracks each colliding name independently", () => {
    expect(
      dedupeFileNames(["a.gif", "b.gif", "a.gif", "b.gif", "a.gif"]),
    ).toEqual(["a.gif", "b.gif", "a-2.gif", "b-2.gif", "a-3.gif"]);
  });
});
