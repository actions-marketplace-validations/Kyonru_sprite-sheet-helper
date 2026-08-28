import { AtlasMini } from "./shared";
import { IconArchive, IconFilm, IconLayers } from "./icons";
import {
  ATLAS,
  EXPORT_FORMATS,
  EXPORT_STATE,
  OUTPUT_FILES,
  SEQUENCES,
  VALIDATION,
} from "./fixtures";

/**
 * The export dialog, in N's language.
 *
 * Design premise: by the time this opens the rail has already told you the
 * atlas is fine. So the dialog is not a second settings screen — it answers one
 * question, "what exactly is about to be written, and where", and gets out of
 * the way. Format on the left because it is the only real choice; the
 * consequences of that choice on the right, updating as you pick.
 *
 * The warning is the same sentence the Pack stage shows. A dialog that
 * rephrases a warning makes the reader wonder whether it is a different one.
 */

const C = {
  scrim: "rgba(8,9,10,0.62)",
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
  warn: "#e0b062",
  warnSoft: "rgba(224,176,98,0.12)",
};

const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

function FileIcon({ kind }: { kind: string }) {
  const stroke = kind === "image" ? C.accent : C.dim;
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      {kind === "image" ? <circle cx="10" cy="13" r="1.6" /> : null}
      {kind === "image" ? <path d="m8 18 3-3 2 2 2-2 2 2" /> : null}
    </svg>
  );
}

/**
 * The mark beside a format.
 *
 * Brand logos and our own icons get different substrates on purpose. Our icons
 * are ours to theme, so they sit on the dark tile and take the accent when
 * selected. A third-party mark is not ours to recolour — several of these ship
 * with black fills that vanish on a dark surface, and only Unity has a dark
 * variant — so every logo gets a light chip, which is the background they were
 * drawn for.
 */
function FormatMark({
  logo,
  mark,
  selected,
}: {
  logo?: string;
  mark?: "stack" | "archive" | "film";
  selected: boolean;
}) {
  if (logo) {
    return (
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          display: "grid",
          placeItems: "center",
          background: "#e9eaec",
          border: `1px solid ${selected ? C.accentLine : "rgba(255,255,255,0.10)"}`,
          flexShrink: 0,
        }}
      >
        <img
          src={logo}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{ width: 16, height: 16, objectFit: "contain", display: "block" }}
        />
      </span>
    );
  }

  const Icon = mark === "archive" ? IconArchive : mark === "film" ? IconFilm : IconLayers;
  return (
    <span
      style={{
        width: 24,
        height: 24,
        borderRadius: 6,
        display: "grid",
        placeItems: "center",
        background: selected ? C.accentSoft : C.containerHigh,
        border: `1px solid ${selected ? C.accentLine : C.stroke}`,
        color: selected ? C.accent : C.faint,
        flexShrink: 0,
      }}
    >
      <Icon size={13} />
    </span>
  );
}

