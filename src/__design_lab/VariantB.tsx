import { AtlasMini, Viewport } from "./shared";
import { ATLAS, CAPTURE, SCENE_ITEMS, SELECTED, SEQUENCES, EXPORT_STATE } from "./fixtures";

/**
 * Variant B — Density-first DCC.
 *
 * Blender/Houdini altitude: zero radii, hairline separators, 18px rows, 10px
 * type, drag-to-scrub number fields shown as filled bars, and every section
 * expanded because the whole premise is that more fits on screen.
 */

const C = {
  bg: "#303030",
  panel: "#282828",
  sunken: "#1d1d1d",
  field: "#545454",
  fieldFill: "#4772b3",
  line: "#232323",
  hair: "#3c3c3c",
  text: "#e0e0e0",
  dim: "#a0a0a0",
  faint: "#787878",
  accent: "#e87d0d",
  select: "#4772b3",
};

const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

function Scrub({ label, value, fill, unit }: { label: string; value: string | number; fill: number; unit?: string }) {
  return (
    <div
      style={{
        position: "relative",
        height: 17,
        background: C.field,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        padding: "0 5px",
        fontSize: 10,
        cursor: "ew-resize",
      }}
      title="Drag to scrub"
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: `${fill * 100}%`,
          background: C.fieldFill,
        }}
      />
      <span style={{ position: "relative", color: C.text }}>{label}</span>
      <span style={{ position: "relative", marginLeft: "auto", fontFamily: mono, color: "#fff" }}>
        {value}
        {unit ? <span style={{ color: "rgba(255,255,255,0.6)" }}>{unit}</span> : null}
      </span>
    </div>
  );
}

function SectionBar({ label, hint }: { label: string; hint?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        height: 18,
        padding: "0 5px",
        background: C.panel,
        borderTop: `1px solid ${C.line}`,
        borderBottom: `1px solid ${C.line}`,
        fontSize: 10,
        fontWeight: 600,
        color: C.text,
        textTransform: "uppercase",
        letterSpacing: 0.4,
      }}
    >
      <span style={{ color: C.faint, fontSize: 8 }}>▼</span>
      {label}
      {hint ? (
        <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 9, color: C.dim, textTransform: "none" }}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function VariantB() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "184px 1fr 208px",
        height: 428,
        background: C.bg,
        color: C.text,
        border: `1px solid ${C.line}`,
        overflow: "hidden",
        fontSize: 10,
      }}
    >
      {/* Left rail */}
      <div style={{ borderRight: `1px solid ${C.line}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ display: "flex", height: 18, background: C.panel, borderBottom: `1px solid ${C.line}` }}>
          {["Explorer", "Effects"].map((tab, i) => (
            <button
              key={tab}
              style={{
                flex: 1,
                fontSize: 10,
                color: i === 0 ? "#fff" : C.dim,
                background: i === 0 ? C.select : "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <SectionBar label="Scene" hint="5" />
        <div>
          {SCENE_ITEMS.map((item) => (
            <div
              key={item.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                height: 18,
                padding: "0 6px",
                background: item.selected ? C.select : "transparent",
                color: item.selected ? "#fff" : C.dim,
                borderBottom: `1px solid ${C.hair}`,
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: 5, background: item.selected ? "#fff" : C.faint }} />
              {item.name}
            </div>
          ))}
        </div>
        <SectionBar label="Transform" hint={SELECTED.name} />
        <div style={{ padding: 4, display: "grid", gap: 2 }}>
          {(["X", "Y", "Z"] as const).map((axis, i) => (
            <Scrub key={`p${axis}`} label={`Position ${axis}`} value={SELECTED.position[i].toFixed(2)} fill={0.5} />
          ))}
          {(["X", "Y", "Z"] as const).map((axis, i) => (
            <Scrub key={`r${axis}`} label={`Rotation ${axis}`} value={`${SELECTED.rotation[i]}°`} fill={SELECTED.rotation[i] / 360} />
          ))}
          {(["X", "Y", "Z"] as const).map((axis, i) => (
            <Scrub key={`s${axis}`} label={`Scale ${axis}`} value={SELECTED.scale[i].toFixed(2)} fill={0.5} />
          ))}
        </div>
      </div>

      {/* Viewport */}
      <Viewport
        background="#3f3f3f"
        checker="rgba(0,0,0,0.10)"
        label="knight.glb · idle · 4/8 · 64×64"
        labelStyle={{ fontFamily: mono, fontSize: 9, color: "#c8c8c8" }}
      />

      {/* Export rail */}
      <div style={{ borderLeft: `1px solid ${C.line}`, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            height: 18,
            padding: "0 5px",
            background: C.panel,
            borderBottom: `1px solid ${C.line}`,
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.4,
          }}
        >
          Export
          <span style={{ marginLeft: "auto", color: C.accent, textTransform: "none", fontSize: 9 }}>
            1 warning
          </span>
        </div>
        <div style={{ padding: 4 }}>
          <AtlasMini
            fill={C.fieldFill}
            checker="rgba(255,255,255,0.055)"
            page={C.sunken}
            radius={0}
            gapColor={C.sunken}
            height={72}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: 9, color: C.dim, marginTop: 3 }}>
            <span style={{ color: C.text }}>{ATLAS.width}×{ATLAS.height}</span>
            <span>{ATLAS.frameCount}f · {ATLAS.coverageLabel} used</span>
          </div>
        </div>
        <SectionBar label="Capture" />
        <div style={{ padding: 4, display: "grid", gap: 2 }}>
          <Scrub label="Interval" value={CAPTURE.interval} unit="ms" fill={0.33} />
          <Scrub label="Frames" value={CAPTURE.frames} fill={0.2} />
          <Scrub label="Width" value={CAPTURE.width} unit="px" fill={0.25} />
          <Scrub label="Height" value={CAPTURE.height} unit="px" fill={0.25} />
          <Scrub label="Safe margin" value={CAPTURE.safeMargin} unit="px" fill={0.1} />
        </div>
        <SectionBar label="Sequences" hint="3" />
        <div>
          {SEQUENCES.map((seq) => (
            <div
              key={seq.name}
              style={{
                display: "flex",
                alignItems: "center",
                height: 17,
                padding: "0 6px",
                background: seq.selected ? C.select : "transparent",
                color: seq.selected ? "#fff" : C.dim,
                borderBottom: `1px solid ${C.hair}`,
                fontFamily: mono,
                fontSize: 9,
              }}
            >
              {seq.name}
              <span style={{ marginLeft: "auto" }}>{seq.frames}f</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "auto", borderTop: `1px solid ${C.line}`, padding: 4, background: C.panel }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.dim, marginBottom: 3 }}>
            <span style={{ color: C.text }}>{EXPORT_STATE.format}</span>
            <span style={{ fontFamily: mono }}>{EXPORT_STATE.files} files</span>
          </div>
          <button
            style={{
              width: "100%",
              height: 20,
              background: C.accent,
              color: "#1a1a1a",
              border: "none",
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.5,
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
