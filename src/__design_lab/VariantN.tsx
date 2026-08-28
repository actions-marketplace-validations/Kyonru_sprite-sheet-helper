import { useEffect, useRef, useState } from "react";
import { AtlasMini, SpriteGlyph, checkerBackground } from "./shared";
import { ATLAS, CAPTURE, SCENE_ITEMS, SELECTED, SEQUENCES, EXPORT_STATE, VALIDATION } from "./fixtures";
import {
  IconAlert,
  IconBox,
  IconChevronLeft,
  IconChevronRight,
  IconCamera,
  IconHelp,
  IconMenu,
  IconPalette,
  IconLayers,
  IconLoop,
  IconPause,
  IconPencil,
  IconPerson,
  IconPlus,
  IconRedo,
  IconSparkles,
  IconSun,
  IconUndo,
  IconWorkflow,
} from "./icons";

/**
 * Variant N — the synthesis, round 2.
 *
 * Traits: M surfaces (tonal ladder, no shadows) · E structure + inputs ·
 * J organization · B density + scrub fields · A simplicity + checkerboard ·
 * L cleanliness (hairlines, one accent, reveal on hover).
 *
 * Round-2 changes, from feedback on the first pass:
 *  1. Coverage bar spans the tile rather than sitting inside the stage indent.
 *  2. Pipeline re-cut to a real edit→completion order (see PIPELINE below).
 *  3. Atlas map draws the actual frames, not solid blocks.
 *  4. Top bar and an open menu added.
 *  5. Explorer rows carry their type icons again.
 *  6. Scene view and preview are now distinct surfaces, not one merged panel.
 *  7. The frame caption is gone from the preview.
 */

const C = {
  base: "#171819",
  container: "#1e2022",
  containerHigh: "#26282b",
  containerHighest: "#2f3235",
  sunken: "#131415",
  stroke: "rgba(255,255,255,0.065)",
  text: "#e6e8ea",
  dim: "#9ba1a7",
  faint: "#6b7177",
  accent: "#6fa4dc",
  accentInk: "#0b1620",
  accentSoft: "rgba(111,164,220,0.14)",
  accentLine: "rgba(111,164,220,0.34)",
  ok: "#6fbf8f",
  warn: "#e0b062",
  warnSoft: "rgba(224,176,98,0.10)",
  warnLine: "rgba(224,176,98,0.26)",
};

const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

const editButton: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  height: 22,
  padding: "0 9px",
  borderRadius: 5,
  border: "1px solid rgba(255,255,255,0.065)",
  background: "transparent",
  color: "#9ba1a7",
  fontFamily: "inherit",
  fontSize: 10,
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: "background 120ms ease-out, color 120ms ease-out",
};

/** Frame-step buttons, sized to flank the frame they step through. */
const stepButton: React.CSSProperties = {
  width: 24,
  height: 60,
  display: "grid",
  placeItems: "center",
  borderRadius: 6,
  border: `1px solid rgba(255,255,255,0.065)`,
  background: "transparent",
  color: "#9ba1a7",
  cursor: "pointer",
  flexShrink: 0,
  transition: "background 120ms ease-out, color 120ms ease-out",
};

/**
 * The pipeline, re-cut so the order is genuinely edit → completion and every
 * stage is something the app actually does.
 *
 * The previous cut had an invented "Trim" step sitting after Pack, and put
 * interval and margin there — but those are capture settings, so editing them
 * re-runs everything downstream. They now live in Capture, where changing them
 * visibly invalidates Pack. Effects is a real stage (sprite-postprocess) that
 * was missing entirely, and it belongs between Capture and Pack because it
 * rewrites frames before they are packed.
 */
type StageState = "done" | "active" | "warn" | "todo";

const MARK: Record<StageState, { glyph: string; color: string }> = {
  done: { glyph: "✓", color: C.ok },
  active: { glyph: "●", color: C.accent },
  warn: { glyph: "!", color: C.warn },
  todo: { glyph: "○", color: C.faint },
};

function TypeIcon({ type }: { type: string }) {
  if (type === "camera") return <IconCamera size={13} />;
  if (type === "light") return <IconSun size={13} />;
  return <IconBox size={13} />;
}

