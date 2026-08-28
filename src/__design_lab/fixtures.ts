/**
 * Shared fixture data for the design lab. Every variant renders exactly this,
 * so differences on screen are design differences and nothing else.
 */

export const SCENE_ITEMS = [
  { name: "Main Camera", type: "camera", selected: true },
  { name: "Ambient Light", type: "light", selected: false },
  { name: "Key Light", type: "light", selected: false },
  { name: "knight.glb", type: "model", selected: false },
  { name: "sword.glb", type: "model", selected: false },
] as const;

export const SELECTED = {
  name: "knight.glb",
  typeLabel: "Model",
  uuid: "6238eada-15fb-430c-9a41-2c1f9d0e77b3",
  position: [0, 0, 0] as [number, number, number],
  rotation: [0, 45, 0] as [number, number, number],
  scale: [1, 1, 1] as [number, number, number],
};

export const CAPTURE = {
  interval: 100,
  frames: 10,
  gifDelay: 100,
  width: 64,
  height: 64,
  safeMargin: 2,
  normalMaps: false,
};

const PAGE = { width: 320, height: 128 };
const FRAME = { w: 32, h: 64 };
/** 10 slots per row, 2 rows: one full row plus a short second one. */
export const COLS = PAGE.width / FRAME.w;
export const ROWS = PAGE.height / FRAME.h;
const FRAME_COUNT = 14;

/** Row/frame layout of the fixture atlas, in atlas pixel coordinates. */
export const PLACEMENTS = Array.from({ length: FRAME_COUNT }, (_, i) => {
  const row = Math.floor(i / COLS);
  const col = i % COLS;
  return { row, col, x: col * FRAME.w, y: row * FRAME.h, w: FRAME.w, h: FRAME.h };
});

const COVERAGE =
  PLACEMENTS.reduce((acc, item) => acc + item.w * item.h, 0) /
  (PAGE.width * PAGE.height);

export const ATLAS = {
  ...PAGE,
  sequences: 3,
  frameCount: FRAME_COUNT,
  coverage: COVERAGE,
  /** Pre-formatted so every variant reports the same number. */
  coverageLabel: `${Math.round(COVERAGE * 100)}%`,
};

export const SEQUENCES = [
  { name: "idle", frames: 6, selected: true },
  { name: "walk", frames: 5, selected: false },
  { name: "attack", frames: 3, selected: false },
];

export const EXPORT_STATE = {
  format: "Spritesheet",
  files: 2,
  status: "ready" as "ready" | "warning" | "blocked",
  warnings: 1,
};

/** Format catalogue for the export dialog, grouped the way the app groups it. */
export const EXPORT_FORMATS = [
  {
    category: "Generic atlas",
    name: "Spritesheet",
    note: "Atlas PNG + JSON. Best for custom engines.",
    mark: "stack" as const,
    selected: true,
  },
  {
    category: "Raw frames",
    name: "ZIP of frames",
    note: "Individual PNGs. Atlas settings do not apply.",
    mark: "archive" as const,
  },
  {
    category: "Animation",
    name: "Animated GIF",
    note: "One GIF per sequence. No normal maps.",
    mark: "film" as const,
  },
  {
    category: "Engine package",
    name: "Phaser",
    note: "Atlas JSON plus a helper TypeScript module.",
    logo: "/phaser.png",
  },
  {
    category: "Engine package",
    name: "Godot",
    note: "Atlas metadata and helper resources.",
    // NB: the app's FORMAT_LOGOS points at /godot.svg, which does not exist —
    // the file in public/ is godot.png. See run-log.
    logo: "/godot.png",
  },
  {
    category: "Engine package",
    name: "Bevy",
    note: "Sprite rects and a starter plugin.",
    logo: "/bevy.svg",
  },
  {
    category: "Engine package",
    name: "LÖVE (anim8)",
    note: "anim8-friendly Lua helpers.",
    logo: "/love.svg",
  },
];

/** What the selected format will actually write. */
export const OUTPUT_FILES = [
  { name: "knight-atlas.png", kind: "image", size: "42.1 KB" },
  { name: "knight-atlas.json", kind: "json", size: "3.1 KB" },
];

/**
 * One honest warning, consistent across every surface that reports it:
 * 320×128 is not a power of two, which some engines require.
 */
export const VALIDATION = [
  {
    level: "warning" as const,
    title: "Page is not a power of two",
    /** Rail-sized. The headline is identical everywhere; only the depth varies. */
    short: "Some engines require POT textures.",
    detail: "320×128. Some engines require POT textures; padding to 512×128 costs 60% waste.",
    fix: "Pad to 512×128",
  },
];
