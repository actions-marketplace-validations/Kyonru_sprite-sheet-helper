import { AtlasMini, Viewport } from "./shared";
import { ATLAS, CAPTURE, SCENE_ITEMS, SELECTED, SEQUENCES, EXPORT_STATE } from "./fixtures";

/**
 * Variant M — Material 3.
 *
 * Built at full strength rather than hobbled, so the comparison is honest:
 * tonal surface roles (surface → surface-container → surface-container-high),
 * elevation shadows, 12–20px radii, state layers on hover, filled-tonal
 * buttons, and M3 dark's seeded primary.
 *
 * The known objection is that elevation shadows and a violet-seeded neutral sit
 * directly beside the artwork. That is exactly what this variant is here to test.
 */

const C = {
  surface: "#141218",
  surfaceContainerLow: "#1d1b20",
  surfaceContainer: "#211f26",
  surfaceContainerHigh: "#2b2930",
  surfaceContainerHighest: "#36343b",
  outlineVariant: "#49454f",
  onSurface: "#e6e0e9",
  onSurfaceVariant: "#cac4d0",
  outline: "#938f99",
  primary: "#d0bcff",
  onPrimary: "#381e72",
  primaryContainer: "#4f378b",
  onPrimaryContainer: "#eaddff",
  tertiary: "#efb8c8",
};

const sans = "Roboto, ui-sans-serif, system-ui, -apple-system, sans-serif";
const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

const elevation = {
  level1: "0 1px 2px rgba(0,0,0,0.30), 0 1px 3px 1px rgba(0,0,0,0.15)",
  level2: "0 1px 2px rgba(0,0,0,0.30), 0 2px 6px 2px rgba(0,0,0,0.15)",
};

function Surface({
  children,
  tone = C.surfaceContainer,
  radius = 16,
  elev,
  style,
}: {
  children: React.ReactNode;
  tone?: string;
  radius?: number;
  elev?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: tone,
        borderRadius: radius,
        boxShadow: elev,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** M3 label-small over a filled text field. */
function TextField({ label, value, suffix }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div
      style={{
        background: C.surfaceContainerHighest,
        borderRadius: "8px 8px 0 0",
        borderBottom: `2px solid ${C.primary}`,
        padding: "5px 12px 6px",
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: 0.4, color: C.primary }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", fontFamily: mono, fontSize: 13, color: C.onSurface }}>
        {value}
        {suffix ? (
          <span style={{ marginLeft: "auto", fontSize: 10, color: C.onSurfaceVariant }}>{suffix}</span>
        ) : null}
      </div>
    </div>
  );
}

function TitleMedium({ children, trailing }: { children: React.ReactNode; trailing?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
      <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: 0.1, color: C.onSurface }}>
        {children}
      </span>
      {trailing ? (
        <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 11, color: C.onSurfaceVariant }}>
          {trailing}
        </span>
      ) : null}
    </div>
  );
}