function Tile({
  title,
  hint,
  children,
  tone = C.container,
  style,
  bodyStyle,
}: {
  title?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  tone?: string;
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
}) {
  return (
    <section
      style={{
        background: tone,
        border: `1px solid ${C.stroke}`,
        borderRadius: 10,
        padding: 8,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
        ...style,
      }}
    >
      {title ? (
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 7 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 0.7,
              textTransform: "uppercase",
              color: C.dim,
            }}
          >
            {title}
          </span>
          {hint ? (
            <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 10, color: C.faint }}>
              {hint}
            </span>
          ) : null}
        </div>
      ) : null}
      <div style={{ minHeight: 0, flex: 1, display: "flex", flexDirection: "column", ...bodyStyle }}>
        {children}
      </div>
    </section>
  );
}

/**
 * Bento's input shape with DCC's scrub affordance. The fill sits on the bottom
 * edge rather than filling the field: a full-height fill bisects the label
 * mid-word at low values, and on the edge it doubles as Fluent's accent
 * underline — one mark serving two of the requested traits.
 */
function ScrubField({
  label,
  value,
  unit,
  fill,
}: {
  label: string;
  value: string | number;
  unit?: string;
  fill: number;
}) {
  return (
    <div
      className="dl-n-scrub"
      style={{
        position: "relative",
        height: 24,
        borderRadius: 5,
        background: C.sunken,
        border: `1px solid ${C.stroke}`,
        display: "flex",
        alignItems: "center",
        padding: "0 7px 2px",
        overflow: "hidden",
        cursor: "ew-resize",
        transition: "border-color 120ms ease-out",
      }}
      title="Drag to scrub"
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          height: 2,
          width: `${Math.min(1, fill) * 100}%`,
          background: C.accent,
          transition: "width 120ms ease-out",
        }}
      />
      <span style={{ position: "relative", fontSize: 10, color: C.dim }}>{label}</span>
      <span
        style={{
          position: "relative",
          marginLeft: "auto",
          fontFamily: mono,
          fontSize: 11,
          color: C.text,
        }}
      >
        {value}
        {unit ? <span style={{ color: C.faint, fontSize: 9 }}>{unit}</span> : null}
      </span>
    </div>
  );
}

function AxisField({ value }: { value: number }) {
  return (
    <div
      className="dl-n-scrub"
      style={{
        height: 22,
        borderRadius: 5,
        background: C.sunken,
        border: `1px solid ${C.stroke}`,
        display: "grid",
        placeItems: "center",
        fontFamily: mono,
        fontSize: 11,
        color: C.text,
        cursor: "ew-resize",
        transition: "border-color 120ms ease-out",
      }}
      title="Drag to scrub"
    >
      {value}
    </div>
  );
}

function Stage({
  index,
  title,
  hint,
  state,
  last,
  children,
}: {
  index: number;
  title: string;
  hint: React.ReactNode;
  state: StageState;
  last?: boolean;
  children?: React.ReactNode;
}) {
  const mark = MARK[state];
  return (
    /*
      Two columns, always — the marker rail and the content. An earlier pass let
      warning content span both columns to gain ~20px of width, which broke the
      connector wherever a stage had content: the line stopped above the block
      and restarted below it, so a warned stage looked detached from the run.
      Continuity is worth more than the 20px, so the rail is now unbroken from
      stage 1 to stage 5 and the indent was narrowed to buy most of it back.
    */
    <div style={{ display: "grid", gridTemplateColumns: "14px 1fr", columnGap: 6 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: 14,
            display: "grid",
            placeItems: "center",
            fontSize: 8,
            color: mark.color,
            border: `1px solid ${mark.color}`,
            background: state === "active" ? C.accentSoft : "transparent",
            flexShrink: 0,
          }}
        >
          {mark.glyph}
        </span>
        {/* runs the full height of the stage, content included */}
        {!last && <span style={{ flex: 1, width: 1, background: C.stroke, marginTop: 3 }} />}
      </div>
      <div style={{ paddingBottom: last ? 0 : 14, minWidth: 0 }}>
        <div
          className="dl-n-row"
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 6,
            height: 16,
            borderRadius: 4,
            transition: "background 120ms ease-out",
          }}
        >
          <span style={{ fontFamily: mono, fontSize: 9, color: C.faint }}>{index}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{title}</span>
          <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 10, color: C.faint }}>
            {hint}
          </span>
        </div>
        {children ? <div style={{ marginTop: 8 }}>{children}</div> : null}
      </div>
    </div>
  );
}

