import { Viewport } from "./shared";
import { ATLAS, CAPTURE, COLS, PLACEMENTS, ROWS, SCENE_ITEMS, SELECTED, SEQUENCES, EXPORT_STATE } from "./fixtures";

/**
 * Variant G — Terminal-native.
 *
 * Thesis: this repo already ships a CLI (`bin: sprite-sheet-helper`). Make the
 * GUI read as the same tool — a character grid, box-drawing separators, status
 * as [ok]/[warn] rather than pills, and the atlas rendered as actual cells.
 */

const C = {
  bg: "#0b0d0e",
  panel: "#101314",
  line: "#23282a",
  text: "#c9d3d1",
  dim: "#7b8785",
  faint: "#4d5654",
  green: "#7ee787",
  amber: "#e3b341",
  blue: "#6cb6ff",
};

const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";
const base: React.CSSProperties = { fontFamily: mono, fontSize: 11, lineHeight: "16px" };

/** The atlas page as literal cells — the most on-thesis detail here. */
function AsciiAtlas() {
  const cols = COLS;
  const rows = ROWS;
  const filled = new Set(PLACEMENTS.map((p) => `${p.row}:${p.col}`));
  return (
    <pre style={{ ...base, margin: 0, color: C.blue, letterSpacing: 1 }}>
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => (filled.has(`${r}:${c}`) ? "█" : "·")).join(" "),
      ).join("\n")}
    </pre>
  );
}

function Head({ children, status }: { children: React.ReactNode; status?: { label: string; color: string } }) {
  return (
    <div
      style={{
        ...base,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 8px",
        color: C.dim,
        borderBottom: `1px solid ${C.line}`,
      }}
    >
      <span style={{ color: C.faint }}>──</span>
      {children}
      {status ? (
        <span style={{ marginLeft: "auto", color: status.color }}>[{status.label}]</span>
      ) : null}
    </div>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  const pad = ".".repeat(Math.max(2, 15 - k.length));
  return (
    <div style={{ ...base, color: C.dim }}>
      {k}
      <span style={{ color: C.faint }}>{pad}</span>
      <span style={{ color: C.text }}>{v}</span>
    </div>
  );
}

export function VariantG() {
  return (
    <div
      style={{
        ...base,
        display: "grid",
        gridTemplateColumns: "212px 1fr 228px",
        height: 428,
        background: C.bg,
        color: C.text,
        border: `1px solid ${C.line}`,
        overflow: "hidden",
      }}
    >
      {/* Left rail */}
      <div style={{ borderRight: `1px solid ${C.line}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ ...base, display: "flex", gap: 0, borderBottom: `1px solid ${C.line}` }}>
          {["explorer", "effects"].map((tab, i) => (
            <button
              key={tab}
              style={{
                ...base,
                flex: 1,
                padding: "4px 0",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: i === 0 ? C.green : C.faint,
              }}
            >
              {i === 0 ? `[${tab}]` : ` ${tab} `}
            </button>
          ))}
        </div>
        <Head>scene</Head>
        <div style={{ padding: "4px 8px" }}>
          {SCENE_ITEMS.map((item, i) => {
            const last = i === SCENE_ITEMS.length - 1;
            return (
              <div key={item.name} style={{ ...base, color: item.selected ? C.green : C.dim }}>
                <span style={{ color: C.faint }}>{last ? "└─" : "├─"}</span>{" "}
                {item.selected ? ">" : " "} {item.name}
              </div>
            );
          })}
        </div>
        <Head>{SELECTED.name}</Head>
        <div style={{ padding: "4px 8px" }}>
          <Kv k="position" v={SELECTED.position.map((n) => n.toFixed(1)).join(" ")} />
          <Kv k="rotation" v={SELECTED.rotation.map((n) => n.toFixed(1)).join(" ")} />
          <Kv k="scale" v={SELECTED.scale.map((n) => n.toFixed(1)).join(" ")} />
        </div>
      </div>

      {/* Viewport */}
      <Viewport
        background="#0d0f10"
        checker="rgba(255,255,255,0.05)"
        frame={C.line}
        label="knight.glb :: idle :: 4/8"
        labelStyle={{ ...base, color: C.faint }}
      />

      {/* Export rail */}
      <div style={{ borderLeft: `1px solid ${C.line}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Head status={{ label: "ok", color: C.green }}>export</Head>
        <div style={{ padding: "8px 8px 4px" }}>
          <AsciiAtlas />
        </div>
        <div style={{ padding: "4px 8px" }}>
          <Kv k="page" v={`${ATLAS.width}x${ATLAS.height}`} />
          <Kv k="frames" v={`${ATLAS.frameCount}`} />
          <Kv k="coverage" v={ATLAS.coverageLabel} />
        </div>
        <Head>capture</Head>
        <div style={{ padding: "4px 8px" }}>
          <Kv k="--interval" v={`${CAPTURE.interval}ms`} />
          <Kv k="--frames" v={`${CAPTURE.frames}`} />
          <Kv k="--size" v={`${CAPTURE.width}x${CAPTURE.height}`} />
        </div>
        <Head>sequences</Head>
        <div style={{ padding: "4px 8px" }}>
          {SEQUENCES.map((seq) => (
            <div key={seq.name} style={{ ...base, color: seq.selected ? C.green : C.dim }}>
              {seq.selected ? "*" : " "} {seq.name.padEnd(9, " ")}
              <span style={{ color: C.faint }}>{seq.frames}f</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "auto", borderTop: `1px solid ${C.line}`, padding: 8 }}>
          <div style={{ ...base, color: C.faint, marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden" }}>
            <span style={{ color: C.green }}>$</span> export --format {EXPORT_STATE.format.toLowerCase()}
          </div>
          <button
            style={{
              ...base,
              width: "100%",
              padding: "5px 0",
              background: C.green,
              color: C.bg,
              border: "none",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            RUN [enter]
          </button>
        </div>
      </div>
    </div>
  );
}
