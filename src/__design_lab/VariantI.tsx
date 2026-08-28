import { AtlasMini, Viewport } from "./shared";
import { ATLAS, CAPTURE, SCENE_ITEMS, SELECTED, SEQUENCES, EXPORT_STATE } from "./fixtures";

/**
 * Variant I — Swiss grid.
 *
 * Thesis: delete decoration entirely and let alignment do the work. No boxes,
 * no fills, no radii. One typeface, three sizes, a hard label column, rules
 * only where they carry meaning, and a single red reserved for state.
 *
 * The restraint pole — its job is to show whether A's hairlines earn their keep.
 */

const C = {
  paper: "#f7f7f5",
  ink: "#131313",
  dim: "#6a6a68",
  faint: "#9d9d9a",
  rule: "#d6d6d2",
  red: "#d0021b",
};

const sans =
  "Helvetica Neue, Helvetica, Inter, ui-sans-serif, system-ui, sans-serif";
const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

/** Label column left, value column right, nothing between them but alignment. */
function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: 10, padding: "3px 0" }}>
      <span style={{ fontSize: 10, color: C.dim }}>{label}</span>
      <span
        style={{
          fontFamily: mono,
          fontSize: strong ? 12 : 11,
          fontWeight: strong ? 600 : 400,
          color: C.ink,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ padding: "0 16px" }}>
      <h3
        style={{
          margin: "18px 0 6px",
          paddingBottom: 5,
          borderBottom: `1px solid ${C.ink}`,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.6,
          textTransform: "uppercase",
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

export function VariantI() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "212px 1fr 236px",
        height: 428,
        background: C.paper,
        color: C.ink,
        fontFamily: sans,
        border: `1px solid ${C.rule}`,
        overflow: "hidden",
        fontSize: 12,
      }}
    >
      {/* Left rail */}
      <div style={{ borderRight: `1px solid ${C.rule}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ display: "flex", gap: 16, padding: "16px 16px 0" }}>
          {["Explorer", "Effects"].map((tab, i) => (
            <button
              key={tab}
              style={{
                padding: 0,
                background: "none",
                border: "none",
                fontFamily: sans,
                fontSize: 11,
                fontWeight: i === 0 ? 700 : 400,
                color: i === 0 ? C.ink : C.faint,
                cursor: "pointer",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <Section title={`Scene / ${SCENE_ITEMS.length}`}>
          {SCENE_ITEMS.map((item) => (
            <div
              key={item.name}
              style={{
                display: "grid",
                gridTemplateColumns: "10px 1fr",
                gap: 6,
                padding: "3px 0",
                fontSize: 12,
                color: item.selected ? C.ink : C.dim,
                fontWeight: item.selected ? 600 : 400,
              }}
            >
              <span style={{ color: C.red }}>{item.selected ? "—" : ""}</span>
              {item.name}
            </div>
          ))}
        </Section>
        <Section title={SELECTED.name}>
          <Line label="Position" value={SELECTED.position.map((n) => n.toFixed(2)).join("   ")} />
          <Line label="Rotation" value={SELECTED.rotation.map((n) => n.toFixed(2)).join("   ")} />
          <Line label="Scale" value={SELECTED.scale.map((n) => n.toFixed(2)).join("   ")} />
        </Section>
      </div>

      {/* Viewport */}
      <Viewport
        background="#ecebe7"
        checker="rgba(0,0,0,0.055)"
        label="knight.glb / idle / 4 of 8"
        labelStyle={{ fontFamily: mono, fontSize: 10, color: C.faint }}
      />

      {/* Export rail */}
      <div style={{ borderLeft: `1px solid ${C.rule}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", padding: "16px 16px 0" }}>
          <span style={{ fontSize: 11, fontWeight: 700 }}>Export</span>
          <span style={{ marginLeft: "auto", fontSize: 10, color: C.red }}>Ready</span>
        </div>
        <Section title="Atlas">
          <AtlasMini
            fill={C.ink}
            checker="rgba(0,0,0,0.06)"
            page={C.paper}
            gapColor={C.paper}
            radius={0}
            height={70}
          />
          <div style={{ marginTop: 8 }}>
            <Line label="Page" value={`${ATLAS.width} × ${ATLAS.height}`} strong />
            <Line label="Frames" value={`${ATLAS.frameCount}`} />
            <Line label="Used" value={ATLAS.coverageLabel} />
          </div>
        </Section>
        <Section title="Capture">
          <Line label="Interval" value={`${CAPTURE.interval} ms`} />
          <Line label="Size" value={`${CAPTURE.width} × ${CAPTURE.height}`} />
          <Line label="Sequences" value={`${SEQUENCES.length}`} />
        </Section>
        <div style={{ marginTop: "auto", padding: 16, borderTop: `1px solid ${C.ink}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 10 }}>
            <span style={{ fontWeight: 600 }}>{EXPORT_STATE.format}</span>
            <span style={{ fontFamily: mono, color: C.dim }}>{EXPORT_STATE.files} files</span>
          </div>
          <button
            style={{
              width: "100%",
              padding: "9px 0",
              background: C.ink,
              color: C.paper,
              border: "none",
              fontFamily: sans,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.3,
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
