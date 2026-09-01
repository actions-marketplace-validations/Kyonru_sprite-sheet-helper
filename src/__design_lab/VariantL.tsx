import { AtlasMini, Viewport } from "./shared";
import { ATLAS, CAPTURE, SCENE_ITEMS, SELECTED, SEQUENCES, EXPORT_STATE } from "./fixtures";

/**
 * Variant L — Fluent 2 (Microsoft).
 *
 * Layered surfaces rather than borders: a mica-ish tinted base, cards lifted a
 * step above it, 4–7px radii, a single accent that carries focus and selection,
 * an accent underline on the focused input, and reveal-style hover borders.
 *
 * Hover the rows and fields — reveal is half the language and a screenshot
 * cannot show it.
 */

const C = {
  mica: "#1f2023",
  layer: "#26282c",
  card: "#2b2d32",
  control: "#323439",
  stroke: "rgba(255,255,255,0.075)",
  strokeStrong: "rgba(255,255,255,0.14)",
  text: "#f2f3f5",
  dim: "#a4a8b0",
  faint: "#767b85",
  accent: "#60cdff",
  accentInk: "#00263f",
  ok: "#6ccb96",
};

const sans =
  "Segoe UI Variable, Segoe UI, ui-sans-serif, system-ui, -apple-system, sans-serif";
