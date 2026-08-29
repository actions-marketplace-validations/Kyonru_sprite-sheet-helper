import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pause,
  Layers,
  Pencil,
  Repeat,
  Play,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrubField } from "@/components/ui/scrub-field";
import { confirm } from "@/components/confirm";
import { reorderItems } from "@/components/animation-reorder-modal";
import { useImagesStore } from "@/store/next/images";
import { captureIntervalFromFps } from "@/utils/exports/helpers";
import { addDataToImageIfNeeded } from "@/utils/images";
import {
  getNormalCoverageForRow,
  type NormalCoverageStatus,
} from "@/utils/exports/helpers";
import { cn } from "@/lib/utils";

function NormalStatusBadge({ status }: { status: NormalCoverageStatus }) {
  const label =
    status === "ready" ? "Ready" : status === "partial" ? "Partial" : "Missing";

  return (
    <span
      className={cn(
        "rounded border px-1.5 py-0.5 text-[10px]",
        status === "ready" &&
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
        status === "partial" &&
          "border-amber-500/30 bg-amber-500/10 text-amber-700",
        status === "missing" &&
          "border-muted-foreground/20 bg-muted text-muted-foreground",
      )}
    >
      Normals: {label}
    </span>
  );
}

function SequenceRow({
  row,
  index,
  selected,
  onSelect,
  onRemove,
}: {
  row: ReturnType<typeof useImagesStore.getState>["images"][number];
  index: number;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const updateLabel = useImagesStore((state) => state.updateLabel);
  const updateWidth = useImagesStore((state) => state.updateWidth);
  const updateHeight = useImagesStore((state) => state.updateHeight);
  const updateFps = useImagesStore((state) => state.updateFps);
  const updateImagesRow = useImagesStore((state) => state.updateImagesRow);
  const normalStatus = getNormalCoverageForRow(row).status;

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className={cn(
          "grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors",
          selected ? "border-primary bg-primary/10" : "hover:bg-muted",
        )}
        onClick={onSelect}
      >
        <div className="min-w-0">
          <div className="truncate text-xs font-medium">{row.label}</div>
          <div className="mt-0.5 text-[10px] text-muted-foreground">
            {row.images.length} frame{row.images.length === 1 ? "" : "s"} ·{" "}
            {row.frameWidth}x{row.frameHeight}
          </div>
        </div>
        <NormalStatusBadge status={normalStatus} />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 shrink-0"
            aria-label={`Sequence actions for ${row.label}`}
          >
            <MoreHorizontal size={15} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="z-9999">
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() =>
                confirm.withInput("Rename sequence", {
                  input: {
                    label: "Sequence name",
                    placeholder: "Sequence name...",
                    defaultValue: row.label,
                  },
                  onConfirm: (value) =>
                    updateLabel(row.uuid, value || row.label),
                })
              }
            >
              <Pencil />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                reorderItems({
                  items: row.images.map((src, frameIndex) => ({
                    src,
                    id: frameIndex,
                  })),
                  onChange: (items) =>
                    updateImagesRow(
                      index,
                      items.map((item) => item.src),
                      row.normalImages
                        ? items.map((item) => row.normalImages![item.id])
                        : undefined,
                    ),
                  onRenderItem: (item) => (
                    <img
                      key={`${item.id}`}
                      className="size-24 rounded-md object-contain"
                      src={addDataToImageIfNeeded(item.src)}
                      alt={`Frame ${item.id + 1}`}
                    />
                  ),
                  header: (
                    <form onSubmit={(event) => event.preventDefault()}>
                      <FieldGroup>
                        <Field>
                          <Label htmlFor={`sequence-name-${row.uuid}`}>
                            Name
                          </Label>
                          <Input
                            id={`sequence-name-${row.uuid}`}
                            name="name"
                            defaultValue={row.label}
                            onChange={(event) =>
                              updateLabel(row.uuid, event.target.value)
                            }
                          />
                        </Field>
                        <div className="grid grid-cols-3 gap-4">
                          <Field>
                            <Label htmlFor={`sequence-width-${row.uuid}`}>
                              Width
                            </Label>
                            <Input
                              id={`sequence-width-${row.uuid}`}
                              name="width"
                              defaultValue={row.frameWidth}
                              type="number"
                              min={1}
                              onChange={(event) =>
                                updateWidth(row.uuid, Number(event.target.value))
                              }
                            />
                          </Field>
                          <Field>
                            <Label htmlFor={`sequence-height-${row.uuid}`}>
                              Height
                            </Label>
                            <Input
                              id={`sequence-height-${row.uuid}`}
                              name="height"
                              defaultValue={row.frameHeight}
                              type="number"
                              min={1}
                              onChange={(event) =>
                                updateHeight(
                                  row.uuid,
                                  Number(event.target.value),
                                )
                              }
                            />
                          </Field>
                          <Field>
                            <Label htmlFor={`sequence-fps-${row.uuid}`}>
                              FPS
                            </Label>
                            <Input
                              id={`sequence-fps-${row.uuid}`}
                              name="fps"
                              defaultValue={row.fps}
                              type="number"
                              min={1}
                              max={240}
                              onChange={(event) =>
                                updateFps(row.uuid, Number(event.target.value))
                              }
                            />
                          </Field>
                        </div>
                      </FieldGroup>
                    </form>
                  ),
                });
              }}
            >
              <SlidersHorizontal />
              Edit frames
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              variant="destructive"
              onClick={() =>
                confirm.delete(row.label, {
                  onConfirm: onRemove,
                })
              }
            >
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function SequencePreview() {
  const [loop, setLoop] = useState(false);
  const [editing, setEditing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const rows = useImagesStore((state) => state.images);
  const selectedRow = useImagesStore((state) => state.selectedRow);
  const setSelectedRow = useImagesStore((state) => state.setSelectedRow);
  const setImages = useImagesStore((state) => state.setImages);
  const updateImagesRow = useImagesStore((state) => state.updateImagesRow);
  const updateFps = useImagesStore((state) => state.updateFps);
  const removeImagesRow = useImagesStore((state) => state.removeImagesRow);
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (rows.length === 0) return;
    if (selectedRow < rows.length) return;
    setSelectedRow(Math.max(0, rows.length - 1));
  }, [rows.length, selectedRow, setSelectedRow]);

  const activeRow = rows[selectedRow] ?? rows[0];
  const currentFrameIndex = activeRow
    ? Math.max(0, Math.min(activeFrameIndex, activeRow.images.length - 1))
    : 0;
  const currentFrame = activeRow?.images[currentFrameIndex];
  /*
    The rate the row plays and exports at. A row can carry 0 or nothing at all
    from an older project, so the readout falls back to the same 12fps the
    manifest writes rather than showing a rate no consumer would honour.
  */
  const rowFps =
    activeRow && Number.isFinite(activeRow.fps) && activeRow.fps > 0
      ? activeRow.fps
      : 12;
  const frameIntervalMs = Math.round(captureIntervalFromFps(activeRow?.fps));
  useEffect(() => {
    setPlaying(false);
    setActiveFrameIndex(0);
    thumbnailRefs.current = [];
  }, [activeRow?.uuid]);

  useEffect(() => {
    if (!activeRow) return;
    setActiveFrameIndex((index) =>
      Math.max(0, Math.min(index, activeRow.images.length - 1)),
    );
  }, [activeRow]);

  useEffect(() => {
    thumbnailRefs.current[currentFrameIndex]?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: playing ? "auto" : "smooth",
    });
  }, [activeRow?.uuid, currentFrameIndex, playing]);

  useEffect(() => {
    if (!playing || !activeRow || activeRow.images.length <= 1) return;

    // Plays at the row's real frame rate — the same number written into the
    // exported manifest — so the preview is the export. Clamping the rate to a
    // whole ≥1 fps made every slow sequence play back at 1000ms no matter how
    // far apart its frames were captured.
    const playbackDelay = Math.max(
      16,
      Math.round(captureIntervalFromFps(activeRow.fps)),
    );
    const timeoutId = window.setTimeout(() => {
      setActiveFrameIndex((index) => {
        const nextIndex = index + 1;
        if (nextIndex < activeRow.images.length) return nextIndex;
        if (loop) return 0;
        setPlaying(false);
        return index;
      });
    }, playbackDelay);

    return () => window.clearTimeout(timeoutId);
  }, [activeFrameIndex, activeRow, loop, playing]);

  const removeRow = useCallback(
    (index: number) => {
      const nextSelected =
        index === selectedRow
          ? Math.max(0, selectedRow - 1)
          : index < selectedRow
            ? Math.max(0, selectedRow - 1)
            : selectedRow;

      setSelectedRow(Math.min(nextSelected, Math.max(0, rows.length - 2)));
      removeImagesRow(index);
    },
    [removeImagesRow, rows.length, selectedRow, setSelectedRow],
  );

  const removeAllRows = useCallback(() => {
    confirm.delete("all rows", {
      onConfirm: () => {
        setImages([]);
        setSelectedRow(0);
        setPlaying(false);
        setActiveFrameIndex(0);
      },
    });
  }, [setImages, setPlaying, setActiveFrameIndex, setSelectedRow]);

  const selectPreviousFrame = useCallback(() => {
    if (!activeRow || activeRow.images.length <= 1) return;
    setPlaying(false);
    setActiveFrameIndex((index) =>
      index > 0 ? index - 1 : loop ? activeRow.images.length - 1 : 0,
    );
  }, [activeRow, loop]);

  const selectNextFrame = useCallback(() => {
    if (!activeRow || activeRow.images.length <= 1) return;
    setPlaying(false);
    setActiveFrameIndex((index) =>
      index + 1 < activeRow.images.length ? index + 1 : loop ? 0 : index,
    );
  }, [activeRow, loop]);

  /*
    No wrapper of its own: this sits inside the Capture stage, which already
    names it and reports its counts. A second header here would restate the
    stage it belongs to and make the rail look one level deeper than it is.
  */
  return (
    <div>
      {rows.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">
              Captured sequences will appear here.
            </p>
          ) : (
            <div className="grid gap-2.5">
              {/*
                Sequences as chips, not a stacked list. The tile sits under the
                viewport where height is the scarce dimension, and picking which
                sequence to watch is a one-click choice — a list of expandable
                rows spends vertical space on editing that most of the time
                nobody is doing. The editing lives behind "Edit sequence".
              */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Sequence
                </span>
                {rows.map((row, index) => {
                  const selected = selectedRow === index;
                  return (
                    <button
                      key={row.uuid}
                      type="button"
                      onClick={() => setSelectedRow(index)}
                      aria-pressed={selected}
                      className={cn(
                        "flex h-[19px] items-center gap-1.5 rounded-md border px-2 text-[10px] transition-colors",
                        selected
                          ? "border-transparent bg-brand-soft font-semibold text-foreground"
                          : "border-stroke text-muted-foreground hover:bg-row-hover hover:text-foreground",
                      )}
                    >
                      <span className="max-w-28 truncate">{row.label}</span>
                      <span className="font-mono text-[9px] text-faint-foreground tabular-nums">
                        {row.images.length}
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setLoop((value) => !value)}
                  aria-pressed={loop}
                  className={cn(
                    "ml-auto flex h-[19px] items-center gap-1.5 rounded-md border px-2 text-[10px] font-semibold transition-colors",
                    loop
                      ? "border-brand-line bg-brand-soft text-brand"
                      : "border-stroke text-muted-foreground hover:bg-row-hover hover:text-foreground",
                  )}
                >
                  <Repeat size={10} />
                  Loop
                </button>
                <span className="shrink-0 font-mono text-[10px] text-faint-foreground tabular-nums">
                  {activeRow && activeRow.images.length > 0
                    ? `${currentFrameIndex + 1} / ${activeRow.images.length}`
                    : "0 / 0"}
                </span>
              </div>

              {editing && (
                <div className="grid gap-1.5 rounded-md border border-stroke bg-surface-sunken p-1.5">
                  <div className="grid max-h-40 gap-1 overflow-auto pr-1">
                    {rows.map((row, index) => (
                      <SequenceRow
                        key={row.uuid}
                        row={row}
                        index={index}
                        selected={selectedRow === index}
                        onSelect={() => setSelectedRow(index)}
                        onRemove={() => removeRow(index)}
                      />
                    ))}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-6 w-max justify-self-end px-2 text-[11px]"
                    onClick={removeAllRows}
                  >
                    <Trash2 size={12} />
                    Delete all rows
                  </Button>
                </div>
              )}

              {/*
                Transport, laid out as: step · frame · step, then the scrubber
                and the two edit scopes beside it. The frame reads as a carousel
                because the steppers flank the frame itself rather than the
                strip — you are moving through frames, not scrolling a list.
              */}
              <div className="flex items-stretch gap-2">
                <button
                  type="button"
                  onClick={selectPreviousFrame}
                  disabled={(activeRow?.images.length ?? 0) <= 1}
                  aria-label="Previous frame"
                  className="grid w-6 shrink-0 place-items-center rounded-md border border-stroke text-muted-foreground transition-colors hover:bg-row-hover hover:text-foreground disabled:opacity-40"
                >
                  <ChevronLeft size={13} />
                </button>

                <div className="checkerboard relative size-24 shrink-0 overflow-hidden rounded-md border border-stroke">
                  {currentFrame ? (
                    <TransformWrapper
                      key={activeRow?.uuid}
                      maxScale={50}
                      wheel={{ step: 0.08 }}
                      doubleClick={{ mode: "reset" }}
                    >
                      {/* Wheel zooms, drag pans, double-click resets — the
                          controls are the pointer, so the tile stays a frame
                          rather than a toolbar. */}
                      <TransformComponent
                        wrapperStyle={{ width: "100%", height: "100%" }}
                        wrapperClass="items-center justify-center"
                      >
                        <div
                          className="relative"
                          style={{
                            width: activeRow?.frameWidth,
                            height: activeRow?.frameHeight,
                            imageRendering: "pixelated",
                          }}
                        >
                          {activeRow?.images.map((imageSrc, index) => (
                            <img
                              key={`${activeRow.uuid}-${index}`}
                              className={cn(
                                "absolute inset-0 size-full object-contain",
                                index === currentFrameIndex
                                  ? "opacity-100"
                                  : "pointer-events-none opacity-0",
                              )}
                              style={{ imageRendering: "pixelated" }}
                              src={addDataToImageIfNeeded(imageSrc)}
                              alt={`${activeRow.label} frame ${index + 1}`}
                              draggable={false}
                            />
                          ))}
                        </div>
                      </TransformComponent>
                    </TransformWrapper>
                  ) : (
                    <span className="grid size-full place-items-center px-2 text-center text-[10px] text-muted-foreground">
                      No frames
                    </span>
                  )}
                  {activeRow && activeRow.images.length > 0 && (
                    <span className="pointer-events-none absolute bottom-0.5 right-1 font-mono text-[9px] text-faint-foreground tabular-nums">
                      {currentFrameIndex + 1}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={selectNextFrame}
                  disabled={(activeRow?.images.length ?? 0) <= 1}
                  aria-label="Next frame"
                  className="grid w-6 shrink-0 place-items-center rounded-md border border-stroke text-muted-foreground transition-colors hover:bg-row-hover hover:text-foreground disabled:opacity-40"
                >
                  <ChevronRight size={13} />
                </button>

                <div className="grid min-w-0 flex-1 content-start gap-1.5">
                  {/* min-w-0: a flex item defaults to min-width:auto, which
                      lets the strip push the row wider than the panel instead
                      of scrolling inside it. */}
                  <div className="flex min-w-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPlaying((value) => !value)}
                      disabled={(activeRow?.images.length ?? 0) <= 1}
                      aria-pressed={playing}
                      aria-label={playing ? "Pause sequence" : "Play sequence"}
                      className="grid size-[22px] shrink-0 place-items-center rounded-md border border-stroke bg-surface-highest text-foreground transition-colors hover:bg-surface-high disabled:opacity-40"
                    >
                      {playing ? <Pause size={11} /> : <Play size={11} />}
                    </button>
                    {/*
                      The frames themselves, not an abstract scrubber. These
                      are exactly what gets written into the spritesheet, in
                      the order it will write them, so the strip doubles as the
                      export's contents and as the timeline you scrub. The
                      active frame stays scrolled to the centre while playing.
                    */}
                    <div className="no-scrollbar -my-1 flex min-w-0 flex-1 gap-1 overflow-x-auto py-1">
                      {(activeRow?.images ?? []).map((imageSrc, index) => {
                        const active = index === currentFrameIndex;
                        return (
                          <button
                            key={index}
                            type="button"
                            ref={(node) => {
                              thumbnailRefs.current[index] = node;
                            }}
                            aria-label={`Go to frame ${index + 1}`}
                            aria-current={active}
                            title={`Frame ${index + 1}`}
                            onClick={() => {
                              setPlaying(false);
                              setActiveFrameIndex(index);
                            }}
                            className={cn(
                              "checkerboard relative size-9 shrink-0 overflow-hidden rounded-md border transition-colors",
                              active
                                ? "border-brand"
                                : "border-stroke opacity-60 hover:border-stroke-strong hover:opacity-100",
                            )}
                          >
                            <img
                              src={addDataToImageIfNeeded(imageSrc)}
                              alt=""
                              aria-hidden="true"
                              draggable={false}
                              className="size-full object-contain"
                              style={{ imageRendering: "pixelated" }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* The cadence, then two edit scopes — so it is never
                      ambiguous which one you are about to change: the frame
                      shown to the left, or the sequence selected above. */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/*
                      Playback rate for the selected sequence, stored on the row
                      itself. The transport above reads the same number, so the
                      preview retimes as you scrub it — and it is the rate the
                      manifest and every generated engine file carry, which is
                      why it sits here rather than in a settings pane.
                    */}
                    <ScrubField
                      className="h-[22px] w-24"
                      label="Rate"
                      unit="fps"
                      value={Math.round(rowFps * 100) / 100}
                      min={0.1}
                      max={240}
                      step={1}
                      disabled={!activeRow}
                      aria-label="Sequence frame rate"
                      data-testid="sequence-fps-field"
                      onValueChange={(next) => {
                        if (!activeRow) return;
                        updateFps(activeRow.uuid, next);
                      }}
                    />
                    <span className="font-mono text-[10px] text-faint-foreground tabular-nums">
                      {frameIntervalMs}ms/frame
                    </span>
                    <button
                      type="button"
                      disabled={!activeRow || activeRow.images.length === 0}
                      onClick={() => {
                        if (!activeRow) return;
                        reorderItems({
                          items: activeRow.images.map((src, frameIndex) => ({
                            src,
                            id: frameIndex,
                          })),
                          onChange: (items) =>
                            updateImagesRow(
                              selectedRow,
                              items.map((item) => item.src),
                              activeRow.normalImages
                                ? items.map(
                                    (item) => activeRow.normalImages![item.id],
                                  )
                                : undefined,
                            ),
                          onRenderItem: (item) => (
                            <img
                              key={`${item.id}`}
                              className="size-24 rounded-md object-contain"
                              src={addDataToImageIfNeeded(item.src)}
                              alt={`Frame ${item.id + 1}`}
                            />
                          ),
                        });
                      }}
                      className="flex h-[22px] items-center gap-1.5 rounded-md border border-stroke px-2 text-[10px] text-muted-foreground transition-colors hover:bg-row-hover hover:text-foreground disabled:opacity-40"
                    >
                      <Pencil size={10} />
                      Edit frame {currentFrameIndex + 1}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing((value) => !value)}
                      aria-pressed={editing}
                      className={cn(
                        "flex h-[22px] items-center gap-1.5 rounded-md border px-2 text-[10px] transition-colors",
                        editing
                          ? "border-brand-line bg-brand-soft text-foreground"
                          : "border-stroke text-muted-foreground hover:bg-row-hover hover:text-foreground",
                      )}
                    >
                      <Layers size={10} />
                      Edit sequence
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
    </div>
  );
}
