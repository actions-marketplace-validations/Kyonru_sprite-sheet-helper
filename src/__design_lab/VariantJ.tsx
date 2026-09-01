import { AtlasMini, Viewport } from "./shared";
import { ATLAS, CAPTURE, SCENE_ITEMS, SELECTED, SEQUENCES, EXPORT_STATE } from "./fixtures";

/**
 * Variant J — Pipeline.
 *
 * The only variant that changes information architecture rather than skin.
 * The export rail *is* a pipeline — scene → capture → pack → export — but
 * today it presents as an unordered pile of disclosures with no sense of where
 * you are or what is blocking.
 *
 * Deliberately a status map, not a wizard: the workflow is loopy (people
 * re-record after seeing the atlas), so every stage stays reachable and the
 * blocked one surfaces itself rather than gating the ones after it.
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
  ok: "#6fbf8f",
  warn: "#e0b062",
};

const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

type StageState = "done" | "active" | "warn" | "todo";

const STAGE_MARK: Record<StageState, { glyph: string; color: string }> = {
  done: { glyph: "✓", color: C.ok },
  active: { glyph: "●", color: C.accent },
  warn: { glyph: "!", color: C.warn },
  todo: { glyph: "○", color: C.faint },
};

function Stage({
  index,
  title,
  summary,
  state,
  last,
  children,
}: {
  index: number;
  title: string;
  summary: string;
  state: StageState;
  last?: boolean;
  children?: React.ReactNode;
}) {
  const mark = STAGE_MARK[state];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "20px 1fr", columnGap: 8 }}>
      {/* rail: marker + connector */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: 16,
            display: "grid",
            placeItems: "center",
            fontSize: 9,
            color: mark.color,
            border: `1px solid ${mark.color}`,
            background: state === "active" ? "rgba(91,143,201,0.14)" : "transparent",
          }}
        >
          {mark.glyph}
        </span>
        {!last && <span style={{ flex: 1, width: 1, background: C.line, marginTop: 2 }} />}
      </div>
      <div style={{ paddingBottom: last ? 0 : 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontFamily: mono, fontSize: 9, color: C.faint }}>{index}</span>
          <span style={{ fontSize: 11, fontWeight: 600 }}>{title}</span>
          <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 10, color: state === "warn" ? C.warn : C.dim }}>
            {summary}
          </span>
        </div>
        {children ? <div style={{ marginTop: 7 }}>{children}</div> : null}
      </div>
    </div>
  );
}

function Field({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div style={{ display: "grid", gap: 3 }}>
      <span style={{ fontSize: 9, color: C.faint }}>{label}</span>
      <div
        style={{
          background: C.sunken,
          border: `1px solid ${C.line}`,
          borderRadius: 3,
          padding: "3px 6px",
          fontFamily: mono,
          fontSize: 11,
        }}
      >
        {value}
        {unit ? <span style={{ color: C.faint, fontSize: 9 }}> {unit}</span> : null}
      </div>
    </div>
  );
}

export function VariantJ() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "190px 1fr 244px",
        height: 428,
        background: C.bg,
        color: C.text,
        border: `1px solid ${C.line}`,
        borderRadius: 4,
        overflow: "hidden",
        fontSize: 11,
      }}
    >
      {/* Left rail — unchanged on purpose; the experiment is the right rail */}
      <div style={{ borderRight: `1px solid ${C.line}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ display: "flex", height: 28, borderBottom: `1px solid ${C.line}` }}>
          {["Explorer", "Effects"].map((tab, i) => (
            <button
              key={tab}
              style={{
                flex: 1,
                fontSize: 10,
                fontWeight: 600,
                background: i === 0 ? C.panel : "transparent",
                color: i === 0 ? C.text : C.dim,
                border: "none",
                borderBottom: i === 0 ? `2px solid ${C.accent}` : "2px solid transparent",
                cursor: "pointer",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <div style={{ padding: "7px 10px 3px", fontSize: 9, letterSpacing: 0.8, color: C.faint, textTransform: "uppercase" }}>
          Scene
        </div>
        <div style={{ padding: "0 6px" }}>
          {SCENE_ITEMS.map((item) => (
            <div
              key={item.name}
              style={{
                padding: "3px 6px",
                borderRadius: 3,
                background: item.selected ? "rgba(91,143,201,0.16)" : "transparent",
                color: item.selected ? C.text : C.dim,
              }}
            >
              {item.name}
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 10px 3px", fontSize: 9, letterSpacing: 0.8, color: C.faint, textTransform: "uppercase" }}>
          {SELECTED.name}
        </div>
        <div style={{ padding: "0 10px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
          {SELECTED.position.map((value, i) => (
            <div
              key={i}
              style={{
                background: C.sunken,
                border: `1px solid ${C.line}`,
                borderRadius: 3,
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

      {/* Viewport */}
      <Viewport
        background="#161719"
        checker="rgba(255,255,255,0.035)"
        label="knight.glb · idle · frame 4/8"
        labelStyle={{ fontFamily: mono, fontSize: 10, color: C.faint }}
      />

      {/* Export rail — staged */}
      <div style={{ borderLeft: `1px solid ${C.line}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 28,
            padding: "0 10px",
            borderBottom: `1px solid ${C.line}`,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          Export pipeline
          <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 10, color: C.warn }}>
            1 warning
          </span>
        </div>

        <div style={{ padding: 10, minHeight: 0, overflow: "hidden" }}>
          <Stage index={1} title="Scene" summary={`${SCENE_ITEMS.length} objects`} state="done" />
          <Stage index={2} title="Capture" summary={`${SEQUENCES.length} seq · ${ATLAS.frameCount}f`} state="done" />
          <Stage index={3} title="Pack" summary={`${ATLAS.width}×${ATLAS.height}`} state="active">
            <AtlasMini
              fill={C.accent}
              checker="rgba(255,255,255,0.05)"
              page={C.sunken}
              border={C.line}
              gapColor={C.sunken}
              radius={3}
              height={64}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
              <div style={{ flex: 1, height: 3, background: C.sunken, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: ATLAS.coverageLabel, height: "100%", background: C.accent }} />
              </div>
              <span style={{ fontFamily: mono, fontSize: 9, color: C.dim }}>{ATLAS.coverageLabel}</span>
            </div>
          </Stage>
          <Stage index={4} title="Trim" summary="1 sequence spills" state="warn">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <Field label="Frame size" value={`${CAPTURE.width}×${CAPTURE.height}`} />
              <Field label="Margin" value={CAPTURE.safeMargin} unit="px" />
            </div>
          </Stage>
          <Stage index={5} title="Export" summary={`${EXPORT_STATE.files} files`} state="todo" last />
        </div>

        <div style={{ marginTop: "auto", borderTop: `1px solid ${C.line}`, background: C.panel, padding: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 7 }}>
            <span style={{ fontWeight: 600 }}>{EXPORT_STATE.format}</span>
            <span style={{ color: C.dim, fontFamily: mono }}>stage 3 of 5</span>
          </div>
          <button
            style={{
              width: "100%",
              padding: "7px 0",
              background: C.accent,
              color: "#0f1720",
              border: "none",
              borderRadius: 3,
              fontSize: 11,
              fontWeight: 700,
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