/** Translate handles, so the scene view reads as the place things are moved. */
function TranslateGizmo() {
  const arm = 34;
  return (
    <svg
      width={arm * 2}
      height={arm * 2}
      viewBox={`0 0 ${arm * 2} ${arm * 2}`}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }}
      aria-hidden
    >
      <path d={`M${arm} ${arm} H${arm * 2 - 4}`} stroke="#e0605f" strokeWidth="1.5" />
      <path d={`M${arm * 2 - 8} ${arm - 3.5} L${arm * 2 - 1} ${arm} L${arm * 2 - 8} ${arm + 3.5}Z`} fill="#e0605f" />
      <path d={`M${arm} ${arm} V4`} stroke="#7fc98a" strokeWidth="1.5" />
      <path d={`M${arm - 3.5} 8 L${arm} 1 L${arm + 3.5} 8Z`} fill="#7fc98a" />
      <path d={`M${arm} ${arm} L${arm - 22} ${arm + 16}`} stroke="#6fa4dc" strokeWidth="1.5" />
      <path d={`M${arm - 24} ${arm + 11} L${arm - 27} ${arm + 20} L${arm - 18} ${arm + 19}Z`} fill="#6fa4dc" />
      <circle cx={arm} cy={arm} r="2.5" fill="#e6e8ea" />
    </svg>
  );
}

/**
 * Camera PiP — what the render camera sees, i.e. exactly what gets captured.
 *
 * Actually draggable, not just drawn as if it were: it is a floating inspector
 * over a viewport, and the one thing you always end up wanting is to move it
 * off whatever it is covering. Grab the header. Stays inside its parent.
 */
function CameraPiP() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const self = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const move = (event: MouseEvent) => {
      const start = drag.current;
      const node = self.current;
      if (!start || !node) return;
      const parent = node.offsetParent as HTMLElement | null;
      if (!parent) return;

      // Keep it inside the scene view — a camera that can be dragged into
      // nowhere is worse than one that cannot be dragged at all.
      const maxX = parent.clientWidth - node.offsetWidth - 10;
      const maxY = parent.clientHeight - node.offsetHeight - 10;
      const nextX = start.ox + (event.clientX - start.x);
      const nextY = start.oy + (event.clientY - start.y);
      setPos({
        x: Math.min(0, Math.max(-maxX, nextX)),
        y: Math.min(0, Math.max(-maxY, nextY)),
      });
    };
    const up = () => {
      drag.current = null;
      document.body.style.cursor = "";
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, []);

  return (
    <div
      ref={self}
      style={{
        position: "absolute",
        right: 10,
        bottom: 10,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        width: 122,
        background: C.container,
        border: `1px solid ${C.stroke}`,
        borderRadius: 8,
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      <div
        onMouseDown={(event) => {
          drag.current = { x: event.clientX, y: event.clientY, ox: pos.x, oy: pos.y };
          document.body.style.cursor = "grabbing";
        }}
        title="Drag to move"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "4px 6px",
          borderBottom: `1px solid ${C.stroke}`,
          cursor: "grab",
        }}
      >
        <span style={{ color: C.faint }}>
          <IconCamera size={11} />
        </span>
        <span
          style={{ fontSize: 9, letterSpacing: 0.6, textTransform: "uppercase", color: C.dim }}
        >
          Camera
        </span>
        <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 9, color: C.faint }}>
          {CAPTURE.width}×{CAPTURE.height}
        </span>
        {/* grip, so the header reads as the handle */}
        <span style={{ display: "grid", gap: 1.5, marginLeft: 2 }}>
          {[0, 1, 2].map((row) => (
            <span key={row} style={{ display: "flex", gap: 1.5 }}>
              {[0, 1].map((col) => (
                <span
                  key={col}
                  style={{ width: 1.5, height: 1.5, borderRadius: 2, background: C.faint }}
                />
              ))}
            </span>
          ))}
        </span>
      </div>
      <div
        style={{
          ...checkerBackground("rgba(255,255,255,0.05)", 6),
          background: C.sunken,
          display: "grid",
          placeItems: "center",
          padding: 6,
        }}
      >
        <SpriteGlyph size={58} />
      </div>
    </div>
  );
}

