import { FeedbackOverlay } from "./FeedbackOverlay";
import { VariantN } from "./VariantN";
import { VariantNModal } from "./VariantNModal";
import { VariantA } from "./VariantA";
import { VariantB } from "./VariantB";
import { VariantE } from "./VariantE";
import { VariantJ } from "./VariantJ";
import { VariantL } from "./VariantL";
import { VariantM } from "./VariantM";

/** What each surviving variant contributed to the synthesis. */
const SOURCES = [
  {
    id: "M",
    name: "Material 3",
    took: "Surfaces — the tonal role ladder (base → container → high → highest).",
    left: "The drop shadows, and the violet seed. Depth is carried by tone alone in N, and the ladder is reseeded from the app's own steel accent so the chrome stays neutral next to the sprite.",
    render: <VariantM />,
  },
  {
    id: "E",
    name: "Bento box",
    took: "Structure and inputs — discrete tiles with real gutters; sunken, rounded, centred monospace value cells.",
    left: "The interior padding. Bento spends width on air; N spends it on rows.",
    render: <VariantE />,
  },
  {
    id: "J",
    name: "Pipeline",
    took: "Organization — the export rail staged scene → capture → pack → export, each step reporting its own state.",
    left: "Nothing. This one transplanted whole.",
    render: <VariantJ />,
  },
  {
    id: "B",
    name: "Density-first DCC",
    took: "Usability — rail density (20px rows, 10–11px labels) and drag-to-scrub numeric fields.",
    left: "The zero-radius hairline shell and the orange. Density moved inside the tiles rather than replacing them.",
    render: <VariantB />,
  },
  {
    id: "A",
    name: "Pixel-native",
    took: "Simplicity — monospace numerics everywhere, checkerboard as the signature texture, no soft shadows.",
    left: "The 2px hard-edged geometry, which fought bento's tiles. N meets it at 10px tiles / 5px controls.",
    render: <VariantA />,
  },
  {
    id: "L",
    name: "Fluent 2",
    took: "Cleanliness — hairline strokes on surfaces, a single accent carrying focus and selection, reveal on hover.",
    left: "The mica gradient wash. One accent, no ambient tint.",
    render: <VariantL />,
  },
];

