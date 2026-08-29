import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  Download,
  FileArchive,
  Film,
  Gamepad2,
  Layers,
  Package,
  Play,
  Plus,
  SquareStack,
  Trash2Icon,
  Crosshair,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrubField } from "@/components/ui/scrub-field";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EventType, PubSub } from "@/lib/events";
import { useEntitiesStore } from "@/store/next/entities";
import { useImagesStore } from "@/store/next/images";
import { useSettingsStore } from "@/store/next/settings";
import type { ExportFormat, ExportRow } from "@/types/file";
import { exporters } from "@/utils/exports";
import {
  DEFAULT_ATLAS_OPTIONS,
  atlasPageFileName,
  getAtlasPageCoverage,
} from "@/utils/atlas";
import { dedupeFileNames } from "@/utils/exports/helpers";
import {
  getExportSummary,
  validateExportRequest,
  type ExportStage,
  type ExportValidationMessage,
} from "@/utils/export-validation";
import {
  clearExportHistory,
  loadExportHistory,
  type ExportHistoryEntry,
} from "@/utils/export-history";
import { PanelEmpty } from "@/components/panels/panel-empty";
import { PanelHeader } from "@/components/panels/panel-header";
import {
  Stage,
  ValidationNote,
  stageStateFor,
} from "./export-workbench/pipeline";
import { AtlasMap } from "./export-workbench/atlas-map";
import { PackSettings } from "./export-workbench/pack-settings";
import { SheetAssignments } from "./export-workbench/sheet-assignments";
import { WritesTree } from "./export-workbench/writes-tree";
import {
  ControlGroup,
  PanelSection,
} from "./export-workbench/panel-section";
import { SpritePostprocessWorkbench } from "./export-workbench/sprite-postprocess";
import { useSpritePostprocessStore } from "@/store/next/sprite-postprocess";
import { useFitCamera } from "@/hooks/next/use-fit-camera";

const FORMAT_NOTES: Partial<
  Record<ExportFormat, { category: string; note: string }>
> = {
  spritesheet: {
    category: "Generic atlas",
    note: "Best for custom engines and multi-page JSON exports.",
  },
  zip: {
    category: "Raw frames",
    note: "Exports individual captured frames; atlas settings do not apply.",
  },
  gif: {
    category: "Animation",
    note: "Creates animated GIF output; normal maps are not emitted.",
  },
  phaser: {
    category: "Engine package",
    note: "Generates Phaser atlas JSON and helper TypeScript.",
  },
  bevy: {
    category: "Engine package",
    note: "Generates Bevy sprite rects and a starter plugin.",
  },
  godot: {
    category: "Engine package",
    note: "Packages Godot atlas metadata and helper files.",
  },
  unity: {
    category: "Engine package",
    note: "Generates Unity sprite metadata and setup notes.",
  },
  "love2d-lua": {
    category: "Engine package",
    note: "Generates Lua quads for LÖVE 2D.",
  },
  "love2d-anim8": {
    category: "Engine package",
    note: "Generates anim8-friendly Lua helpers.",
  },
  turbo: {
    category: "Engine package",
    note: "Generates Turbo Rust spritesheet helpers.",
  },
  pygame: {
    category: "Engine package",
    note: "Generates Python loader helpers.",
  },
  raylib: {
    category: "Engine package",
    note: "Generates C header metadata for raylib.",
  },
};

/**
 * Category order for the export dialog. Declared rather than derived: the
 * generic atlas is what most people want, engine packages are the long tail.
 */
/**
 * Below this share of the page in use, the atlas is mostly empty space.
 *
 * Above it the number is not actionable — the packer is already doing its job —
 * so the readout stays quiet rather than reporting a figure nobody acts on.
 */
const WASTED_PAGE_COVERAGE = 0.2;

/**
 * Tallest the atlas miniature gets in the export dialog.
 *
 * Well above the rail's cap — the dialog is the surface with room to show the
 * page properly — but still short enough that the file list below it stays on
 * screen without scrolling.
 */
const PREFLIGHT_MAP_HEIGHT = 260;

const FORMAT_CATEGORY_ORDER = [
  "Generic atlas",
  "Raw frames",
  "Animation",
  "Engine package",
] as const;

const FORMAT_ICONS: Record<ExportFormat, LucideIcon> = {
  spritesheet: SquareStack,
  zip: FileArchive,
  gif: Film,
  phaser: Gamepad2,
  bevy: Package,
  godot: Package,
  unity: Package,
  "love2d-lua": Gamepad2,
  "love2d-anim8": Gamepad2,
  turbo: Code2,
  pygame: Code2,
  raylib: Code2,
};

type FormatLogo = {
  light: string;
  dark?: string;
};