function TopBarButton({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      className="dl-n-tb"
      style={{
        width: 26,
        height: 24,
        display: "grid",
        placeItems: "center",
        borderRadius: 5,
        border: `1px solid ${active ? C.stroke : "transparent"}`,
        background: active ? C.containerHighest : "transparent",
        color: active ? C.text : C.dim,
        cursor: "pointer",
        transition: "background 120ms ease-out, color 120ms ease-out",
      }}
    >
      {children}
    </button>
  );
}

/**
 * One open menu, so the mock shows menu styling and not just the bar.
 *
 * Anchored under Workflows rather than Create: a menu opening at the far left
 * covers the explorer, and the explorer's row icons are part of what this pass
 * is meant to show. Over the viewport it obscures nothing under review.
 */
function MenuPopover() {
  const items = [
    { label: "Run workflow", shortcut: "⌘R" },
    { label: "New workflow", shortcut: "" },
    { label: "Edit steps…", shortcut: "" },
    { divider: true as const },
    { label: "Batch export…", shortcut: "⇧⌘E" },
    { label: "Manage presets…", shortcut: "" },
  ];
  return (
    <div
      style={{
        position: "absolute",
        top: 44,
        left: 219,
        width: 178,
        background: C.containerHigh,
        border: `1px solid ${C.stroke}`,
        borderRadius: 8,
        padding: 4,
        zIndex: 5,
      }}
    >
      {items.map((item, i) =>
        "divider" in item ? (
          <div key={i} style={{ height: 1, background: C.stroke, margin: "4px 6px" }} />
        ) : (
          <div
            key={i}
            className="dl-n-row"
            style={{
              display: "flex",
              alignItems: "center",
              height: 22,
              padding: "0 7px",
              borderRadius: 4,
              fontSize: 11,
              color: i === 0 ? C.text : C.dim,
              background: i === 0 ? C.accentSoft : "transparent",
              transition: "background 120ms ease-out",
            }}
          >
            {item.label}
            {item.shortcut ? (
              <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 10, color: C.faint }}>
                {item.shortcut}
              </span>
            ) : null}
          </div>
        ),
      )}
    </div>
  );
}

