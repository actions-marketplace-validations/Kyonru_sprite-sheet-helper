import { AtlasMini, Viewport } from "./shared";
import { ATLAS, CAPTURE, SCENE_ITEMS, SELECTED, SEQUENCES, EXPORT_STATE } from "./fixtures";

/**
 * Variant K — Retro system chrome.
 *
 * System 7 / Win95 era: 2px beveled borders, grey face, gradient title bars,
 * chunky buttons that visibly depress. Domain resonance with the pixel-art era,
 * and a more relevant control than brutalism was.
 *
 * The open question is whether bevels are identity or just noise at 11px.
 */

const C = {
  face: "#c3c3c3",
  faceDark: "#a8a8a8",
  light: "#ffffff",
  shadow: "#7d7d7d",
  darkest: "#3f3f3f",
  ink: "#0d0d0d",
  dim: "#4a4a4a",
  title: "#000080",
  titleTo: "#1084d0",
  select: "#000080",
  desktop: "#3a6ea5",
};

const sans = "Tahoma, Geneva, Verdana, ui-sans-serif, sans-serif";
const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

/** Classic outset bevel: light top/left, shadow bottom/right, two rings deep. */
const outset: React.CSSProperties = {
  borderTop: `2px solid ${C.light}`,
  borderLeft: `2px solid ${C.light}`,
  borderRight: `2px solid ${C.darkest}`,
  borderBottom: `2px solid ${C.darkest}`,
  boxShadow: `inset -1px -1px 0 ${C.shadow}, inset 1px 1px 0 ${C.faceDark}`,
  background: C.face,
};

/** Inset bevel for anything that receives input. */
const inset: React.CSSProperties = {
  borderTop: `2px solid ${C.shadow}`,
  borderLeft: `2px solid ${C.shadow}`,
  borderRight: `2px solid ${C.light}`,
  borderBottom: `2px solid ${C.light}`,
  boxShadow: `inset 1px 1px 0 ${C.darkest}`,
  background: "#ffffff",
};

function TitleBar({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "2px 4px",
        background: `linear-gradient(90deg, ${C.title}, ${C.titleTo})`,
        color: "#fff",
        fontSize: 10,
        fontWeight: 700,
      }}
    >
      {children}
      {hint ? (
        <span style={{ marginLeft: "auto", fontFamily: mono, fontWeight: 400, opacity: 0.9 }}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

function Window({
  title,
  hint,
  children,
  style,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ ...outset, display: "flex", flexDirection: "column", minHeight: 0, ...style }}>
      <TitleBar hint={hint}>{title}</TitleBar>
      <div style={{ padding: 4, minHeight: 0, flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

function NumBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: "grid", gap: 2 }}>
      <span style={{ fontSize: 10, color: C.ink }}>{label}</span>
      <div style={{ ...inset, padding: "2px 4px", fontFamily: mono, fontSize: 11, color: C.ink }}>
        {value}
      </div>
    </div>
  );
}

export function VariantK() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "204px 1fr 228px",
        gap: 6,
        height: 428,
        background: C.desktop,
        padding: 6,
        fontFamily: sans,
        color: C.ink,
        overflow: "hidden",
        fontSize: 11,
      }}
    >
      {/* Left rail */}
      <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: 6, minHeight: 0 }}>
        <Window title="Scene" hint={`${SCENE_ITEMS.length}`}>
          <div style={{ ...inset, padding: 2, background: "#fff" }}>
            {SCENE_ITEMS.map((item) => (
              <div
                key={item.name}
                style={{
                  padding: "1px 4px",
                  background: item.selected ? C.select : "transparent",
                  color: item.selected ? "#fff" : C.ink,
                }}
              >
                {item.name}
              </div>
            ))}
          </div>
        </Window>
        <Window title={SELECTED.name} hint={SELECTED.typeLabel} style={{ minHeight: 0 }}>
          <div style={{ display: "grid", gap: 5 }}>
            {(["Position", "Rotation"] as const).map((label) => (
              <div key={label} style={{ display: "grid", gap: 2 }}>
                <span style={{ fontSize: 10 }}>{label}</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3 }}>
                  {(label === "Position" ? SELECTED.position : SELECTED.rotation).map((value, i) => (
                    <div
                      key={i}
                      style={{ ...inset, padding: "2px 3px", fontFamily: mono, fontSize: 11 }}
                    >
                      {value}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Window>
      </div>

      {/* Viewport */}
      <Window title="Preview" hint="idle 4/8" style={{ minHeight: 0 }}>
        <div style={{ ...inset, flex: 1, minHeight: 0, display: "grid", background: "#000" }}>
          <Viewport background="#000000" checker="rgba(255,255,255,0.08)" />
        </div>
      </Window>

      {/* Export rail */}
      <div style={{ display: "grid", gridTemplateRows: "auto auto 1fr auto", gap: 6, minHeight: 0 }}>
        <Window title="Export" hint="Ready">
          <div style={{ ...inset, padding: 3, background: "#fff" }}>
            <AtlasMini
              fill={C.title}
              checker="rgba(0,0,0,0.10)"
              page="#ffffff"
              gapColor="#ffffff"
              radius={0}
              height={64}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: mono,
              fontSize: 10,
              marginTop: 4,
            }}
          >
            <span>{ATLAS.width}×{ATLAS.height}</span>
            <span>{ATLAS.frameCount}f · {ATLAS.coverageLabel}</span>
          </div>
        </Window>
        <Window title="Capture">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
            <NumBox label="Interval" value={`${CAPTURE.interval}ms`} />
            <NumBox label="Frames" value={CAPTURE.frames} />
          </div>
        </Window>
        <Window title="Sequences" hint={`${SEQUENCES.length}`} style={{ minHeight: 0 }}>
          <div style={{ ...inset, padding: 2, background: "#fff", flex: 1, minHeight: 0 }}>
            {SEQUENCES.map((seq) => (
              <div
                key={seq.name}
                style={{
                  display: "flex",
                  padding: "1px 4px",
                  background: seq.selected ? C.select : "transparent",
                  color: seq.selected ? "#fff" : C.ink,
                  fontFamily: mono,
                  fontSize: 10,
                }}
              >
                {seq.name}
                <span style={{ marginLeft: "auto" }}>{seq.frames}f</span>
              </div>
            ))}
          </div>
        </Window>
        <button
          style={{
            ...outset,
            padding: "6px 0",
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 700,
            color: C.ink,
            cursor: "pointer",
          }}
        >
          Prepare Export ({EXPORT_STATE.files})
        </button>
      </div>
    </div>
  );
}