const FORMAT_LOGOS: Partial<Record<ExportFormat, FormatLogo>> = {
  phaser: { light: "/phaser.png" },
  bevy: { light: "/bevy.svg" },
  godot: { light: "/godot.png" },
  unity: { light: "/unity.svg", dark: "/unity_dark.svg" },
  "love2d-lua": { light: "/love.svg" },
  "love2d-anim8": { light: "/love.svg" },
  turbo: { light: "/turbo.svg" },
  pygame: { light: "/pygame.svg" },
  raylib: { light: "/raylib.png" },
};

const FORMAT_GROUPS = FORMAT_CATEGORY_ORDER.map((category) => ({
  category,
  formats: Object.values(exporters).filter(
    (exporter) => FORMAT_NOTES[exporter.id]?.category === category,
  ),
})).filter((group) => group.formats.length > 0);

function getFormatLogo(format: ExportFormat, theme: "light" | "dark") {
  const logo = FORMAT_LOGOS[format];
  if (!logo) return undefined;
  return theme === "dark" && logo.dark ? logo.dark : logo.light;
}

function FormatMark({
  format,
  selected,
  theme,
  compact = false,
}: {
  format: ExportFormat;
  selected: boolean;
  theme: "light" | "dark";
  compact?: boolean;
}) {
  const logo = getFormatLogo(format, theme);
  const Icon = FORMAT_ICONS[format];

  /*
    Two substrates on purpose. Our own icons are ours to theme, so they sit on
    the surface tile and take the accent when selected. A third-party logo is
    not ours to recolour — several ship with black fills that disappear on a
    dark ground, and only Unity has a dark variant — so every brand mark gets a
    light chip, which is the background it was drawn for.
  */
  if (logo) {
    return (
      <span
        className={cn(
          "inline-grid shrink-0 place-items-center rounded-md border bg-[#e9eaec]",
          compact ? "size-6" : "size-8",
          selected ? "border-brand-line" : "border-stroke-strong",
        )}
      >
        <img
          src={logo}
          alt=""
          aria-hidden="true"
          className={cn("object-contain", compact ? "size-4" : "size-5")}
          draggable={false}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-md border",
        compact ? "size-6" : "size-8",
        selected
          ? "border-brand-line bg-brand-soft text-brand"
          : "border-stroke bg-surface-high text-faint-foreground",
      )}
    >
      <Icon size={compact ? 14 : 16} />
    </span>
  );
}

function ValidationMessages({
  messages,
}: {
  messages: ExportValidationMessage[];
}) {
  if (messages.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700">
        <CheckCircle2 size={14} />
        Export checks look good.
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {messages.map((message, index) => (
        <div
          key={`${message.severity}-${index}`}
          className={cn(
            "flex items-start gap-2 rounded-md border px-3 py-2 text-xs",
            message.severity === "error"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-amber-500/30 bg-amber-500/10 text-amber-700",
          )}
        >
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{message.message}</span>
        </div>
      ))}
    </div>
  );
}

function NumberField({
  label,
  value,
  unit,
  min = 0,
  max,
  step = 1,
  inputTestId,
  onChange,
}: {
  label: string;
  value: number;
  /** Rendered inside the field, so the label stays a name and not a spec. */
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  inputTestId?: string;
  onChange: (value: number) => void;
}) {
  return (
    <ScrubField
      label={label}
      value={value}
      unit={unit}
      min={min}
      max={max}
      step={step}
      onValueChange={onChange}
      data-testid={inputTestId}
    />
  );
}

function StatusPill({
  blocking,
  warnings,
  className,
}: {
  blocking: boolean;
  warnings: number;
  className?: string;
}) {
  const tone = blocking
    ? "border-destructive/30 bg-destructive/10 text-destructive"
    : warnings > 0
      ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  const label = blocking
    ? "Needs fixes"
    : warnings > 0
      ? `${warnings} warning${warnings === 1 ? "" : "s"}`
      : "Ready";

  return (
    <span
      className={cn(
        "rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
        tone,
        className,
      )}
    >
      {label}
    </span>
  );
}