export function VariantM() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "216px 1fr 248px",
        gap: 12,
        height: 428,
        background: C.surface,
        color: C.onSurface,
        fontFamily: sans,
        padding: 12,
        borderRadius: 16,
        overflow: "hidden",
        fontSize: 13,
      }}
    >
      <style>{`
        .dl-m-row:hover { background: rgba(208,188,255,0.08) !important; }
        .dl-m-btn:hover { box-shadow: 0 1px 2px rgba(0,0,0,0.3), 0 2px 6px 2px rgba(0,0,0,0.15); filter: brightness(1.05); }
      `}</style>

      {/* Left rail */}
      <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: 12, minHeight: 0 }}>
        <Surface tone={C.surfaceContainerLow} elev={elevation.level1} style={{ padding: 12 }}>
          {/* segmented button */}
          <div
            style={{
              display: "flex",
              border: `1px solid ${C.outline}`,
              borderRadius: 20,
              overflow: "hidden",
              marginBottom: 12,
            }}
          >
            {["Explorer", "Effects"].map((tab, i) => (
              <button
                key={tab}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  background: i === 0 ? C.primaryContainer : "transparent",
                  color: i === 0 ? C.onPrimaryContainer : C.onSurfaceVariant,
                  border: "none",
                  borderRight: i === 0 ? `1px solid ${C.outline}` : "none",
                  fontFamily: sans,
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: 0.3,
                  cursor: "pointer",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <TitleMedium trailing={`${SCENE_ITEMS.length}`}>Scene</TitleMedium>
          <div style={{ display: "grid", gap: 2 }}>
            {SCENE_ITEMS.map((item) => (
              <div
                key={item.name}
                className="dl-m-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "7px 12px",
                  borderRadius: 20,
                  background: item.selected ? C.primaryContainer : "transparent",
                  color: item.selected ? C.onPrimaryContainer : C.onSurfaceVariant,
                  fontSize: 12,
                  transition: "background 150ms cubic-bezier(0.2,0,0,1)",
                }}
              >
                {item.name}
              </div>
            ))}
          </div>
        </Surface>
        <Surface tone={C.surfaceContainerLow} elev={elevation.level1} style={{ padding: 12, minHeight: 0 }}>
          <TitleMedium trailing={SELECTED.typeLabel}>{SELECTED.name}</TitleMedium>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {SELECTED.position.map((value, i) => (
              <div
                key={i}
                style={{
                  background: C.surfaceContainerHighest,
                  borderRadius: "8px 8px 0 0",
                  borderBottom: `2px solid ${C.outline}`,
                  padding: "6px 8px",
                  fontFamily: mono,
                  fontSize: 12,
                  textAlign: "center",
                }}
              >
                {value}
              </div>
            ))}
          </div>
        </Surface>
      </div>

      {/* Viewport */}
      <Surface
        tone={C.surfaceContainerLow}
        elev={elevation.level2}
        style={{ overflow: "hidden", display: "grid", minHeight: 0 }}
      >
        <Viewport
          background="#101014"
          checker="rgba(208,188,255,0.055)"
          label="knight.glb · idle · 4/8"
          labelStyle={{ fontFamily: mono, fontSize: 11, color: C.onSurfaceVariant }}
        />
      </Surface>

      {/* Export rail */}
      <div style={{ display: "grid", gridTemplateRows: "auto auto 1fr", gap: 12, minHeight: 0 }}>
        <Surface tone={C.surfaceContainer} elev={elevation.level1} style={{ padding: 12 }}>
          <TitleMedium trailing="Ready">Export</TitleMedium>
          <AtlasMini
            fill={C.primary}
            checker="rgba(208,188,255,0.06)"
            page={C.surfaceContainerHigh}
            gapColor={C.surfaceContainerHigh}
            radius={12}
            height={68}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontFamily: mono, fontSize: 13 }}>
            <span>{ATLAS.width}×{ATLAS.height}</span>
            <span style={{ color: C.onSurfaceVariant, fontSize: 11 }}>
              {ATLAS.frameCount}f · {ATLAS.coverageLabel}
            </span>
          </div>
        </Surface>
        <Surface tone={C.surfaceContainer} elev={elevation.level1} style={{ padding: 12 }}>
          <TitleMedium trailing={`${CAPTURE.width}×${CAPTURE.height}`}>Capture</TitleMedium>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <TextField label="Interval" value={CAPTURE.interval} suffix="ms" />
            <TextField label="Frames" value={CAPTURE.frames} />
          </div>
        </Surface>
        <Surface
          tone={C.surfaceContainer}
          elev={elevation.level1}
          style={{ padding: 12, display: "flex", flexDirection: "column", minHeight: 0 }}
        >
          <TitleMedium trailing={`${SEQUENCES.length}`}>Sequences</TitleMedium>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SEQUENCES.map((seq) => (
              <span
                key={seq.name}
                style={{
                  padding: "4px 12px",
                  borderRadius: 8,
                  border: `1px solid ${seq.selected ? "transparent" : C.outlineVariant}`,
                  background: seq.selected ? C.primaryContainer : "transparent",
                  color: seq.selected ? C.onPrimaryContainer : C.onSurfaceVariant,
                  fontSize: 11,
                }}
              >
                {seq.name} · {seq.frames}f
              </span>
            ))}
          </div>
          <div style={{ marginTop: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.onSurfaceVariant, marginBottom: 10 }}>
              <span>{EXPORT_STATE.format}</span>
              <span style={{ fontFamily: mono }}>{EXPORT_STATE.files} files</span>
            </div>
            <button
              className="dl-m-btn"
              style={{
                width: "100%",
                padding: "10px 0",
                background: C.primary,
                color: C.onPrimary,
                border: "none",
                borderRadius: 20,
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: 0.1,
                cursor: "pointer",
                boxShadow: elevation.level1,
                transition: "box-shadow 150ms cubic-bezier(0.2,0,0,1), filter 150ms",
              }}
            >
              Prepare Export
            </button>
          </div>
        </Surface>
      </div>
    </div>
  );
}
