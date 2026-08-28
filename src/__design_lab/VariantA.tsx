import { AtlasMini, Viewport } from "./shared";
import { ATLAS, CAPTURE, SCENE_ITEMS, SELECTED, EXPORT_STATE } from "./fixtures";

/**
 * Variant A — Pixel-native instrument.
 *
 * Keeps the Graphite Instrument palette and changes the surface language:
 * 2px radii, hard 1px borders, zero soft shadows, checkerboard as the
 * signature texture, mono numerics, selection as a hard steel border.
 */

const C = {
  bg: "#26272b",
  panel: "#2c2d31",
  sunken: "#1e1f22",
  line: "#3a3c41",
  text: "#e2e3e6",
  dim: "#94969c",
  faint: "#6d6f76",
  accent: "#5b8fc9",
  accentDim: "#2f4a68",
  ok: "#6fbf8f",
};

const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

function Field({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div style={{ display: "grid", gap: 3 }}>
      <span style={{ fontSize: 10, color: C.dim }}>{label}</span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: C.sunken,
          border: `1px solid ${C.line}`,
          borderRadius: 2,
          padding: "3px 6px",
          fontFamily: mono,
          fontSize: 11,
          color: C.text,
        }}
      >
        <span>{value}</span>
        {unit ? <span style={{ color: C.faint, fontSize: 9 }}>{unit}</span> : null}
      </div>
    </div>
  );
}

function Header({ title, hint }: { title: string; hint?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        height: 26,
        padding: "0 8px",
        borderBottom: `1px solid ${C.line}`,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.3,
        color: C.text,
      }}
    >
      <span style={{ width: 3, height: 10, background: C.accent }} />
      {title}
      {hint ? (
        <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 10, color: C.dim }}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function VariantA() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "196px 1fr 216px",
        height: 428,
        background: C.bg,
        color: C.text,
        border: `1px solid ${C.line}`,
        borderRadius: 3,
        overflow: "hidden",
        fontSize: 11,
      }}
    >
      {/* Left rail */}
      <div style={{ borderRight: `1px solid ${C.line}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ display: "flex", height: 26, borderBottom: `1px solid ${C.line}` }}>
          {["Explorer", "Effects"].map((tab, i) => (
            <button
              key={tab}
              style={{
                flex: 1,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 0.3,
                color: i === 0 ? C.text : C.dim,
                background: i === 0 ? C.panel : "transparent",
                border: "none",
                borderBottom: i === 0 ? `2px solid ${C.accent}` : "2px solid transparent",
                cursor: "pointer",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <Header title="Scene" hint="5" />
        <div style={{ padding: 3 }}>
          {SCENE_ITEMS.map((item) => (
            <div
              key={item.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                height: 20,
                padding: "0 5px",
                borderRadius: 2,
                border: item.selected ? `1px solid ${C.accent}` : "1px solid transparent",
                background: item.selected ? C.accentDim : "transparent",
                color: item.selected ? C.text : C.dim,
              }}
            >
              <span style={{ width: 6, height: 6, background: item.selected ? C.accent : C.faint }} />
              {item.name}
            </div>
          ))}
        </div>
        <Header title={SELECTED.name} hint={SELECTED.typeLabel} />
        <div style={{ padding: 8, display: "grid", gap: 8 }}>
          <div style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 9, letterSpacing: 0.8, color: C.faint }}>POSITION</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3 }}>
              {SELECTED.position.map((value, i) => (
                <div
                  key={i}
                  style={{
                    background: C.sunken,
                    border: `1px solid ${C.line}`,
                    borderRadius: 2,
                    padding: "3px 5px",
                    fontFamily: mono,
                    fontSize: 11,
                  }}
                >
                  {value}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 9, letterSpacing: 0.8, color: C.faint }}>ROTATION</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3 }}>
              {SELECTED.rotation.map((value, i) => (
                <div
                  key={i}
                  style={{
                    background: C.sunken,
                    border: `1px solid ${C.line}`,
                    borderRadius: 2,
                    padding: "3px 5px",
                    fontFamily: mono,
                    fontSize: 11,
                  }}
                >
                  {value}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Viewport */}
      <Viewport
        background="#161719"
        checker="rgba(255,255,255,0.035)"
        frame={C.accent}
        label="knight.glb · idle · frame 4/8"
        labelStyle={{ fontFamily: mono, fontSize: 10, color: C.faint }}
      />

      {/* Export rail */}
      <div style={{ borderLeft: `1px solid ${C.line}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            height: 26,
            padding: "0 8px",
            borderBottom: `1px solid ${C.line}`,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.3,
          }}
        >
          <span style={{ width: 3, height: 10, background: C.accent }} />
          Export
          <span
            style={{
              marginLeft: "auto",
              fontSize: 9,
              padding: "1px 5px",
              borderRadius: 2,
              border: `1px solid ${C.ok}`,
              color: C.ok,
            }}
          >
            Ready
          </span>
        </div>
        <div style={{ padding: 8, display: "grid", gap: 6 }}>
          <AtlasMini
            fill={C.accent}
            checker="rgba(255,255,255,0.05)"
            page={C.sunken}
            border={C.line}
            gapColor={C.sunken}
            radius={2}
            height={84}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: 11 }}>
            <span style={{ fontWeight: 600 }}>{ATLAS.width}×{ATLAS.height}</span>
            <span style={{ color: C.dim, fontSize: 10 }}>
              {ATLAS.sequences} seq · {ATLAS.frameCount}f
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ flex: 1, height: 3, background: C.sunken, border: `1px solid ${C.line}` }}>
              <div style={{ width: `${ATLAS.coverage * 100}%`, height: "100%", background: C.accent }} />
            </div>
            <span style={{ fontFamily: mono, fontSize: 9, color: C.dim }}>{ATLAS.coverageLabel}</span>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${C.line}` }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 8px",
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            <span style={{ color: C.dim }}>▾</span> Capture
            <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 10, color: C.dim }}>
              64×64 · 10f
            </span>
          </div>
          <div style={{ padding: "0 8px 8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <Field label="Interval" value={CAPTURE.interval} unit="ms" />
            <Field label="Frames" value={CAPTURE.frames} />
          </div>
        </div>
        {["Sequences", "Effects"].map((section) => (
          <div
            key={section}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 8px",
              borderTop: `1px solid ${C.line}`,
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            <span style={{ color: C.faint }}>▸</span> {section}
            <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 10, color: C.dim }}>
              {section === "Sequences" ? "3" : "off"}
            </span>
          </div>
        ))}
        <div
          style={{
            marginTop: "auto",
            borderTop: `1px solid ${C.line}`,
            background: C.panel,
            padding: 8,
            display: "grid",
            gap: 6,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
            <span style={{ fontWeight: 600 }}>{EXPORT_STATE.format}</span>
            <span style={{ color: C.dim, fontFamily: mono }}>{EXPORT_STATE.files} files</span>
          </div>
          <button
            style={{
              width: "100%",
              padding: "6px 0",
              background: C.accent,
              color: "#0f1720",
              border: `1px solid ${C.accent}`,
              borderRadius: 2,
              fontSize: 11,
              fontWeight: 700,
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
