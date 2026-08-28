import { AtlasMini, Viewport } from "./shared";
import { ATLAS, CAPTURE, SCENE_ITEMS, SELECTED, EXPORT_STATE } from "./fixtures";

/**
 * Variant D — Neo-brutalism (the control).
 *
 * Thick black borders, hard offset shadows, flat saturated fields, chunky
 * uppercase type, zero radii. Included honestly and at full strength so the
 * comparison is real: watch what the yellow and pink panels do to your read of
 * the sprite in the middle.
 */

const C = {
  bg: "#f4f1e8",
  ink: "#111111",
  yellow: "#ffe83f",
  pink: "#ff75c3",
  cyan: "#70e2ff",
  lime: "#9fff5b",
  white: "#ffffff",
};

const shadow = `4px 4px 0 ${C.ink}`;
const border = `3px solid ${C.ink}`;
const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

function Box({
  children,
  bg = C.white,
  style,
}: {
  children: React.ReactNode;
  bg?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ border, background: bg, boxShadow: shadow, ...style }}>{children}</div>
  );
}

function Title({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <div
      style={{
        background: bg,
        borderBottom: border,
        padding: "4px 7px",
        fontSize: 11,
        fontWeight: 900,
        textTransform: "uppercase",
        letterSpacing: 0.6,
        color: C.ink,
      }}
    >
      {children}
    </div>
  );
}

export function VariantD() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "200px 1fr 216px",
        gap: 12,
        height: 428,
        background: C.bg,
        color: C.ink,
        padding: 12,
        overflow: "hidden",
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {/* Left rail */}
      <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: 12, minHeight: 0 }}>
        <Box bg={C.white}>
          <Title bg={C.cyan}>Scene · 5</Title>
          <div style={{ padding: 4 }}>
            {SCENE_ITEMS.map((item) => (
              <div
                key={item.name}
                style={{
                  padding: "3px 6px",
                  marginBottom: 2,
                  border: item.selected ? `2px solid ${C.ink}` : "2px solid transparent",
                  background: item.selected ? C.yellow : "transparent",
                  fontSize: 11,
                }}
              >
                {item.name}
              </div>
            ))}
          </div>
        </Box>
        <Box bg={C.white} style={{ minHeight: 0, overflow: "hidden" }}>
          <Title bg={C.pink}>{SELECTED.name}</Title>
          <div style={{ padding: 7, display: "grid", gap: 7 }}>
            {(["Position", "Rotation"] as const).map((label) => (
              <div key={label} style={{ display: "grid", gap: 3 }}>
                <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {label}
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                  {(label === "Position" ? SELECTED.position : SELECTED.rotation).map((value, i) => (
                    <div
                      key={i}
                      style={{
                        border: `2px solid ${C.ink}`,
                        background: C.white,
                        padding: "3px 5px",
                        fontFamily: mono,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {value}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Box>
      </div>

      {/* Viewport */}
      <Box bg={C.ink} style={{ minHeight: 0, overflow: "hidden", display: "grid" }}>
        <Viewport
          background={C.ink}
          checker="rgba(255,255,255,0.07)"
          label="KNIGHT.GLB · IDLE · 4/8"
          labelStyle={{
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: 0.8,
            color: C.yellow,
            background: C.ink,
            padding: "2px 6px",
            border: `2px solid ${C.yellow}`,
          }}
        />
      </Box>

      {/* Export rail */}
      <div style={{ display: "grid", gridTemplateRows: "auto auto 1fr auto", gap: 10, minHeight: 0 }}>
        <Box bg={C.white}>
          <Title bg={C.lime}>Export · Ready</Title>
          <div style={{ padding: 6 }}>
            <AtlasMini
              fill={C.pink}
              checker="rgba(0,0,0,0.10)"
              page={C.white}
              border={C.ink}
              gapColor={C.ink}
              radius={0}
              height={74}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: mono,
                fontSize: 11,
                fontWeight: 900,
                marginTop: 5,
              }}
            >
              <span>{ATLAS.width}×{ATLAS.height}</span>
              <span>{ATLAS.frameCount}F</span>
            </div>
          </div>
        </Box>
        <Box bg={C.yellow}>
          <div style={{ padding: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
            {[
              { label: "Interval", value: CAPTURE.interval },
              { label: "Frames", value: CAPTURE.frames },
            ].map((field) => (
              <div key={field.label} style={{ display: "grid", gap: 2 }}>
                <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {field.label}
                </span>
                <div
                  style={{
                    border: `2px solid ${C.ink}`,
                    background: C.white,
                    padding: "3px 5px",
                    fontFamily: mono,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {field.value}
                </div>
              </div>
            ))}
          </div>
        </Box>
        <Box bg={C.white} style={{ minHeight: 0 }}>
          <div style={{ padding: 6, display: "grid", gap: 4 }}>
            {["Sequences · 3", "Effects · OFF"].map((row) => (
              <div
                key={row}
                style={{
                  border: `2px solid ${C.ink}`,
                  padding: "3px 6px",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                }}
              >
                {row}
              </div>
            ))}
          </div>
        </Box>
        <button
          style={{
            border,
            background: C.pink,
            boxShadow: shadow,
            color: C.ink,
            padding: "9px 0",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            cursor: "pointer",
          }}
        >
          Prepare Export · {EXPORT_STATE.files}
        </button>
      </div>
    </div>
  );
}
