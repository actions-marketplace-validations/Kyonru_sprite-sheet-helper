import { SpriteGlyph, checkerBackground } from "./shared";
import { ATLAS, CAPTURE, SCENE_ITEMS, SELECTED, SEQUENCES, EXPORT_STATE } from "./fixtures";

/**
 * Variant H — Contact sheet.
 *
 * Thesis: you are *recording sequences*. That is cinematography, not
 * dashboards. Sequences render as film strips with sprocket edges and frame
 * numbers; the atlas is a proof sheet; selection is a grease-pencil mark.
 *
 * The metaphor is deliberately confined to the capture surfaces — the
 * inspector stays plain, because that is where kitsch would start.
 */

const C = {
  bg: "#171514",
  panel: "#1f1c1b",
  paper: "#e8e4dc",
  film: "#0d0c0c",
  ink: "#ddd8d0",
  dim: "#948d84",
  faint: "#635d57",
  line: "#2e2a28",
  pencil: "#e0504a",
};

const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

/** Sprocket edge — the detail that makes a strip read as film. */
function Sprockets() {
  return (
    <div
      style={{
        height: 7,
        background: `repeating-linear-gradient(90deg, ${C.paper} 0 5px, transparent 5px 12px)`,
        opacity: 0.55,
      }}
    />
  );
}

function Strip({ name, frames, selected }: { name: string; frames: number; selected: boolean }) {
  return (
    <div style={{ position: "relative", marginBottom: 7 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
        <span style={{ fontFamily: mono, fontSize: 10, color: selected ? C.pencil : C.dim }}>
          {name}
        </span>
        <span style={{ fontFamily: mono, fontSize: 9, color: C.faint }}>{frames} frames</span>
      </div>
      <div
        style={{
          background: C.film,
          border: selected ? `2px solid ${C.pencil}` : `1px solid ${C.line}`,
          padding: "2px 0",
        }}
      >
        <Sprockets />
        <div style={{ display: "flex", gap: 2, padding: "2px 3px" }}>
          {Array.from({ length: Math.min(frames, 6) }, (_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                aspectRatio: "1",
                ...checkerBackground("rgba(255,255,255,0.06)", 5),
                background: "#1a1918",
                display: "grid",
                placeItems: "center",
                position: "relative",
              }}
            >
              <SpriteGlyph size={20} />
              <span
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 1,
                  fontFamily: mono,
                  fontSize: 6,
                  color: C.faint,
                }}
              >
                {i + 1}
              </span>
            </div>
          ))}
        </div>
        <Sprockets />
      </div>
    </div>
  );
}

export function VariantH() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "196px 1fr 232px",
        height: 428,
        background: C.bg,
        color: C.ink,
        border: `1px solid ${C.line}`,
        overflow: "hidden",
        fontSize: 11,
      }}
    >
      {/* Left rail — deliberately plain */}
      <div style={{ borderRight: `1px solid ${C.line}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ display: "flex", borderBottom: `1px solid ${C.line}` }}>
          {["Explorer", "Effects"].map((tab, i) => (
            <button
              key={tab}
              style={{
                flex: 1,
                padding: "7px 0",
                fontSize: 10,
                background: "transparent",
                border: "none",
                borderBottom: i === 0 ? `2px solid ${C.pencil}` : "2px solid transparent",
                color: i === 0 ? C.ink : C.faint,
                cursor: "pointer",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <div style={{ padding: "8px 10px 4px", fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: C.faint }}>
          Scene
        </div>
        <div style={{ padding: "0 10px" }}>
          {SCENE_ITEMS.map((item) => (
            <div
              key={item.name}
              style={{
                padding: "3px 0",
                color: item.selected ? C.ink : C.dim,
                borderLeft: item.selected ? `2px solid ${C.pencil}` : "2px solid transparent",
                paddingLeft: 7,
              }}
            >
              {item.name}
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 10px 4px", fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: C.faint }}>
          {SELECTED.name}
        </div>
        <div style={{ padding: "0 10px", display: "grid", gap: 5 }}>
          {(["Position", "Rotation"] as const).map((label) => (
            <div key={label} style={{ display: "grid", gap: 3 }}>
              <span style={{ fontSize: 9, color: C.faint }}>{label}</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                {(label === "Position" ? SELECTED.position : SELECTED.rotation).map((value, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#141211",
                      border: `1px solid ${C.line}`,
                      padding: "3px 5px",
                      fontFamily: mono,
                      fontSize: 10,
                    }}
                  >
                    {value}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Viewport — the frame currently on the light table */}
      <div style={{ display: "grid", placeItems: "center", background: "#121110", position: "relative" }}>
        <div style={{ background: C.paper, padding: "10px 10px 26px", boxShadow: "0 6px 22px rgba(0,0,0,0.5)" }}>
          <div style={{ ...checkerBackground("rgba(0,0,0,0.08)", 8), background: "#f4f1ea", padding: 8 }}>
            <SpriteGlyph size={104} />
          </div>
          <div
            style={{
              marginTop: 7,
              fontFamily: mono,
              fontSize: 9,
              color: "#3a3733",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>knight.glb</span>
            <span>idle 4/8</span>
          </div>
        </div>
      </div>

      {/* Export rail — the proof sheet */}
      <div style={{ borderLeft: `1px solid ${C.line}`, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px 10px",
            borderBottom: `1px solid ${C.line}`,
            fontSize: 9,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: C.dim,
          }}
        >
          Proof sheet
          <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 10, color: C.pencil, letterSpacing: 0, textTransform: "none" }}>
            {ATLAS.width}×{ATLAS.height}
          </span>
        </div>
        <div style={{ padding: 10, minHeight: 0, overflow: "hidden" }}>
          {SEQUENCES.map((seq) => (
            <Strip key={seq.name} name={seq.name} frames={seq.frames} selected={seq.selected} />
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: 9, color: C.faint, marginTop: 2 }}>
            <span>{ATLAS.frameCount} exposures</span>
            <span>{ATLAS.coverageLabel} of sheet</span>
          </div>
        </div>
        <div style={{ marginTop: "auto", borderTop: `1px solid ${C.line}`, padding: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.dim, marginBottom: 7 }}>
            <span>{EXPORT_STATE.format}</span>
            <span style={{ fontFamily: mono }}>
              {CAPTURE.interval}ms · {EXPORT_STATE.files} files
            </span>
          </div>
          <button
            style={{
              width: "100%",
              padding: "8px 0",
              background: C.pencil,
              color: "#fff",
              border: "none",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.5,
              cursor: "pointer",
            }}
          >
            Print Sheet
          </button>
        </div>
      </div>
    </div>
  );
}
