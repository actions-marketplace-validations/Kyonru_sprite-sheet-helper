import { PLACEMENTS, ATLAS } from "./fixtures";

/**
 * The artwork the chrome sits beside. Identical in every variant — it is the
 * control in this experiment, and the whole point is to see which chrome
 * distorts your read of it.
 */
const SPRITE_ROWS = [
  "................",
  "......aaaa......",
  ".....acccca.....",
  ".....acbbca.....",
  ".....acbbca.....",
  "......abba......",
  "....aadddaa..e..",
  "...adddddddaee..",
  "...addddddda.e..",
  "...addddddda....",
  "....addddda.....",
  "....add.dda.....",
  "....ad...da.....",
  "....ad...da.....",
  "....aa...aa.....",
  "................",
];

const SPRITE_COLORS: Record<string, string> = {
  a: "#1b1b22",
  b: "#e8b98a",
  c: "#c9d1d9",
  d: "#5b7fb5",
  e: "#d9dde3",
};

export function SpriteGlyph({ size = 96 }: { size?: number }) {
  const cell = size / 16;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ imageRendering: "pixelated", display: "block" }}
      aria-label="Sprite preview"
    >
      {SPRITE_ROWS.map((row, y) =>
        [...row].map((ch, x) => {
          const fill = SPRITE_COLORS[ch];
          if (!fill) return null;
          return (
            <rect
              key={`${x}-${y}`}
              x={x * cell}
              y={y * cell}
              width={cell}
              height={cell}
              fill={fill}
            />
          );
        }),
      )}
    </svg>
  );
}

/** Transparency checkerboard — the idiom every sprite tool already uses. */
export function checkerBackground(color: string, size = 8) {
  return {
    background: `repeating-conic-gradient(${color} 0% 25%, transparent 0% 50%) 0 0 / ${size}px ${size}px`,
  };
}

type AtlasMiniProps = {
  /** Draw the real frame contents instead of solid blocks. */
  sprites?: boolean;
  fill: string;
  checker: string;
  page: string;
  radius?: number;
  border?: string;
  gapColor?: string;
  height?: number;
};

/** The atlas page miniature, restyleable per variant. */
export function AtlasMini({
  fill,
  checker,
  page,
  radius = 3,
  border,
  gapColor,
  height = 96,
  sprites = false,
}: AtlasMiniProps) {
  // Aspect-correct: a square atlas must not render as a wide rectangle, or the
  // map lies about the page it represents. Same rule the shipped AtlasMap uses.
  const aspect = ATLAS.width / ATLAS.height;
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: height * aspect,
        height,
        margin: "0 auto",
        borderRadius: radius,
        overflow: "hidden",
        border: border ? `1px solid ${border}` : undefined,
        backgroundColor: page,
        ...checkerBackground(checker),
      }}
    >
      {PLACEMENTS.map((item, index) => {
        const cellW = (item.w / ATLAS.width) * height * aspect;
        return (
          <span
            key={index}
            style={{
              position: "absolute",
              left: `${(item.x / ATLAS.width) * 100}%`,
              top: `${(item.y / ATLAS.height) * 100}%`,
              width: `${(item.w / ATLAS.width) * 100}%`,
              height: `${(item.h / ATLAS.height) * 100}%`,
              // Sprite mode shows what is actually written to the page; block
              // mode keeps the abstract readout the other variants use.
              background: sprites ? "transparent" : fill,
              boxShadow: `inset 0 0 0 1px ${gapColor ?? page}`,
              opacity: sprites ? 1 : 0.78 + (item.row % 3) * 0.08,
              display: sprites ? "grid" : undefined,
              placeItems: sprites ? "center" : undefined,
            }}
          >
            {sprites ? <SpriteGlyph size={Math.max(8, cellW - 2)} /> : null}
          </span>
        );
      })}
    </div>
  );
}

/** Viewport stand-in: the 3D view with the sprite being judged inside it. */
export function Viewport({
  background = "#141416",
  frame,
  glow,
  label,
  labelStyle,
  checker,
}: {
  background?: string;
  frame?: string;
  glow?: string;
  label?: string;
  labelStyle?: React.CSSProperties;
  checker?: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        display: "grid",
        placeItems: "center",
        background,
        boxShadow: glow,
      }}
    >
      <div
        style={{
          position: "relative",
          padding: 12,
          border: frame ? `1px solid ${frame}` : undefined,
          ...(checker ? checkerBackground(checker, 10) : {}),
        }}
      >
        <SpriteGlyph size={112} />
      </div>
      {label ? (
        <div style={{ position: "absolute", bottom: 8, ...labelStyle }}>
          {label}
        </div>
      ) : null}
    </div>
  );
}
