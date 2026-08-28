import { AtlasMini, Viewport } from "./shared";
import { ATLAS, CAPTURE, SCENE_ITEMS, SELECTED, EXPORT_STATE } from "./fixtures";

/**
 * Variant C — Darkroom.
 *
 * The viewport is the only lit thing. Chrome sits at near-black with dim
 * labels; controls gain contrast only on approach (hover any row to see it).
 * Accent is a warm safelight amber, used sparingly.
 */

const C = {
  bg: "#0c0c0d",
  panel: "#111112",
  sunken: "#08080a",
  line: "#1c1c1f",
  text: "#b8b9bd",
  dim: "#65666b",
  faint: "#414247",
  accent: "#d9a441",
  glow: "0 0 0 1px rgba(217,164,65,0.18), 0 0 48px rgba(217,164,65,0.06)",
};

const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

function Row({ children, muted = true }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <div
      className="dl-c-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        height: 22,
        padding: "0 10px",
        color: muted ? C.dim : C.text,
        transition: "color 160ms ease-out, background 160ms ease-out",
      }}
    >
      {children}
    </div>
  );
}

export function VariantC() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "192px 1fr 212px",
        height: 428,
        background: C.bg,
        color: C.text,
        border: `1px solid ${C.line}`,
        borderRadius: 6,
        overflow: "hidden",
        fontSize: 11,
      }}
    >
      <style>{`
        .dl-c-row:hover { color: #eceef2 !important; background: rgba(255,255,255,0.035); }
        .dl-c-field:hover { border-color: #d9a441 !important; }
        .dl-c-btn:hover { background: #d9a441 !important; color: #17140c !important; }
      `}</style>

      {/* Left rail */}
      <div style={{ borderRight: `1px solid ${C.line}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ display: "flex", gap: 12, height: 30, alignItems: "center", padding: "0 10px" }}>
          {["Explorer", "Effects"].map((tab, i) => (
            <button
              key={tab}
              style={{
                fontSize: 10,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                color: i === 0 ? C.text : C.faint,
                background: "none",
                border: "none",
                borderBottom: i === 0 ? `1px solid ${C.accent}` : "1px solid transparent",
                padding: "0 0 3px",
                cursor: "pointer",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <div style={{ padding: "6px 10px 2px", fontSize: 9, letterSpacing: 0.9, color: C.faint, textTransform: "uppercase" }}>
          Scene
        </div>
        {SCENE_ITEMS.map((item) => (
          <Row key={item.name} muted={!item.selected}>
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: 4,
                background: item.selected ? C.accent : C.faint,
              }}
            />
            {item.name}
          </Row>
        ))}
        <div style={{ marginTop: 10, padding: "6px 10px 2px", fontSize: 9, letterSpacing: 0.9, color: C.faint, textTransform: "uppercase" }}>
          {SELECTED.name}
        </div>
        <div style={{ padding: "0 10px", display: "grid", gap: 6 }}>
          {(["Position", "Rotation"] as const).map((label) => (
            <div key={label} style={{ display: "grid", gap: 3 }}>
              <span style={{ fontSize: 9, color: C.faint }}>{label}</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                {(label === "Position" ? SELECTED.position : SELECTED.rotation).map((value, i) => (
                  <div
                    key={i}
                    className="dl-c-field"
                    style={{
                      background: C.sunken,
                      border: `1px solid ${C.line}`,
                      borderRadius: 3,
                      padding: "3px 6px",
                      fontFamily: mono,
                      fontSize: 10,
                      color: C.text,
                      transition: "border-color 160ms ease-out",
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

      {/* Viewport — the only lit surface */}
      <div style={{ padding: 14, display: "grid" }}>
        <Viewport
          background="#17171a"
          glow={C.glow}
          checker="rgba(255,255,255,0.04)"
          label="idle · frame 4/8"
          labelStyle={{ fontFamily: mono, fontSize: 9, color: C.dim }}
        />
      </div>

      {/* Export rail */}
      <div style={{ borderLeft: `1px solid ${C.line}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 30,
            padding: "0 10px",
            fontSize: 10,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            color: C.text,
          }}
        >
          Export
          <span style={{ marginLeft: "auto", fontSize: 9, color: C.accent, textTransform: "none", letterSpacing: 0 }}>
            Ready
          </span>
        </div>
        <div style={{ padding: "0 10px 8px", display: "grid", gap: 6 }}>
          <AtlasMini
            fill={C.accent}
            checker="rgba(255,255,255,0.03)"
            page={C.sunken}
            border={C.line}
            gapColor={C.sunken}
            radius={3}
            height={80}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: 10 }}>
            <span>{ATLAS.width}×{ATLAS.height}</span>
            <span style={{ color: C.dim }}>{ATLAS.frameCount}f · {ATLAS.coverageLabel}</span>
          </div>
        </div>
        <div style={{ padding: "4px 10px 2px", fontSize: 9, letterSpacing: 0.9, color: C.faint, textTransform: "uppercase" }}>
          Capture
        </div>
        <div style={{ padding: "0 10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
          {[
            { label: "Interval", value: `${CAPTURE.interval}ms` },
            { label: "Frames", value: CAPTURE.frames },
            { label: "Width", value: `${CAPTURE.width}px` },
            { label: "Height", value: `${CAPTURE.height}px` },
          ].map((field) => (
            <div key={field.label} style={{ display: "grid", gap: 2 }}>
              <span style={{ fontSize: 9, color: C.faint }}>{field.label}</span>
              <div
                className="dl-c-field"
                style={{
                  background: C.sunken,
                  border: `1px solid ${C.line}`,
                  borderRadius: 3,
                  padding: "3px 6px",
                  fontFamily: mono,
                  fontSize: 10,
                  transition: "border-color 160ms ease-out",
                }}
              >
                {field.value}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "auto", padding: 10, display: "grid", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.dim }}>
            <span>{EXPORT_STATE.format}</span>
            <span style={{ fontFamily: mono }}>{EXPORT_STATE.files} files</span>
          </div>
          <button
            className="dl-c-btn"
            style={{
              width: "100%",
              padding: "7px 0",
              background: "transparent",
              color: C.accent,
              border: `1px solid ${C.accent}`,
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 160ms ease-out, color 160ms ease-out",
            }}
          >
            Prepare Export
          </button>
        </div>
      </div>
    </div>
  );
}
