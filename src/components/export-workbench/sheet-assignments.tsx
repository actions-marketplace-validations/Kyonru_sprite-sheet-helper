import { ChevronDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { confirm } from "@/components/confirm";
import { useImagesStore } from "@/store/next/images";
import type { ExportRow } from "@/types/file";
import type { ExportSheet } from "@/utils/export-validation";
import { DEFAULT_SHEET_NAME, getRowSheetName } from "@/utils/exports/sheets";
import { cn } from "@/lib/utils";

/**
 * Move one sequence to another sheet.
 *
 * The menu lists the sheets that already exist, because moving a sequence
 * beside its neighbours is the common case and typing the same name twice is
 * how you end up with two sheets you meant to be one.
 */
export function SheetPicker({
  row,
  sheetNames,
}: {
  row: ExportRow;
  sheetNames: string[];
}) {
  const updateSheet = useImagesStore((state) => state.updateSheet);
  const current = getRowSheetName(row);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid={`sheet-picker-${row.uuid}`}
          className="flex h-[19px] shrink-0 items-center gap-1 rounded-md border border-stroke px-1.5 text-[10px] text-muted-foreground transition-colors hover:bg-row-hover hover:text-foreground"
        >
          <span className="max-w-24 truncate">{current}</span>
          <ChevronDown size={10} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-9999">
        {sheetNames.map((name) => (
          <DropdownMenuItem
            key={name}
            onClick={() =>
              updateSheet(row.uuid, name === DEFAULT_SHEET_NAME ? "" : name)
            }
          >
            <span className={cn(name === current && "font-semibold")}>
              {name}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            confirm.withInput("Move to a new sheet", {
              input: {
                label: "Sheet name",
                placeholder: "props, fx, ui…",
                defaultValue: "",
              },
              onConfirm: (value) => updateSheet(row.uuid, value ?? ""),
            })
          }
        >
          <Plus />
          New sheet…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Which sequence is packed into which spritesheet.
 *
 * Grouped under the sheet each one writes, because the grouping *is* the
 * information: the list doubles as the preview of how many atlases the export
 * produces and what lands in each. Clicking a sheet header shows that sheet in
 * the map above, so the picture and the assignment stay one surface.
 */
export function SheetAssignments({
  sheets,
  selected,
  onSelect,
}: {
  sheets: ExportSheet[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  const sheetNames = sheets.map((sheet) => sheet.name);
  const names = sheetNames.includes(DEFAULT_SHEET_NAME)
    ? sheetNames
    : [DEFAULT_SHEET_NAME, ...sheetNames];

  return (
    <div className="grid gap-1.5">
      {sheets.map((sheet, index) => {
        const active = index === selected && sheets.length > 1;
        return (
          <div
            key={sheet.name}
            className={cn(
              "grid gap-1 rounded-md border p-1.5 transition-colors",
              active
                ? "border-brand-line bg-brand-soft"
                : "border-stroke bg-surface-sunken",
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-pressed={active}
              className="flex items-baseline gap-2 text-left"
            >
              <span className="truncate text-[11px] font-semibold">
                {sheet.name}
              </span>
              <span className="ml-auto shrink-0 font-mono text-[10px] text-faint-foreground tabular-nums">
                {sheet.imageWidth > 0
                  ? `${sheet.imageWidth}×${sheet.imageHeight}`
                  : "—"}
                {" · "}
                {sheet.frameCount} frame{sheet.frameCount === 1 ? "" : "s"}
              </span>
            </button>

            {sheet.rows.map((row) => (
              <div
                key={row.uuid}
                className="flex items-center gap-2 rounded px-1 py-0.5 hover:bg-row-hover"
              >
                <span className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">
                  {row.label}
                </span>
                <span className="shrink-0 font-mono text-[9px] text-faint-foreground tabular-nums">
                  {row.images.length}
                </span>
                <SheetPicker row={row} sheetNames={names} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
