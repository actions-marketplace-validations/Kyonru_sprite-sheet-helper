import { Viewport } from "./shared";
import { ATLAS, CAPTURE, PLACEMENTS, SCENE_ITEMS, SELECTED, EXPORT_STATE } from "./fixtures";

/**
 * Variant F — Blueprint / dimensioned drawing.
 *
 * Thesis: this app is a measuring instrument — frame size, safe margin, page
 * dimensions, packing coordinates. So measurement *is* the visual language.
 * The atlas map is drawn as a dimensioned figure with witness lines and real
 * numbers, not as a chart.
 */

const C = {
  ground: "#0e2740",
  panel: "#123050",
  ink: "#e8f2fb",
  line: "rgba(190,222,250,0.34)",
  hair: "rgba(190,222,250,0.16)",
  dim: "#8fb4d6",
  faint: "#5d87ae",
  cyan: "#6fd3ff",
  warn: "#ffca67",
};

const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

/** Drafting grid, so every surface reads as drawn on paper. */
const GRID = {
  backgroundImage: `linear-gradient(${C.hair} 1px, transparent 1px), linear-gradient(90deg, ${C.hair} 1px, transparent 1px)`,
  backgroundSize: "16px 16px",
};

function RuleLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 10px 6px" }}>
      <span
        style={{
          fontSize: 9,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color: C.dim,
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
      <span style={{ flex: 1, height: 1, background: C.line }} />
    </div>
  );
}

function Spec({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <span style={{ fontSize: 10, color: C.dim }}>{label}</span>
      <span style={{ flex: 1, borderBottom: `1px dotted ${C.hair}`, transform: "translateY(-3px)" }} />
      <span style={{ fontFamily: mono, fontSize: 11, color: C.ink }}>
        {value}
        {unit ? <span style={{ color: C.faint }}>{unit}</span> : null}
      </span>
    </div>
  );
}

/** The atlas page, drawn as a figure with dimension lines on two edges. */
function DimensionedAtlas() {
  return (
    <div style={{ padding: "2px 10px 0" }}>
      {/* horizontal dimension */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, width: 116, margin: "0 auto 3px", paddingLeft: 18 }}>
        <span style={{ width: 1, height: 6, background: C.cyan }} />
        <span style={{ flex: 1, height: 1, background: C.cyan }} />
        <span style={{ fontFamily: mono, fontSize: 9, color: C.cyan }}>{ATLAS.width}</span>
        <span style={{ flex: 1, height: 1, background: C.cyan }} />
        <span style={{ width: 1, height: 6, background: C.cyan }} />
      </div>
      <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
        {/* vertical dimension */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 14 }}>
          <span style={{ height: 1, width: 6, background: C.cyan }} />
          <span style={{ flex: 1, width: 1, background: C.cyan }} />
          <span
            style={{
              fontFamily: mono,
              fontSize: 9,
              color: C.cyan,
              writingMode: "vertical-rl",
              padding: "2px 0",
            }}
          >
            {ATLAS.height}
          </span>
          <span style={{ flex: 1, width: 1, background: C.cyan }} />
          <span style={{ height: 1, width: 6, background: C.cyan }} />
        </div>
        <div
          style={{
            position: "relative",
            width: 116,
            height: 116 * (ATLAS.height / ATLAS.width),
            border: `1px solid ${C.line}`,
            background: "rgba(0,0,0,0.22)",
            ...GRID,
            backgroundSize: "12.5% 12.5%",
          }}
        >
          {PLACEMENTS.map((item, index) => (
            <span
              key={index}
              style={{
                position: "absolute",
                left: `${(item.x / ATLAS.width) * 100}%`,
                top: `${(item.y / ATLAS.height) * 100}%`,
                width: `${(item.w / ATLAS.width) * 100}%`,
                height: `${(item.h / ATLAS.height) * 100}%`,
                border: `1px solid ${C.cyan}`,
                background: "rgba(111,211,255,0.16)",
              }}
            />
          ))}
          {/* leader line annotating the unused region */}
          <span
            style={{
              position: "absolute",
              right: 4,
              bottom: 4,
              fontFamily: mono,
              fontSize: 8,
              color: C.warn,
              border: `1px dashed ${C.warn}`,
              padding: "0 3px",
            }}
          >
            unused
          </span>
        </div>
      </div>
    </div>
  );
}