export function VariantN() {
  return (
    <div
      style={{
        position: "relative",
        display: "grid",
        gridTemplateRows: "auto 1fr",
        gap: 8,
        height: 588,
        background: C.base,
        color: C.text,
        padding: 8,
        borderRadius: 12,
        overflow: "hidden",
        fontSize: 11,
        fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
      }}
    >
      <style>{`
        .dl-n-row:hover { background: rgba(255,255,255,0.05); }
        .dl-n-scrub:hover { border-color: rgba(255,255,255,0.2) !important; }
        .dl-n-btn:hover { filter: brightness(1.07); }
        .dl-n-tab:hover { color: #e6e8ea; }
        .dl-n-tb:hover { background: #2f3235; color: #e6e8ea; }
        .dl-n-ghost:hover { background: rgba(224,176,98,0.14); }
        .dl-n-step:hover { background: rgba(255,255,255,0.06); color: #e6e8ea !important; }
      `}</style>

      {/* ---------------- Top bar ---------------- */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          height: 34,
          padding: "0 6px",
          background: C.container,
          border: `1px solid ${C.stroke}`,
          borderRadius: 8,
        }}
      >
        <TopBarButton><IconMenu size={14} /></TopBarButton>
        <span style={{ width: 1, height: 16, background: C.stroke, margin: "0 4px" }} />
        <TopBarButton><IconBox size={14} /></TopBarButton>
        <TopBarButton><IconCamera size={14} /></TopBarButton>
        <TopBarButton><IconSun size={14} /></TopBarButton>
        <TopBarButton><IconPalette size={14} /></TopBarButton>
        <TopBarButton><IconSparkles size={14} /></TopBarButton>
        <TopBarButton><IconPerson size={14} /></TopBarButton>
        <TopBarButton active><IconWorkflow size={14} /></TopBarButton>
        <TopBarButton><IconHelp size={14} /></TopBarButton>

        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 2 }}>
          <TopBarButton><IconUndo size={14} /></TopBarButton>
          <TopBarButton><IconRedo size={14} /></TopBarButton>
          <span style={{ width: 1, height: 16, background: C.stroke, margin: "0 5px" }} />
          <button
            className="dl-n-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              height: 24,
              padding: "0 10px",
              borderRadius: 5,
              border: "none",
              background: C.accent,
              color: C.accentInk,
              fontFamily: "inherit",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              transition: "filter 120ms ease-out",
            }}
          >
            <IconPlus size={13} />
            Record sequence
          </button>
        </span>
      </header>
      <MenuPopover />

      {/* ---------------- Body ---------------- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "202px 1fr 250px",
          gap: 8,
          minHeight: 0,
        }}
      >
        {/* ---- Left: scene + inspector ---- */}
        <div style={{ display: "grid", gridTemplateRows: "1fr auto", gap: 8, minHeight: 0 }}>
          <Tile title="Scene" hint={`${SCENE_ITEMS.length}`} style={{ minHeight: 0 }}>
            <div style={{ display: "flex", gap: 3, marginBottom: 7 }}>
              {["Explorer", "Effects"].map((tab, i) => (
                <button
                  key={tab}
                  className="dl-n-tab"
                  style={{
                    flex: 1,
                    height: 22,
                    borderRadius: 5,
                    border: `1px solid ${i === 0 ? C.stroke : "transparent"}`,
                    background: i === 0 ? C.containerHighest : "transparent",
                    color: i === 0 ? C.text : C.faint,
                    fontFamily: "inherit",
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "color 120ms ease-out",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div style={{ display: "grid", gap: 1, minHeight: 0, overflow: "hidden" }}>
              {SCENE_ITEMS.map((item) => (
                <div
                  key={item.name}
                  className="dl-n-row"
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    height: 22,
                    paddingLeft: 9,
                    paddingRight: 6,
                    borderRadius: 4,
                    background: item.selected ? C.accentSoft : "transparent",
                    color: item.selected ? C.text : C.dim,
                    transition: "background 120ms ease-out",
                  }}
                >
                  {item.selected && (
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 4,
                        bottom: 4,
                        width: 2,
                        borderRadius: 2,
                        background: C.accent,
                      }}
                    />
                  )}
                  <span style={{ color: item.selected ? C.accent : C.faint }}>
                    <TypeIcon type={item.type} />
                  </span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </Tile>

          <Tile tone={C.containerHigh} title={SELECTED.name} hint={SELECTED.typeLabel}>
            <div style={{ display: "grid", gap: 6 }}>
              {(
                [
                  ["Position", SELECTED.position],
                  ["Rotation", SELECTED.rotation],
                ] as const
              ).map(([label, values]) => (
                <div key={label} style={{ display: "grid", gap: 3 }}>
                  <span style={{ fontSize: 9, letterSpacing: 0.5, color: C.faint }}>{label}</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                    {values.map((value, i) => (
                      <AxisField key={i} value={value} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Tile>
        </div>

        {/*
          ---- Centre ----
          Three distinct things, which the last pass conflated into two:
            · Scene view — where objects are moved. Carries the gizmo and grid.
            · Camera     — what the render camera sees, i.e. exactly what gets
                           captured. Nested in the scene view as a PiP, the way
                           every DCC tool shows a camera.
            · Sequence   — playback of the frames already recorded, with the
                           sequence selector that was missing.
        */}
        <div style={{ display: "grid", gridTemplateRows: "1fr auto", gap: 8, minHeight: 0 }}>
          <section
            style={{
              position: "relative",
              background: C.sunken,
              border: `1px solid ${C.stroke}`,
              borderRadius: 10,
              overflow: "hidden",
              minHeight: 0,
              display: "grid",
              placeItems: "center",
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.032) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.032) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 8,
                left: 10,
                fontSize: 9,
                letterSpacing: 0.7,
                textTransform: "uppercase",
                color: C.faint,
              }}
            >
              Scene view
            </span>

            {/* the object, with a translate gizmo — this view is for moving things */}
            <div style={{ position: "relative" }}>
              <SpriteGlyph size={124} />
              <TranslateGizmo />
            </div>

            <CameraPiP />
          </section>

          {/*
            Sequence preview. Structure kept — it was working — with the
            transport filled in: sequence selector, loop, frame stepping either
            side of the frame itself (so the thumbnail reads as a carousel
            rather than a static thumbnail), and an edit affordance for the
            frame currently shown.
          */}
          <section
            style={{
              background: C.container,
              border: `1px solid ${C.stroke}`,
              borderRadius: 10,
              padding: 8,
              display: "grid",
              gap: 8,
            }}
          >
            {/* header: what is playing, and how */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 0.7,
                  textTransform: "uppercase",
                  color: C.dim,
                }}
              >
                Sequence
              </span>
              <span style={{ display: "flex", gap: 3, marginLeft: 4 }}>
                {SEQUENCES.map((seq) => (
                  <button
                    key={seq.name}
                    className="dl-n-chip"
                    style={{
                      height: 19,
                      padding: "0 8px",
                      borderRadius: 5,
                      border: `1px solid ${seq.selected ? "transparent" : C.stroke}`,
                      background: seq.selected ? C.accentSoft : "transparent",
                      color: seq.selected ? C.text : C.dim,
                      fontFamily: "inherit",
                      fontSize: 10,
                      fontWeight: seq.selected ? 600 : 400,
                      cursor: "pointer",
                      transition: "background 120ms ease-out, color 120ms ease-out",
                    }}
                  >
                    {seq.name}
                    <span style={{ fontFamily: mono, fontSize: 9, color: C.faint, marginLeft: 4 }}>
                      {seq.frames}
                    </span>
                  </button>
                ))}
              </span>

              <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                {/* loop: on by default for sprite work, so it shows as engaged */}
                <button
                  className="dl-n-tb"
                  title="Loop"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    height: 20,
                    padding: "0 7px",
                    borderRadius: 5,
                    border: `1px solid ${C.accentLine}`,
                    background: C.accentSoft,
                    color: C.accent,
                    fontFamily: "inherit",
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <IconLoop size={11} />
                  Loop
                </button>
                <span style={{ fontFamily: mono, fontSize: 10, color: C.faint }}>
                  4 / {SEQUENCES[0].frames}
                </span>
              </span>
            </div>

            {/* transport: step, frame, step — the frame reads as a carousel */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button className="dl-n-step" title="Previous frame" style={stepButton}>
                <IconChevronLeft size={13} />
              </button>

              <div
                style={{
                  position: "relative",
                  ...checkerBackground("rgba(255,255,255,0.05)", 6),
                  background: C.sunken,
                  border: `1px solid ${C.stroke}`,
                  borderRadius: 6,
                  padding: 6,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <SpriteGlyph size={48} />
                <span
                  style={{
                    position: "absolute",
                    bottom: 2,
                    right: 3,
                    fontFamily: mono,
                    fontSize: 8,
                    color: C.faint,
                  }}
                >
                  4
                </span>
              </div>

              <button className="dl-n-step" title="Next frame" style={stepButton}>
                <IconChevronRight size={13} />
              </button>

              <div style={{ flex: 1, display: "grid", gap: 6, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <button
                    className="dl-n-tb"
                    title="Pause"
                    style={{
                      width: 22,
                      height: 22,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 5,
                      border: `1px solid ${C.stroke}`,
                      background: C.containerHighest,
                      color: C.text,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <IconPause size={11} />
                  </button>
                  <div style={{ flex: 1, display: "flex", gap: 2 }}>
                    {Array.from({ length: SEQUENCES[0].frames }, (_, i) => (
                      <span
                        key={i}
                        style={{
                          flex: 1,
                          height: 4,
                          borderRadius: 2,
                          background: i === 3 ? C.accent : i < 3 ? C.accentSoft : C.sunken,
                        }}
                      />
                    ))}
                  </div>
                </div>
                {/*
                  Two scopes, so it is never ambiguous which one you are about
                  to change: the frame shown to the left, or the whole sequence
                  selected above. The frame button names its frame.
                */}
                <div style={{ display: "flex", gap: 5 }}>
                  <button className="dl-n-tb" style={editButton}>
                    <IconPencil size={11} />
                    Edit frame 4
                  </button>
                  <button className="dl-n-tb" style={editButton}>
                    <IconLayers size={11} />
                    Edit sequence
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ---- Right: the pipeline, then the one action ---- */}
        <div style={{ display: "grid", gridTemplateRows: "1fr auto", gap: 8, minHeight: 0 }}>
          <Tile
            title="Export"
            hint={<span style={{ color: C.warn }}>1 warning</span>}
            style={{ minHeight: 0 }}
          >
            <Stage index={1} title="Scene" hint={`${SCENE_ITEMS.length} objects`} state="done" />
            <Stage
              index={2}
              title="Capture"
              hint={`${SEQUENCES.length} seq · ${ATLAS.frameCount}f`}
              state="done"
            >
              <div style={{ display: "grid", gap: 4 }}>
                <ScrubField
                  label="Interval"
                  value={CAPTURE.interval}
                  unit="ms"
                  fill={CAPTURE.interval / 300}
                />
                <ScrubField
                  label="Safe margin"
                  value={CAPTURE.safeMargin}
                  unit="px"
                  fill={CAPTURE.safeMargin / 16}
                />
              </div>
            </Stage>
            <Stage index={3} title="Effects" hint="none" state="todo" />
            <Stage
              index={4}
              title="Pack"
              hint={`${ATLAS.width}×${ATLAS.height}`}
              state="warn"
            >
              <div style={{ display: "grid", gap: 8 }}>
                  <AtlasMini
                    fill={C.accent}
                    checker="rgba(255,255,255,0.05)"
                    page={C.sunken}
                    border={C.stroke}
                    gapColor={C.stroke}
                    radius={6}
                    height={78}
                    sprites
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div
                      style={{
                        flex: 1,
                        height: 3,
                        borderRadius: 3,
                        background: C.sunken,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: ATLAS.coverageLabel,
                          height: "100%",
                          background: C.accent,
                        }}
                      />
                    </div>
                    <span style={{ fontFamily: mono, fontSize: 9, color: C.faint }}>
                      {ATLAS.coverageLabel} used
                    </span>
                  </div>
                  {/*
                    The warning the header counts. Same headline as the export
                    dialog word for word; the dialog has room for the longer
                    detail, this has room for the fix. Given a surface of its
                    own so it reads as a state to resolve rather than as a
                    sentence someone left in the panel.
                  */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr",
                      columnGap: 7,
                      rowGap: 5,
                      padding: "7px 8px",
                      borderRadius: 6,
                      background: C.warnSoft,
                      border: `1px solid ${C.warnLine}`,
                    }}
                  >
                    <span style={{ color: C.warn, marginTop: 1 }}>
                      <IconAlert size={12} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: C.warn }}>
                        {VALIDATION[0].title}
                      </div>
                      <div style={{ fontSize: 10, color: C.dim, lineHeight: 1.4, marginTop: 1 }}>
                        {VALIDATION[0].short}
                      </div>
                    </div>
                    <button
                      className="dl-n-ghost"
                      style={{
                        gridColumn: "2",
                        justifySelf: "start",
                        height: 20,
                        padding: "0 8px",
                        borderRadius: 4,
                        border: `1px solid ${C.warnLine}`,
                        background: "transparent",
                        color: C.warn,
                        fontFamily: "inherit",
                        fontSize: 10,
                        cursor: "pointer",
                        transition: "background 120ms ease-out",
                      }}
                    >
                      {VALIDATION[0].fix}
                    </button>
                  </div>
              </div>
            </Stage>
            <Stage
              index={5}
              title="Export"
              hint={`${EXPORT_STATE.files} files`}
              state="todo"
              last
            />
          </Tile>

          <Tile tone={C.containerHigh}>
            <div style={{ display: "flex", alignItems: "baseline", marginBottom: 7 }}>
              <span style={{ fontSize: 11, fontWeight: 600 }}>{EXPORT_STATE.format}</span>
              <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 10, color: C.faint }}>
                stage 4 of 5
              </span>
            </div>
            <button
              className="dl-n-btn"
              style={{
                width: "100%",
                height: 30,
                background: C.accent,
                color: C.accentInk,
                border: "none",
                borderRadius: 6,
                fontFamily: "inherit",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                transition: "filter 120ms ease-out",
              }}
            >
              Prepare Export
            </button>
          </Tile>
        </div>
      </div>
    </div>
  );
}
