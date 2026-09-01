import type { ExportRow } from "@/types/file";

/**
 * The sheet a sequence belongs to when nobody has said otherwise.
 *
 * It is also the file stem every exporter has always written, so a project with
 * one unnamed sheet produces byte-identical output to one from before sheets
 * existed.
 */
export const DEFAULT_SHEET_NAME = "spritesheet";

export type SheetGroup = {
  /** The name as typed, for the UI. */
  name: string;
  /** Filename stem every file for this sheet is built from. */
  base: string;
  rows: ExportRow[];
};

export function getRowSheetName(row: ExportRow): string {
  const name = row.sheet?.trim();
  return name ? name : DEFAULT_SHEET_NAME;
}

/**
 * A sheet name reduced to something safe to put in a zip.
 *
 * Names are typed by hand and land in filenames, `#include`s and class names,
 * so anything a path or an identifier would choke on is replaced rather than
 * escaped. A name that survives with nothing usable in it falls back to the
 * default stem, which the caller then makes unique.
 */
export function toSheetFileBase(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^a-zA-Z0-9-_ ]/g, " ")
    .trim()
    .replace(/\s+/g, "-");

  return cleaned.length > 0 ? cleaned : DEFAULT_SHEET_NAME;
}

/**
 * A sheet's stem as a PascalCase identifier, for languages whose class and type
 * names share one global namespace (GDScript, C#, C).
 */
export function toSheetIdentifier(base: string): string {
  const pascal = base
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

  return /^[0-9]/.test(pascal) ? `Sheet${pascal}` : pascal || "SpriteSheet";
}

/**
 * Sequences grouped into the sheets they will be packed into.
 *
 * First appearance wins the order, so the sheets come out in the order the
 * sequences were captured rather than alphabetically — the export reads in the
 * same order as the panel that produced it. Two names that reduce to the same
 * filename (`hero fx` and `hero-fx`) stay separate sheets, and the second one
 * gets a numbered stem so neither silently overwrites the other.
 */
export function groupRowsBySheet(rows: ExportRow[]): SheetGroup[] {
  const groups = new Map<string, ExportRow[]>();

  for (const row of rows) {
    const name = getRowSheetName(row);
    const existing = groups.get(name);
    if (existing) existing.push(row);
    else groups.set(name, [row]);
  }

  const usedBases = new Map<string, number>();

  return [...groups.entries()].map(([name, sheetRows]) => {
    const preferred = toSheetFileBase(name);
    const taken = usedBases.get(preferred) ?? 0;
    usedBases.set(preferred, taken + 1);

    return {
      name,
      base: taken === 0 ? preferred : `${preferred}-${taken + 1}`,
      rows: sheetRows,
    };
  });
}