export function VariantF() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "200px 1fr 224px",
        height: 428,
        background: C.ground,
        color: C.ink,
        border: `1px solid ${C.line}`,
        overflow: "hidden",
        fontSize: 11,
        ...GRID,
      }}
    >
      {/* Left rail */}
      <div style={{ borderRight: `1px solid ${C.line}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ display: "flex", borderBottom: `1px solid ${C.line}` }}>
          {["Explorer", "Effects"].map((tab, i) => (
            <button
              key={tab}
              style={{
                flex: 1,
                padding: "7px 0",
                fontSize: 9,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                background: i === 0 ? "rgba(111,211,255,0.10)" : "transparent",
                color: i === 0 ? C.cyan : C.faint,
                border: "none",
                borderBottom: i === 0 ? `1px solid ${C.cyan}` : "1px solid transparent",
                cursor: "pointer",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <RuleLabel>Scene · {SCENE_ITEMS.length}</RuleLabel>
        <div style={{ padding: "0 10px" }}>
          {SCENE_ITEMS.map((item, i) => (
            <div
              key={item.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "3px 5px",
                marginLeft: -5,
                border: item.selected ? `1px dashed ${C.cyan}` : "1px dashed transparent",
                color: item.selected ? C.ink : C.dim,
              }}
            >
              <span style={{ fontFamily: mono, fontSize: 9, color: C.faint }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {item.name}
            </div>
          ))}
        </div>
        <RuleLabel>{SELECTED.name}</RuleLabel>
        <div style={{ padding: "0 10px", display: "grid", gap: 5 }}>
          <Spec label="Position X" value={SELECTED.position[0].toFixed(2)} />
          <Spec label="Position Y" value={SELECTED.position[1].toFixed(2)} />
          <Spec label="Position Z" value={SELECTED.position[2].toFixed(2)} />
          <Spec label="Rotation Y" value={SELECTED.rotation[1]} unit="°" />
        </div>
      </div>

      {/* Viewport */}
      <Viewport
        background="rgba(0,0,0,0.30)"
        frame={C.cyan}
        checker="rgba(190,222,250,0.08)"
        label="knight.glb · idle · frame 4/8"
        labelStyle={{ fontFamily: mono, fontSize: 9, color: C.dim, letterSpacing: 0.4 }}
      />

      {/* Export rail */}
      <div style={{ borderLeft: `1px solid ${C.line}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px 10px",
            borderBottom: `1px solid ${C.line}`,
            fontSize: 9,
            letterSpacing: 1.4,
            textTransform: "uppercase",
          }}
        >
          Export · Sheet 1 of 1
          <span style={{ marginLeft: "auto", color: C.cyan, letterSpacing: 0 }}>Ready</span>
        </div>
        <DimensionedAtlas />
        <div style={{ padding: "8px 10px 0", display: "grid", gap: 5 }}>
          <Spec label="Frames" value={ATLAS.frameCount} />
          <Spec label="Coverage" value={ATLAS.coverageLabel} />
        </div>
        <RuleLabel>Capture</RuleLabel>
        <div style={{ padding: "0 10px", display: "grid", gap: 5 }}>
          <Spec label="Interval" value={CAPTURE.interval} unit="ms" />
          <Spec label="Frame size" value={`${CAPTURE.width}×${CAPTURE.height}`} unit="px" />
          <Spec label="Safe margin" value={CAPTURE.safeMargin} unit="px" />
        </div>
        <div style={{ marginTop: "auto", padding: 10, borderTop: `1px solid ${C.line}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.dim, marginBottom: 7 }}>
            <span>{EXPORT_STATE.format}</span>
            <span style={{ fontFamily: mono }}>{EXPORT_STATE.files} files</span>
          </div>
          <button
            style={{
              width: "100%",
              padding: "7px 0",
              background: "transparent",
              border: `1px solid ${C.cyan}`,
              color: C.cyan,
              fontSize: 10,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Prepare Export
          </button>
        </div>
      </div>
    </div>
  );
}
