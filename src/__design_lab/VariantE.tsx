import { AtlasMini, Viewport } from "./shared";
import { ATLAS, CAPTURE, SCENE_ITEMS, SELECTED, SEQUENCES, EXPORT_STATE } from "./fixtures";

/**
 * Variant E — Bento box.
 *
 * Drops the three-rail model. Every concern becomes a discrete tile on one
 * grid, sized by importance rather than by which column it belongs to, with
 * real gutters between tiles instead of shared borders.
 */

const C = {
  bg: "#141518",
  tile: "#1c1e22",
  tileAlt: "#212429",
  sunken: "#0f1013",
  line: "#2a2d33",
  text: "#e6e8ec",
  dim: "#9095a0",
  faint: "#61656e",
  accent: "#7aa2d8",
  ok: "#71c495",
};

const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

function Tile({
  title,
  hint,
  children,
  span,
  bg = C.tile,
  pad = 10,
}: {
  title?: string;
  hint?: string;
  children: React.ReactNode;
  span?: React.CSSProperties;
  bg?: string;
  pad?: number;
}) {
  return (
    <section
      style={{
        background: bg,
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        padding: pad,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
        ...span,
      }}
    >
      {title ? (
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
          <h3 style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.7, textTransform: "uppercase", color: C.dim, margin: 0 }}>
            {title}
          </h3>
          {hint ? (
            <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 10, color: C.faint }}>
              {hint}
            </span>
          ) : null}
        </div>
      ) : null}
      <div style={{ minHeight: 0, flex: 1, display: "flex", flexDirection: "column" }}>{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gap: 2 }}>
      <span style={{ fontSize: 9, color: C.faint, letterSpacing: 0.4 }}>{label}</span>
      <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: C.text }}>{value}</span>
    </div>
  );
}

export function VariantE() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.05fr 1.6fr 1.05fr",
        gridTemplateRows: "auto 1fr auto",
        gap: 10,
        height: 428,
        background: C.bg,
        color: C.text,
        padding: 10,
        borderRadius: 14,
        overflow: "hidden",
        fontSize: 11,
      }}
    >
      {/* Scene — tall left tile */}
      <Tile title="Scene" hint="5" span={{ gridRow: "1 / span 2" }}>
        <div style={{ display: "grid", gap: 3 }}>
          {SCENE_ITEMS.map((item) => (
            <div
              key={item.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "5px 8px",
                borderRadius: 7,
                background: item.selected ? "rgba(122,162,216,0.16)" : "transparent",
                color: item.selected ? C.text : C.dim,
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: 5, background: item.selected ? C.accent : C.faint }} />
              {item.name}
            </div>
          ))}
        </div>
      </Tile>

      {/* Viewport — hero tile */}
      <section
        style={{
          background: C.sunken,
          border: `1px solid ${C.line}`,
          borderRadius: 12,
          overflow: "hidden",
          gridRow: "1 / span 2",
          display: "grid",
        }}
      >
        <Viewport
          background={C.sunken}
          checker="rgba(255,255,255,0.04)"
          label="knight.glb · idle · 4/8"
          labelStyle={{ fontFamily: mono, fontSize: 9, color: C.faint }}
        />
      </section>

      {/* Atlas tile */}
      <Tile title="Atlas" hint="Ready">
        <AtlasMini
          fill={C.accent}
          checker="rgba(255,255,255,0.05)"
          page={C.sunken}
          border={C.line}
          gapColor={C.sunken}
          radius={8}
          height={74}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <Stat label="Page" value={`${ATLAS.width}×${ATLAS.height}`} />
          <Stat label="Used" value={ATLAS.coverageLabel} />
        </div>
      </Tile>

      {/* Capture tile */}
      <Tile title="Capture" hint="64×64 · 10f" bg={C.tileAlt}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Stat label="Interval" value={`${CAPTURE.interval}ms`} />
          <Stat label="Frames" value={`${CAPTURE.frames}`} />
        </div>
      </Tile>

      {/* Transform tile */}
      <Tile title={SELECTED.name} hint={SELECTED.typeLabel} bg={C.tileAlt}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5 }}>
          {SELECTED.position.map((value, i) => (
            <div
              key={i}
              style={{
                background: C.sunken,
                borderRadius: 7,
                padding: "5px 7px",
                fontFamily: mono,
                fontSize: 11,
                textAlign: "center",
              }}
            >
              {value}
            </div>
          ))}
        </div>
      </Tile>

      {/* Sequences tile */}
      <Tile title="Sequences" hint={`${SEQUENCES.length}`}>
        <div style={{ display: "flex", gap: 5 }}>
          {SEQUENCES.map((seq) => (
            <div
              key={seq.name}
              style={{
                flex: 1,
                borderRadius: 7,
                padding: "5px 6px",
                background: seq.selected ? "rgba(122,162,216,0.16)" : C.sunken,
                color: seq.selected ? C.text : C.dim,
                fontSize: 10,
                textAlign: "center",
              }}
            >
              <div>{seq.name}</div>
              <div style={{ fontFamily: mono, fontSize: 9, color: C.faint }}>{seq.frames}f</div>
            </div>
          ))}
        </div>
      </Tile>

      {/* Export action tile */}
      <Tile bg={C.tileAlt} pad={10}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600 }}>{EXPORT_STATE.format}</span>
          <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 10, color: C.ok }}>
            {EXPORT_STATE.files} files
          </span>
        </div>
        <button
          style={{
            width: "100%",
            padding: "9px 0",
            background: C.accent,
            color: "#101820",
            border: "none",
            borderRadius: 9,
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Prepare Export
        </button>
      </Tile>
    </div>
  );
}
