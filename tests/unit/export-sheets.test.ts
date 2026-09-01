import { describe, expect, it } from "vitest";
import {
  DEFAULT_SHEET_NAME,
  getRowSheetName,
  groupRowsBySheet,
  toSheetFileBase,
  toSheetIdentifier,
} from "@/utils/exports/sheets";
import { exportRow, frame } from "../helpers/export-fixtures";

const row = (label: string, sheet?: string) =>
  exportRow(label, [frame(`${label}-0`)], undefined, { sheet });

describe("sheet names", () => {
  it("treats a missing, empty or blank sheet as the default", () => {
    expect(getRowSheetName(row("walk"))).toBe(DEFAULT_SHEET_NAME);
    expect(getRowSheetName(row("walk", ""))).toBe(DEFAULT_SHEET_NAME);
    expect(getRowSheetName(row("walk", "   "))).toBe(DEFAULT_SHEET_NAME);
  });

  it("keeps a typed name but trims it", () => {
    expect(getRowSheetName(row("walk", "  hero  "))).toBe("hero");
  });

  it("reduces a name to something safe to put in a zip", () => {
    expect(toSheetFileBase("hero fx")).toBe("hero-fx");
    expect(toSheetFileBase("../etc/passwd")).toBe("etc-passwd");
    expect(toSheetFileBase("props/ui")).toBe("props-ui");
    expect(toSheetFileBase("!!!")).toBe(DEFAULT_SHEET_NAME);
  });

  it("builds identifiers that a compiler will accept", () => {
    expect(toSheetIdentifier("hero-fx")).toBe("HeroFx");
    expect(toSheetIdentifier("2d-props")).toBe("Sheet2dProps");
  });
});

describe("grouping sequences into sheets", () => {
  it("puts every unassigned sequence on one default sheet", () => {
    const groups = groupRowsBySheet([row("walk"), row("run")]);

    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe(DEFAULT_SHEET_NAME);
    expect(groups[0].base).toBe(DEFAULT_SHEET_NAME);
    expect(groups[0].rows.map((item) => item.label)).toEqual(["walk", "run"]);
  });

  it("groups by name and keeps first-appearance order", () => {
    const groups = groupRowsBySheet([
      row("walk", "hero"),
      row("chest", "props"),
      row("run", "hero"),
    ]);

    expect(groups.map((group) => group.name)).toEqual(["hero", "props"]);
    expect(groups[0].rows.map((item) => item.label)).toEqual(["walk", "run"]);
  });

  it("keeps sheets separate when their names collapse to one filename", () => {
    const groups = groupRowsBySheet([row("a", "hero fx"), row("b", "hero-fx")]);

    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.base)).toEqual(["hero-fx", "hero-fx-2"]);
  });
});