function EmptyCapture({ isRecording }: { isRecording: boolean }) {
  return (
    <PanelEmpty
      icon={Film}
      title="No frames captured"
      description="Pose the scene, then record a sequence to build an atlas."
      boxed
    >
      <Button
        size="sm"
        disabled={isRecording}
        onClick={() => PubSub.emit(EventType.START_ASSETS_CREATION)}
      >
        <Play size={13} />
        Record sequence
      </Button>
    </PanelEmpty>
  );
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getPreflightOutputFiles({
  format,
  rows,
  atlasFiles,
  normalFiles,
}: {
  format: ExportFormat;
  rows: ExportRow[];
  atlasFiles: string[];
  normalFiles: string[];
}) {
  const colorAtlasFiles =
    atlasFiles.length > 0 ? atlasFiles : ["spritesheet.png"];
  const genericAtlasFiles = [
    ...colorAtlasFiles,
    ...normalFiles,
    "spritesheet.json",
    "spritesheet.manifest.json",
  ];
  const singlePageNormalFiles = normalFiles.slice(0, 1);

  switch (format) {
    case "zip": {
      const frameFiles = rows.flatMap((row) =>
        row.images.map((_, index) => `${row.label}/${row.uuid}_${index}.png`),
      );
      return frameFiles.length > 0 ? frameFiles : ["<sequence>/<frame>.png"];
    }
    case "gif": {
      const gifFiles = rows.map((row) => `${row.label}.gif`);
      return gifFiles.length > 0 ? gifFiles : ["<sequence>.gif"];
    }
    case "spritesheet":
      return genericAtlasFiles;
    case "phaser":
      return [
        "spritesheet.png",
        ...singlePageNormalFiles,
        "spritesheet_atlas.json",
        "spritesheet.manifest.json",
        "spritesheet_phaser.ts",
        "example.ts",
      ];
    case "bevy":
      return [
        "assets/spritesheet.png",
        ...singlePageNormalFiles.map((file) => `assets/${file}`),
        "assets/spritesheet.manifest.json",
        "src/spritesheet.rs",
        "src/main.rs",
        "Cargo.toml.snippet",
      ];
    case "godot":
      return [
        "spritesheet.png",
        ...singlePageNormalFiles,
        "spritesheet.manifest.json",
        "SpriteSheetHelper.gd",
        "ExamplePlayer.gd",
      ];
    case "love2d-lua":
    case "love2d-anim8":
      return [
        "spritesheet.png",
        ...singlePageNormalFiles,
        "spritesheet.json",
        "spritesheet.manifest.json",
        "spritesheet.lua",
        "main.lua",
      ];
    case "turbo":
      return [
        "spritesheet.png",
        ...singlePageNormalFiles,
        "spritesheet.json",
        "spritesheet.manifest.json",
        "spritesheet_turbo.rs",
        "example.rs",
      ];
    case "pygame":
      return [
        "spritesheet.png",
        ...singlePageNormalFiles,
        "spritesheet.manifest.json",
        "spritesheet.py",
        "main.py",
      ];
    case "raylib":
      return [
        "spritesheet.png",
        ...singlePageNormalFiles,
        "spritesheet.manifest.json",
        "spritesheet.h",
        "main.c",
      ];
    case "unity":
      return [
        "spritesheet.png",
        ...singlePageNormalFiles,
        "spritesheet.manifest.json",
        "SpriteSheetAnimator.cs",
        "ExamplePlayer.cs",
      ];
  }
}

export function ExportWorkbench() {
  const rows = useImagesStore((state) => state.images);
  const intervals = useImagesStore((state) => state.intervals);
  const iterations = useImagesStore((state) => state.iterations);
  const fps = useImagesStore((state) => state.fps);
  const setIntervals = useImagesStore((state) => state.setIntervals);
  const setIterations = useImagesStore((state) => state.setIterations);
  const setFPS = useImagesStore((state) => state.setFPS);

  const mode = useSettingsStore((state) => state.mode);
  const setMode = useSettingsStore((state) => state.setMode);
  const theme = useSettingsStore((state) => state.theme);
  const exportWidth = useSettingsStore((state) => state.exportWidth);
  const exportHeight = useSettingsStore((state) => state.exportHeight);
  const setExportWidth = useSettingsStore((state) => state.setExportWidth);
  const fitMargin = useSettingsStore((state) => state.fitMargin);
  const setFitMargin = useSettingsStore((state) => state.setFitMargin);
  const setExportHeight = useSettingsStore((state) => state.setExportHeight);
  const exportNormalMap = useSettingsStore((state) => state.exportNormalMap);
  const setExportNormalMap = useSettingsStore(
    (state) => state.setExportNormalMap,
  );
  const atlasLayout = useSettingsStore((state) => state.atlasLayout);
  const atlasPadding = useSettingsStore((state) => state.atlasPadding);
  const atlasBleed = useSettingsStore((state) => state.atlasBleed);
  const atlasSpriteMargin = useSettingsStore(
    (state) => state.atlasSpriteMargin,
  );
  const atlasScale = useSettingsStore((state) => state.atlasScale);
  const maxAtlasSize = useSettingsStore((state) => state.maxAtlasSize);
  const allowMultiPage = useSettingsStore((state) => state.allowMultiPage);
  const setAtlasOptions = useSettingsStore((state) => state.setAtlasOptions);

  const { fitCameraToAnimation } = useFitCamera();
  const postprocessEnabled = useSpritePostprocessStore((state) => state.enabled);
  const postprocessEffectCount = useSpritePostprocessStore(
    (state) => state.effects.filter((effect) => effect.enabled).length,
  );
  const postprocessHint = postprocessEnabled
    ? `${postprocessEffectCount} on`
    : "off";

  const entityCount = useEntitiesStore(
    (state) => Object.keys(state.entities).length,
  );

  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const [preflightOpen, setPreflightOpen] = useState(false);
  /** Which sheet the dialog's map and readout are showing. */
  const [selectedSheet, setSelectedSheet] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [history, setHistory] = useState<ExportHistoryEntry[]>(() =>
    loadExportHistory(),
  );

  const atlasOptions = useMemo(
    () => ({
      layout: atlasLayout,
      padding: atlasPadding,
      extrude: atlasBleed,
      spriteMargin: atlasSpriteMargin,
      scale: atlasScale,
      maxAtlasSize,
      allowMultiPage,
    }),
    [
      allowMultiPage,
      atlasBleed,
      atlasSpriteMargin,
      atlasLayout,
      atlasPadding,
      atlasScale,
      maxAtlasSize,
    ],
  );
  const validation = useMemo(
    () =>
      validateExportRequest({
        rows,
        format: mode,
        includeNormalMap: exportNormalMap,
        atlasOptions,
      }),
    [atlasOptions, exportNormalMap, mode, rows],
  );
  const summary = useMemo(
    () => getExportSummary(rows, atlasOptions),
    [atlasOptions, rows],
  );

  const sheets = validation.sheets;
  // A sheet can vanish under the selection: reassign the last sequence out of
  // one and it stops existing, which must not leave the map pointed at nothing.
  const activeSheet = sheets[Math.min(selectedSheet, sheets.length - 1)] ?? null;

  /**
   * The width the miniature will actually occupy, so the readout beside it can
   * be laid out against a real number instead of a column that only the map
   * knows how to size. The map caps its height and derives its width from the
   * page's aspect ratio; this is that same derivation, and it falls back to the
   * map's own 2:1 placeholder when there is no page yet.
   */
  const mapWidth = useMemo(() => {
    const width = activeSheet?.imageWidth ?? 0;
    const height = activeSheet?.imageHeight ?? 0;
    const ratio = width > 0 && height > 0 ? width / height : 2;
    return Math.round(PREFLIGHT_MAP_HEIGHT * ratio);
  }, [activeSheet?.imageHeight, activeSheet?.imageWidth]);

  const pageCoverage = useMemo(
    () => getAtlasPageCoverage(activeSheet?.plan ?? null),
    [activeSheet?.plan],
  );

  /**
   * Messages routed to the stage that owns them, so a problem is reported where
   * it can be fixed rather than in one undifferentiated list at the bottom.
   * Anything unstaged falls through to the footer.
   */
  const stageMessages = useMemo(() => {
    const byStage: Record<ExportStage, ExportValidationMessage[]> = {
      scene: [],
      capture: [],
      effects: [],
      pack: [],
      export: [],
    };
    for (const message of validation.messages) {
      if (message.stage) byStage[message.stage].push(message);
    }
    return byStage;
  }, [validation.messages]);

  /** The furthest stage with nothing blocking it — what the action tile reports. */
  const reachedStage = useMemo(() => {
    if (entityCount === 0) return 1;
    if (rows.length === 0) return 2;
    if (validation.blocking) return 4;
    return 5;
  }, [entityCount, rows.length, validation.blocking]);

  const unstagedMessages = useMemo(
    () => validation.messages.filter((message) => !message.stage),
    [validation.messages],
  );

  const selectedExporter = exporters[mode];
  const warningCount = validation.messages.filter(
    (message) => message.severity === "warning",
  ).length;

  useEffect(() => {
    const onStopExport = () => {
      setExporting(false);
      setHistory(loadExportHistory());
    };
    PubSub.on(EventType.STOP_EXPORT, onStopExport);
    return () => {
      PubSub.off(EventType.STOP_EXPORT, onStopExport);
    };
  }, []);

  useEffect(() => {
    const onStartAssetsCreation = () => {
      setIsRecording(true);
    };

    const onStopAssetsCreation = () => {
      setIsRecording(false);
    };

    PubSub.on(EventType.START_ASSETS_CREATION, onStartAssetsCreation);
    PubSub.on(EventType.STOP_ASSETS_CREATION, onStopAssetsCreation);
    return () => {
      PubSub.off(EventType.START_ASSETS_CREATION, onStartAssetsCreation);
      PubSub.off(EventType.STOP_ASSETS_CREATION, onStopAssetsCreation);
    };
  }, []);

  const startExport = () => {
    setExporting(true);
    PubSub.emit(EventType.START_EXPORT, {
      format: mode,
      atlasOptions,
      spritePostprocess: useSpritePostprocessStore.getState().getSnapshot(),
    });
    setPreflightOpen(false);
  };

  const atlasFiles =
    validation.plan?.pages.map((page) =>
      atlasPageFileName("spritesheet.png", page.index),
    ) ?? [];
  const normalFiles =
    exportNormalMap && validation.plan
      ? validation.plan.pages.map((page) =>
          atlasPageFileName("spritesheet_normal.png", page.index),
        )
      : [];
  const outputFiles = dedupeFileNames(
    getPreflightOutputFiles({
      format: mode,
      rows,
      atlasFiles,
      normalFiles,
    }),
  );

  return (
    /*
      Two tiles: the pipeline, and the one action. Matching the other columns —
      each concern gets its own surface and the gutter between them carries the
      separation, rather than a shared border inside one big pane.
    */
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-stroke bg-card">
      <PanelHeader icon={FileArchive} title="Export">
        <StatusPill blocking={validation.blocking} warnings={warningCount} />
      </PanelHeader>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3 pt-1">
        {/*
          The rail is a pipeline: scene → capture → effects → pack → export.
          Each stage depends only on the ones above it, and reports its own
          state, so "what is blocking me" is answerable without opening
          anything. It is a status map rather than a wizard — every stage stays
          reachable, because people re-record after seeing the atlas.
        */}
        <Stage
          index={1}
          title="Scene"
          hint={`${entityCount} object${entityCount === 1 ? "" : "s"}`}
          state={entityCount > 0 ? "done" : "todo"}
        />

        <Stage
          index={2}
          title="Capture"
          hint={
            rows.length > 0
              ? `${summary.animationCount} seq · ${summary.frameCount}f`
              : `${exportWidth}×${exportHeight}`
          }
          state={stageStateFor(
            "capture",
            validation.messages,
            rows.length > 0 ? "done" : "active",
          )}
        >
          <div className="grid gap-3">
            {stageMessages.capture.map((message, index) => (
              <ValidationNote key={index} message={message} showDetail />
            ))}

            <ControlGroup label="Timing">
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label="Interval"
                  unit="ms"
                  value={intervals}
                  min={1}
                  onChange={setIntervals}
                />
                <NumberField
                  label="Frames"
                  value={iterations}
                  min={1}
                  onChange={setIterations}
                />
              </div>
              {/*
                Named `fps` in the store, but it reaches gif.js as `delay`, and
                only for rows that carry no rate of their own — a sequence's own
                rate, set beside its preview, is what the GIF and every manifest
                are written with.
              */}
              <NumberField
                label="GIF delay fallback"
                unit="ms"
                value={fps}
                min={1}
                onChange={setFPS}
              />
            </ControlGroup>

            <ControlGroup label="Frame size">
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label="Width"
                  unit="px"
                  value={exportWidth}
                  min={1}
                  onChange={setExportWidth}
                />
                <NumberField
                  label="Height"
                  unit="px"
                  value={exportHeight}
                  min={1}
                  onChange={setExportHeight}
                />
              </div>
            </ControlGroup>

            <ControlGroup label="Framing">
              <div className="grid grid-cols-[1fr_auto] items-end gap-2">
                <NumberField
                  label="Margin"
                  unit="px"
                  value={fitMargin}
                  min={0}
                  onChange={setFitMargin}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 gap-1.5 px-2 text-[11px]"
                  title="Solve a camera distance that fits every animation inside this margin"
                  onClick={() => {
                    const result = fitCameraToAnimation({
                      margin: fitMargin,
                      marginUnit: "px",
                    });
                    if (result.fitted) {
                      toast.success(
                        `Fitted at distance ${result.distance?.toFixed(2)}`,
                      );
                    } else {
                      toast.error(result.warnings[0] ?? "Nothing to fit.");
                    }
                  }}
                >
                  <Crosshair size={12} />
                  Fit
                </Button>
              </div>
            </ControlGroup>

            <label className="flex items-center justify-between gap-2 text-[11px]">
              <span className="text-muted-foreground">Capture normal maps</span>
              <Switch
                checked={exportNormalMap}
                onCheckedChange={(checked) =>
                  setExportNormalMap(Boolean(checked))
                }
              />
            </label>

            <div className="grid grid-cols-3 gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-6 gap-1 px-2 text-[11px]"
                onClick={() => PubSub.emit(EventType.START_ASSETS_CREATION)}
                disabled={isRecording}
              >
                <Play size={12} />
                Record
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 gap-1 px-2 text-[11px]"
                onClick={() => PubSub.emit(EventType.TAKE_SINGLE_SCREENSHOT)}
              >
                <Plus size={12} />
                Frame
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 gap-1 px-2 text-[11px]"
                onClick={() => PubSub.emit(EventType.NEW_SEQUENCE)}
              >
                <Layers size={12} />
                Row
              </Button>
            </div>
          </div>
        </Stage>

        <Stage
          index={3}
          title="Effects"
          hint={postprocessHint}
          state={stageStateFor(
            "effects",
            validation.messages,
            postprocessEnabled ? "done" : "todo",
          )}
        >
          <SpritePostprocessWorkbench rows={rows} atlasOptions={atlasOptions} />
        </Stage>

        <Stage
          index={4}
          title="Pack"
          hint={
            activeSheet?.plan
              ? `${sheets.length > 1 ? `${sheets.length} sheets · ` : ""}${activeSheet.imageWidth}×${activeSheet.imageHeight}`
              : undefined
          }
          state={stageStateFor(
            "pack",
            validation.messages,
            rows.length > 0 ? "active" : "todo",
          )}
        >
          <div className="grid gap-2">
            {rows.length === 0 ? (
              <EmptyCapture isRecording={isRecording} />
            ) : (
              <>
                {/* One map per rail, so it shows one sheet: the chips say
                    which, and say plainly that there is more than one atlas
                    coming out — the map alone would read as the whole export. */}
                {sheets.length > 1 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {sheets.map((sheet, index) => {
                      const active =
                        index === Math.min(selectedSheet, sheets.length - 1);
                      return (
                        <button
                          key={sheet.name}
                          type="button"
                          onClick={() => setSelectedSheet(index)}
                          aria-pressed={active}
                          className={cn(
                            "flex h-[19px] items-center gap-1.5 rounded-md border px-2 text-[10px] transition-colors",
                            active
                              ? "border-transparent bg-brand-soft font-semibold text-foreground"
                              : "border-stroke text-muted-foreground hover:bg-row-hover hover:text-foreground",
                          )}
                        >
                          <span className="max-w-28 truncate">{sheet.name}</span>
                          <span className="font-mono text-[9px] text-faint-foreground tabular-nums">
                            {sheet.frameCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <AtlasMap
                  plan={activeSheet?.plan ?? null}
                  rows={activeSheet?.rows}
                  frameCount={activeSheet?.frameCount ?? 0}
                  sequenceCount={activeSheet?.animationCount ?? 0}
                />
              </>
            )}
            {stageMessages.pack.map((message, index) => (
              <ValidationNote key={index} message={message} showDetail />
            ))}
            {rows.length > 0 && <PackSettings />}
          </div>
        </Stage>

        <Stage
          index={5}
          title="Export"
          hint={
            rows.length === 0
              ? undefined
              : `${outputFiles.length} file${outputFiles.length === 1 ? "" : "s"}`
          }
          state={stageStateFor("export", validation.messages, "todo")}
          last
        >
          {stageMessages.export.length > 0 ? (
            <div className="grid gap-2">
              {stageMessages.export.map((message, index) => (
                <ValidationNote key={index} message={message} showDetail />
              ))}
            </div>
          ) : null}
        </Stage>

        <div className="mt-1 border-t border-stroke pt-1">
          <PanelSection
            title="Recent exports"
            hint={history.length > 0 ? `${history.length}` : undefined}
          >
            {history.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                Successful exports will appear here.
              </p>
            ) : (
              <div className="grid gap-1.5">
                {history.slice(0, 5).map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-sm bg-row-hover px-2.5 py-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="truncate font-medium">
                        {entry.filename}
                      </span>
                      <span className="shrink-0 text-faint-foreground tabular-nums">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-faint-foreground tabular-nums">
                      {entry.format} · {entry.frameCount} frames ·{" "}
                      {entry.pageCount} page{entry.pageCount === 1 ? "" : "s"}
                    </div>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  className="justify-start text-muted-foreground"
                  onClick={() => setHistory(clearExportHistory())}
                >
                  <Trash2Icon size={13} />
                  Clear history
                </Button>
              </div>
            )}
          </PanelSection>
        </div>
      </div>

      </div>

      {/*
        The one action, on its own tile. It reports which stage the pipeline has
        reached, so the button is never the only thing telling you whether the
        export is ready.
      */}
      <footer className="shrink-0 rounded-lg border border-stroke bg-surface-high p-2">
        {/*
          Only messages with no stage of their own land here. Anything the
          pipeline already reports is reported once, beside the control that
          fixes it — printing it again above the button would make the reader
          check whether it is a second, different problem.
        */}
        {unstagedMessages.length > 0 && (
          <div className="mb-2.5">
            <ValidationMessages messages={unstagedMessages.slice(0, 2)} />
            {unstagedMessages.length > 2 && (
              <button
                type="button"
                onClick={() => setPreflightOpen(true)}
                className="mt-1 text-[11px] text-muted-foreground underline-offset-2 hover:underline"
              >
                +{unstagedMessages.length - 2} more in preflight
              </button>
            )}
          </div>
        )}

        <div className="mb-2 flex items-baseline justify-between gap-2">
          <span className="truncate text-[11px] font-semibold">
            {selectedExporter.label}
          </span>
          <span className="shrink-0 font-mono text-[10px] text-faint-foreground tabular-nums">
            {rows.length === 0
              ? "stage 2 of 5"
              : validation.blocking
                ? "blocked"
                : `stage ${reachedStage} of 5 · ${outputFiles.length} file${outputFiles.length === 1 ? "" : "s"}`}
          </span>
        </div>

        <Button
          className="w-full gap-2"
          data-testid="prepare-export-button"
          onClick={() => setPreflightOpen(true)}
          disabled={exporting || rows.length === 0}
        >
          <Download size={15} />
          {exporting ? "Exporting…" : "Prepare Export"}
        </Button>
      </footer>

      {/*
        The export dialog is not a second settings screen. By the time it opens,
        the rail has already reported the atlas state and the pack options live
        in the Pack stage, next to the map they change. So this answers one
        question: what exactly is about to be written, and where.

        Format on the left, because it is the only real choice left to make;
        the consequences of that choice on the right, updating as you pick.
      */}
      <Dialog open={preflightOpen} onOpenChange={setPreflightOpen}>
        <DialogContent
          className="z-999 flex max-h-[min(88vh,720px)] w-[calc(100vw-2rem)] max-w-[980px] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-[980px]"
          onOpenAutoFocus={(event) => {
            // Otherwise focus lands on whichever format is first in the DOM,
            // which reads as if that format were selected.
            event.preventDefault();
            exportButtonRef.current?.focus();
          }}
        >
          <DialogHeader className="shrink-0 space-y-0 border-b border-stroke px-3.5 py-3 pe-12 text-left">
            <div className="flex flex-wrap items-baseline gap-2">
              <DialogTitle className="text-[13px] font-semibold">
                Prepare export
              </DialogTitle>
              <DialogDescription className="font-mono text-[10px] text-faint-foreground tabular-nums">
                {summary.animationCount} sequence
                {summary.animationCount === 1 ? "" : "s"} ·{" "}
                {summary.frameCount} frame
                {summary.frameCount === 1 ? "" : "s"}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 grid-cols-[232px_minmax(0,1fr)] overflow-hidden">
            {/* Format: grouped the way the app groups formats. */}
            <div className="min-h-0 overflow-y-auto border-e border-stroke p-2">
              {FORMAT_GROUPS.map((group) => (
                <div key={group.category}>
                  <div className="px-1.5 pb-1 pt-2 text-[9px] font-medium uppercase tracking-wider text-faint-foreground">
                    {group.category}
                  </div>
                  {group.formats.map((exporter) => {
                    const note = FORMAT_NOTES[exporter.id];
                    const selected = mode === exporter.id;
                    return (
                      <button
                        key={exporter.id}
                        type="button"
                        data-testid={`export-format-${exporter.id}`}
                        onClick={() => setMode(exporter.id)}
                        className={cn(
                          "relative w-full rounded-md px-2 py-1.5 text-left transition-colors",
                          selected ? "bg-brand-soft" : "hover:bg-row-hover",
                        )}
                      >
                        {selected && (
                          <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-brand" />
                        )}
                        <span className="flex items-start gap-2">
                          <FormatMark
                            format={exporter.id}
                            selected={selected}
                            theme={theme}
                            compact
                          />
                          <span className="min-w-0 pt-0.5">
                            <span
                              className={cn(
                                "block truncate text-[11px]",
                                selected
                                  ? "font-semibold text-foreground"
                                  : "text-muted-foreground",
                              )}
                            >
                              {exporter.label}
                            </span>
                            {/* Only the selected format explains itself:
                                twelve descriptions at once is a wall, not a
                                choice. */}
                            {selected && note?.note ? (
                              <span className="mt-0.5 block text-[10px] leading-snug text-faint-foreground">
                                {note.note}
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Consequences of that choice. */}
            <div className="grid min-h-0 gap-3 overflow-y-auto p-3 content-start">
              {/*
                The map is height-capped, so its width is whatever its aspect
                ratio makes of that cap — it can never fill a `1fr` column. Left
                as one, the map hugged the left edge and the numbers floated off
                at the far right with a few hundred pixels of nothing between
                them. So the map takes exactly its own width and the readout
                takes the rest: the two sit together, and the slack lands inside
                a panel that is meant to be wide.
              */}
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 shrink" style={{ flexBasis: mapWidth }}>
                  <AtlasMap
                    plan={activeSheet?.plan ?? null}
                    rows={activeSheet?.rows}
                    frameCount={activeSheet?.frameCount ?? 0}
                    sequenceCount={activeSheet?.animationCount ?? 0}
                    compact
                    maxHeight={PREFLIGHT_MAP_HEIGHT}
                  />
                </div>
                {/*
                  Same border, tone and radius as the map beside it: one readout
                  in two halves, the picture and its spec, rather than a card
                  parked next to a picture. Narrow on purpose — three short rows
                  need no more, and a panel stretched to the pane would put a
                  hand's width of nothing between each label and its value.
                */}
                <dl className="grid min-w-40 max-w-3xs flex-1 content-start gap-2.5 rounded-md border border-stroke bg-surface-sunken p-2.5">
                  <div>
                    <dt className="text-[9px] font-medium uppercase tracking-wider text-faint-foreground">
                      {sheets.length > 1 && activeSheet
                        ? activeSheet.name
                        : "Atlas page"}
                    </dt>
                    {/* The headline: the one number here that decides whether
                        the atlas fits the target, so it is the one that reads
                        first. */}
                    <dd className="mt-1 font-mono text-[15px] font-semibold leading-none tabular-nums">
                      {activeSheet && activeSheet.imageWidth > 0
                        ? `${activeSheet.imageWidth}×${activeSheet.imageHeight}`
                        : "—"}
                      <span className="ms-1 text-[9px] font-normal text-faint-foreground">
                        px
                      </span>
                    </dd>
                  </div>

                  <div className="grid gap-1.5 border-t border-stroke pt-2.5">
                    {[
                      ["Pages", `${activeSheet?.pageCount ?? 0}`],
                      ["Frames", `${activeSheet?.frameCount ?? 0}`],
                      ...(sheets.length > 1
                        ? ([["Sheets", `${sheets.length}`]] as const)
                        : []),
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-baseline justify-between gap-2"
                      >
                        <dt className="text-[10px] text-faint-foreground">
                          {label}
                        </dt>
                        <dd className="font-mono text-[11px] tabular-nums">
                          {value}
                        </dd>
                      </div>
                    ))}

                    {/*
                      Coverage only earns a row when it is bad enough to act on.
                      At 74% there is nothing to do about it — the packer is
                      already doing its job, and a number nobody acts on trains
                      you to skip the whole panel. Under a fifth of the page in
                      use means a smaller max size would still hold every frame,
                      which is worth interrupting for, so that is the only time
                      it appears.
                    */}
                    {(activeSheet?.imageWidth ?? 0) > 0 &&
                      pageCoverage < WASTED_PAGE_COVERAGE && (
                        <div className="flex items-baseline justify-between gap-2">
                          <dt className="text-[10px] text-warn">Page used</dt>
                          <dd className="font-mono text-[11px] text-warn tabular-nums">
                            {Math.round(pageCoverage * 100)}%
                          </dd>
                        </div>
                      )}
                  </div>
                </dl>
              </div>

              {/*
                What lands in which spritesheet — and the packing that decides
                how. Both live here because the map above answers for them: the
                dialog is where you can see the consequence of a regroup or a
                padding change without closing anything.
              */}
              {rows.length > 0 && (
                <div className="grid gap-1.5">
                  <div className="flex items-baseline">
                    <span className="text-[9px] font-medium uppercase tracking-wider text-faint-foreground">
                      Sheets
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-faint-foreground">
                      {sheets.length} sheet{sheets.length === 1 ? "" : "s"} ·{" "}
                      {summary.animationCount} sequence
                      {summary.animationCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  <SheetAssignments
                    sheets={sheets}
                    selected={Math.min(selectedSheet, sheets.length - 1)}
                    onSelect={setSelectedSheet}
                  />
                </div>
              )}

              {rows.length > 0 && (
                <div className="grid gap-1.5">
                  <span className="text-[9px] font-medium uppercase tracking-wider text-faint-foreground">
                    Packing
                  </span>
                  <PackSettings />
                </div>
              )}

              {/*
                Same headlines as the rail, word for word. The dialog is the
                surface with room for the detail, so it is the one that shows
                it — progressive depth, never a reworded warning.
              */}
              {validation.messages.length > 0 && (
                <div className="grid gap-1.5">
                  {validation.messages.map((message, index) => (
                    <ValidationNote key={index} message={message} showDetail />
                  ))}
                </div>
              )}

              <div className="grid gap-1.5">
                <div className="flex items-baseline">
                  <span className="text-[9px] font-medium uppercase tracking-wider text-faint-foreground">
                    Writes
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-faint-foreground">
                    {outputFiles.length} file
                    {outputFiles.length === 1 ? "" : "s"}
                  </span>
                </div>
                <WritesTree files={outputFiles} />
              </div>
            </div>
          </div>

          <footer className="flex shrink-0 items-center gap-2 border-t border-stroke bg-surface-high px-3.5 py-2.5">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[11px] text-muted-foreground"
              onClick={() =>
                setAtlasOptions({
                  layout: DEFAULT_ATLAS_OPTIONS.layout,
                  padding: DEFAULT_ATLAS_OPTIONS.padding,
                  extrude: DEFAULT_ATLAS_OPTIONS.extrude,
                  scale: DEFAULT_ATLAS_OPTIONS.scale,
                  maxAtlasSize: DEFAULT_ATLAS_OPTIONS.maxAtlasSize,
                  allowMultiPage: DEFAULT_ATLAS_OPTIONS.allowMultiPage,
                })
              }
            >
              Reset atlas
            </Button>
            <div className="ml-auto flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-[11px]"
                onClick={() => setPreflightOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-7 gap-1.5 px-4 text-[11px] font-bold"
                ref={exportButtonRef}
                data-testid="preflight-export-button"
                onClick={startExport}
                disabled={validation.blocking || exporting}
              >
                <Download size={13} />
                {exporting ? "Exporting…" : "Export"}
              </Button>
            </div>
          </footer>
        </DialogContent>
      </Dialog>
    </div>
  );
}