export function VariantNModal() {
  let lastCategory = "";

  return (
    /* Scrim, so it reads as a dialog rather than another panel. */
    <div
      style={{
        background: C.scrim,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
        borderRadius: 12,
        border: `1px solid ${C.stroke}`,
        padding: 28,
        display: "grid",
        placeItems: "center",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
        fontSize: 11,
      }}
    >
      <style>{`
        .dl-nm-row:hover { background: rgba(255,255,255,0.05); }
        .dl-nm-btn:hover { filter: brightness(1.07); }
        .dl-nm-ghost:hover { background: #2f3235; color: #e6e8ea; }
      `}</style>

      <div
        style={{
          width: "100%",
          maxWidth: 660,
          background: C.base,
          border: `1px solid ${C.stroke}`,
          borderRadius: 12,
          overflow: "hidden",
          color: C.text,
        }}
      >
        {/* ---- Header ---- */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            padding: "12px 14px",
            borderBottom: `1px solid ${C.stroke}`,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Prepare export</h3>
          <span style={{ fontFamily: mono, fontSize: 10, color: C.faint }}>
            {SEQUENCES.length} sequences · {ATLAS.frameCount} frames
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "228px 1fr" }}>
          {/* ---- Format: the only real choice, so it leads ---- */}
          <div
            style={{
              borderRight: `1px solid ${C.stroke}`,
              padding: 8,
              maxHeight: 330,
              overflowY: "auto",
            }}
          >
            {EXPORT_FORMATS.map((format) => {
              const newGroup = format.category !== lastCategory;
              lastCategory = format.category;
              return (
                <div key={format.name}>
                  {newGroup && (
                    <div
                      style={{
                        fontSize: 9,
                        letterSpacing: 0.8,
                        textTransform: "uppercase",
                        color: C.faint,
                        padding: "8px 7px 4px",
                      }}
                    >
                      {format.category}
                    </div>
                  )}
                  <div
                    className="dl-nm-row"
                    style={{
                      position: "relative",
                      padding: "5px 8px 6px",
                      borderRadius: 5,
                      background: format.selected ? C.accentSoft : "transparent",
                      color: format.selected ? C.text : C.dim,
                      cursor: "pointer",
                      transition: "background 120ms ease-out",
                    }}
                  >
                    {format.selected && (
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 6,
                          bottom: 6,
                          width: 2,
                          borderRadius: 2,
                          background: C.accent,
                        }}
                      />
                    )}
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <FormatMark
                        logo={"logo" in format ? format.logo : undefined}
                        mark={"mark" in format ? format.mark : undefined}
                        selected={Boolean(format.selected)}
                      />
                      <div style={{ minWidth: 0, paddingTop: 3 }}>
                        <div style={{ fontSize: 11, fontWeight: format.selected ? 600 : 400 }}>
                          {format.name}
                        </div>
                        {format.selected && (
                          <div
                            style={{ fontSize: 10, color: C.faint, marginTop: 2, lineHeight: 1.4 }}
                          >
                            {format.note}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ---- Consequences of that choice ---- */}
          <div style={{ padding: 12, display: "grid", gap: 10, alignContent: "start" }}>
            {/* AtlasMini sizes itself from width:100%, so it needs a column with
                a real width — an `auto` track collapses it to nothing. */}
            <div style={{ display: "grid", gridTemplateColumns: "156px 1fr", gap: 12, alignItems: "start" }}>
              <AtlasMini
                fill={C.accent}
                checker="rgba(255,255,255,0.05)"
                page={C.sunken}
                border={C.stroke}
                gapColor={C.stroke}
                radius={6}
                height={62}
                sprites
              />
              <div style={{ display: "grid", gap: 5 }}>
                {[
                  ["Page", `${ATLAS.width}×${ATLAS.height}`],
                  ["Used", ATLAS.coverageLabel],
                  ["Pages", "1"],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 10, color: C.faint, width: 40 }}>{label}</span>
                    <span style={{ fontFamily: mono, fontSize: 11 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Same sentence as the Pack stage — never a paraphrase. */}
            <div
              style={{
                display: "flex",
                gap: 8,
                padding: "7px 9px",
                borderRadius: 6,
                background: C.warnSoft,
                border: `1px solid rgba(224,176,98,0.24)`,
              }}
            >
              <span style={{ color: C.warn, fontFamily: mono, fontSize: 11, lineHeight: "15px" }}>!</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.warn }}>
                  {VALIDATION[0].title}
                </div>
                <div style={{ fontSize: 10, color: C.dim, lineHeight: 1.45, marginTop: 1 }}>
                  {VALIDATION[0].detail}
                </div>
              </div>
              <button
                className="dl-nm-ghost"
                style={{
                  alignSelf: "center",
                  marginLeft: "auto",
                  height: 22,
                  padding: "0 9px",
                  borderRadius: 5,
                  border: `1px solid ${C.stroke}`,
                  background: "transparent",
                  color: C.dim,
                  fontFamily: "inherit",
                  fontSize: 10,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  transition: "background 120ms ease-out, color 120ms ease-out",
                }}
              >
                {VALIDATION[0].fix}
              </button>
            </div>

            {/* What will be written, and where. The point of the dialog. */}
            <div style={{ display: "grid", gap: 5 }}>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span
                  style={{
                    fontSize: 9,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    color: C.faint,
                  }}
                >
                  Writes
                </span>
                <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 10, color: C.faint }}>
                  ~/Downloads
                </span>
              </div>
              {OUTPUT_FILES.map((file) => (
                <div
                  key={file.name}
                  className="dl-nm-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    height: 26,
                    padding: "0 8px",
                    borderRadius: 5,
                    background: C.container,
                    border: `1px solid ${C.stroke}`,
                    transition: "background 120ms ease-out",
                  }}
                >
                  <FileIcon kind={file.kind} />
                  <span style={{ fontFamily: mono, fontSize: 11 }}>{file.name}</span>
                  <span
                    style={{ marginLeft: "auto", fontFamily: mono, fontSize: 10, color: C.faint }}
                  >
                    {file.size}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ---- Footer ---- */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderTop: `1px solid ${C.stroke}`,
            background: C.container,
          }}
        >
          <span style={{ fontFamily: mono, fontSize: 10, color: C.faint }}>
            {EXPORT_STATE.files} files · 45.2 KB
          </span>
          <span style={{ marginLeft: "auto", display: "flex", gap: 7 }}>
            <button
              className="dl-nm-ghost"
              style={{
                height: 28,
                padding: "0 14px",
                borderRadius: 6,
                border: `1px solid ${C.stroke}`,
                background: "transparent",
                color: C.dim,
                fontFamily: "inherit",
                fontSize: 11,
                cursor: "pointer",
                transition: "background 120ms ease-out, color 120ms ease-out",
              }}
            >
              Cancel
            </button>
            <button
              className="dl-nm-btn"
              style={{
                height: 28,
                padding: "0 18px",
                borderRadius: 6,
                border: "none",
                background: C.accent,
                color: C.accentInk,
                fontFamily: "inherit",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                transition: "filter 120ms ease-out",
              }}
            >
              Export
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