export default function DesignLabPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f1011",
        color: "#e8e9ec",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
        padding: "32px 24px 120px",
      }}
    >
      <header style={{ maxWidth: 1040, margin: "0 auto 28px" }}>
        <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: "#6f727a" }}>
          Design Lab · round 3
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: "6px 0 10px" }}>
          Synthesis
        </h1>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: "#a1a4ac", maxWidth: 760, margin: 0 }}>
          Round 2 of the synthesis, with your seven notes applied: top bar and
          menus added, scene view split from preview, explorer icons back, the
          atlas drawing real frames, the coverage readout spanning its tile, and
          the pipeline re-cut into an order that actually holds up. The six
          source variants are kept below for checking.
        </p>
      </header>

      <main style={{ maxWidth: 1040, margin: "0 auto" }}>
        {/* ---- The synthesis ---- */}
        <div data-variant="N" style={{ marginBottom: 44 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                width: 22,
                height: 22,
                display: "grid",
                placeItems: "center",
                borderRadius: 5,
                background: "#6fa4dc",
                color: "#0b1620",
              }}
            >
              N
            </span>
            <h2 style={{ fontSize: 18, fontWeight: 650, margin: 0 }}>The synthesis</h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(216px, 1fr))",
              gap: 10,
              margin: "0 0 16px",
            }}
          >
            {[
              {
                head: "Pipeline re-cut",
                body: "Scene → Capture → Effects → Pack → Export. Interval and margin moved into Capture, where they belong — editing them invalidates everything downstream. The invented \u201cTrim\u201d step is gone; Effects was a real stage that was missing.",
              },
              {
                head: "Three views, not two",
                body: "Scene view is where objects are moved, so it keeps the grid and the translate gizmo. Camera is what the render camera sees — nested as a PiP, the way a DCC tool shows a camera. Sequence is playback of recorded frames, now with the selector it was missing.",
              },
              {
                head: "Atlas shows real frames",
                body: "The map draws the actual sprites instead of solid blocks. That needed a wider page — the fixture is now 320\u00d7128, which is a more typical sheet anyway and leaves cells big enough to recognise.",
              },
              {
                head: "One warning, two depths",
                body: "The Pack stage and the export dialog print the same headline word for word, from one string. The rail has room for the fix; the dialog has room for the arithmetic behind it. Same warning, progressive detail \u2014 never a paraphrase.",
              },
            ].map((note) => (
              <div
                key={note.head}
                style={{
                  border: "1px solid #26282c",
                  borderRadius: 8,
                  padding: "10px 12px",
                  background: "#151618",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: "#c7cad0", marginBottom: 4 }}>
                  {note.head}
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.55, color: "#8b8f97" }}>{note.body}</div>
              </div>
            ))}
          </div>

          <VariantN />

          <p style={{ fontSize: 12, lineHeight: 1.6, color: "#787b83", margin: "12px 0 0", maxWidth: 760 }}>
            <strong style={{ color: "#9a9da5", fontWeight: 600 }}>Try:</strong> hover the scene
            rows, the menu items and the numeric fields — reveal and the scrub affordance are
            live. The underline on Interval and Safe margin is the value&rsquo;s position in
            range, so the control reports itself without a separate slider.
          </p>
        </div>

        {/* ---- Export dialog ---- */}
        <div data-variant="N-modal" style={{ marginBottom: 44 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 5,
                background: "#26282c",
                color: "#e8e9ec",
              }}
            >
              N · dialog
            </span>
            <h2 style={{ fontSize: 16, fontWeight: 650, margin: 0 }}>Export modal</h2>
          </div>
          <p style={{ fontSize: 12.5, lineHeight: 1.6, color: "#9a9da5", margin: "0 0 14px", maxWidth: 760 }}>
            By the time this opens, the rail has already said the atlas is fine — so it is not a
            second settings screen. It answers one question: what exactly is about to be written,
            and where. Format on the left because it is the only real choice; the consequences of
            that choice on the right. The warning is the same sentence the Pack stage shows, word
            for word — a dialog that rephrases a warning makes you wonder if it is a different one.
          </p>
          <VariantNModal />
        </div>

        {/* ---- Sources ---- */}
        <div
          style={{
            borderTop: "1px solid #26282c",
            paddingTop: 24,
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 650, margin: "0 0 6px" }}>Sources</h2>
          <p style={{ fontSize: 12.5, lineHeight: 1.6, color: "#787b83", margin: 0, maxWidth: 760 }}>
            What N took from each, and what it deliberately left behind.
          </p>
        </div>

        <div style={{ display: "grid", gap: 36 }}>
          {SOURCES.map((source) => (
            <div key={source.id} data-variant={source.id}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    width: 20,
                    height: 20,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 5,
                    background: "#26282c",
                    color: "#e8e9ec",
                  }}
                >
                  {source.id}
                </span>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{source.name}</h3>
              </div>
              <p style={{ fontSize: 12.5, lineHeight: 1.6, color: "#9a9da5", margin: "0 0 4px", maxWidth: 760 }}>
                <strong style={{ color: "#6fa4dc", fontWeight: 600 }}>Took:</strong> {source.took}
              </p>
              <p style={{ fontSize: 12.5, lineHeight: 1.6, color: "#787b83", margin: "0 0 14px", maxWidth: 760 }}>
                <strong style={{ color: "#9a9da5", fontWeight: 600 }}>Left:</strong> {source.left}
              </p>
              {source.render}
            </div>
          ))}
        </div>
      </main>

      <FeedbackOverlay targetName="Workbench chrome — synthesis (N)" />
    </div>
  );
}