const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.stroke}`,
        borderRadius: 7,
        boxShadow: "0 2px 4px rgba(0,0,0,0.22)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Input({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <span style={{ fontSize: 11, color: C.dim }}>{label}</span>
      <div
        className="dl-l-input"
        style={{
          display: "flex",
          alignItems: "center",
          background: C.control,
          border: `1px solid ${C.stroke}`,
          borderBottom: `1px solid ${C.strokeStrong}`,
          borderRadius: 5,
          padding: "5px 8px",
          fontFamily: mono,
          fontSize: 12,
          color: C.text,
        }}
      >
        {value}
        {unit ? <span style={{ marginLeft: "auto", color: C.faint, fontSize: 10 }}>{unit}</span> : null}
      </div>
    </div>
  );
}

function Title({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{children}</span>
      {hint ? (
        <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 11, color: C.faint }}>{hint}</span>
      ) : null}
    </div>
  );
}

export function VariantL() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "208px 1fr 240px",
        gap: 8,
        height: 428,
        background: C.mica,
        backgroundImage:
          "radial-gradient(900px 320px at 15% -10%, rgba(96,205,255,0.055), transparent 60%)",
        color: C.text,
        fontFamily: sans,
        padding: 8,
        borderRadius: 8,
        overflow: "hidden",
        fontSize: 12,
      }}
    >
      <style>{`
        .dl-l-row:hover { background: rgba(255,255,255,0.055) !important; border-color: rgba(255,255,255,0.16) !important; }
        .dl-l-input:hover { border-color: rgba(255,255,255,0.2) !important; }
        .dl-l-btn:hover { filter: brightness(1.08); }
      `}</style>

      {/* Left rail */}
      <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: 8, minHeight: 0 }}>
        <Card style={{ padding: 8 }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
            {["Explorer", "Effects"].map((tab, i) => (
              <button
                key={tab}
                style={{
                  flex: 1,
                  padding: "5px 0",
                  borderRadius: 5,
                  border: `1px solid ${i === 0 ? C.stroke : "transparent"}`,
                  background: i === 0 ? C.control : "transparent",
                  color: i === 0 ? C.text : C.dim,
                  fontFamily: sans,
                  fontSize: 11,
                  fontWeight: i === 0 ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <Title hint={`${SCENE_ITEMS.length}`}>Scene</Title>
          <div style={{ display: "grid", gap: 2 }}>
            {SCENE_ITEMS.map((item) => (
              <div
                key={item.name}
                className="dl-l-row"
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 8px",
                  borderRadius: 5,
                  border: "1px solid transparent",
                  background: item.selected ? "rgba(96,205,255,0.10)" : "transparent",
                  color: item.selected ? C.text : C.dim,
                  transition: "background 120ms ease-out, border-color 120ms ease-out",
                }}
              >
                {item.selected && (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 3,
                      height: 14,
                      borderRadius: 3,
                      background: C.accent,
                    }}
                  />
                )}
                {item.name}
              </div>
            ))}
          </div>
        </Card>
        <Card style={{ padding: 8, minHeight: 0 }}>
          <Title hint={SELECTED.typeLabel}>{SELECTED.name}</Title>
          <div style={{ display: "grid", gap: 7 }}>
            <div style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 11, color: C.dim }}>Position</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
                {SELECTED.position.map((value, i) => (
                  <div
                    key={i}
                    className="dl-l-input"
                    style={{
                      background: C.control,
                      border: `1px solid ${C.stroke}`,
                      borderBottom: `1px solid ${C.strokeStrong}`,
                      borderRadius: 5,
                      padding: "5px 7px",
                      fontFamily: mono,
                      fontSize: 12,
                      textAlign: "center",
                    }}
                  >
                    {value}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Viewport */}
      <Card style={{ overflow: "hidden", display: "grid", minHeight: 0, padding: 0 }}>
        <Viewport
          background="#141518"
          checker="rgba(255,255,255,0.04)"
          label="knight.glb · idle · 4/8"
          labelStyle={{ fontFamily: mono, fontSize: 11, color: C.faint }}
        />
      </Card>

      {/* Export rail */}
      <div style={{ display: "grid", gridTemplateRows: "auto auto 1fr", gap: 8, minHeight: 0 }}>
        <Card style={{ padding: 8 }}>
          <Title
            hint={undefined}
          >
            Export
          </Title>
          <AtlasMini
            fill={C.accent}
            checker="rgba(255,255,255,0.05)"
            page="#191b1e"
            border={C.stroke}
            gapColor="#191b1e"
            radius={5}
            height={68}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: mono, fontSize: 12 }}>
            <span style={{ fontWeight: 600 }}>{ATLAS.width}×{ATLAS.height}</span>
            <span style={{ color: C.dim, fontSize: 11 }}>
              {ATLAS.frameCount}f · {ATLAS.coverageLabel}
            </span>
          </div>
        </Card>
        <Card style={{ padding: 8 }}>
          <Title hint={`${CAPTURE.width}×${CAPTURE.height}`}>Capture</Title>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <Input label="Interval" value={CAPTURE.interval} unit="ms" />
            <Input label="Frames" value={CAPTURE.frames} />
          </div>
        </Card>
        <Card style={{ padding: 8, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <Title hint={`${SEQUENCES.length}`}>Sequences</Title>
          <div style={{ display: "grid", gap: 3 }}>
            {SEQUENCES.map((seq) => (
              <div
                key={seq.name}
                className="dl-l-row"
                style={{
                  display: "flex",
                  padding: "4px 8px",
                  borderRadius: 5,
                  border: "1px solid transparent",
                  background: seq.selected ? "rgba(96,205,255,0.10)" : "transparent",
                  color: seq.selected ? C.text : C.dim,
                  fontSize: 11,
                  transition: "background 120ms ease-out, border-color 120ms ease-out",
                }}
              >
                {seq.name}
                <span style={{ marginLeft: "auto", fontFamily: mono, color: C.faint }}>{seq.frames}f</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "auto", paddingTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 7 }}>
              <span>{EXPORT_STATE.format}</span>
              <span style={{ color: C.ok, fontFamily: mono }}>{EXPORT_STATE.files} files</span>
            </div>
            <button
              className="dl-l-btn"
              style={{
                width: "100%",
                padding: "7px 0",
                background: C.accent,
                color: C.accentInk,
                border: `1px solid rgba(255,255,255,0.18)`,
                borderRadius: 5,
                fontFamily: sans,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "filter 120ms ease-out",
              }}
            >
              Prepare Export
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
