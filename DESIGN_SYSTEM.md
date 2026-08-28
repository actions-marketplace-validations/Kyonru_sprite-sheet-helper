# Design System — sprite-sheet-helper

Status: **direction agreed, implementation not started.**
Last updated: 2026-08-28.

This document exists so that any agent or contributor can continue the design
work without re-deriving the reasoning or re-running the exploration. Read it
before changing anything visual.

---

## 0. How to use this document

| If you are… | Read |
|---|---|
| Implementing the redesign | §1, §3–§8, then §10 |
| Adding a new panel or control | §1, §5, §6 |
| Tempted to propose a new visual direction | §2 — it was probably already tried and rejected |
| Wondering why something looks the way it does | §9 |
| Looking for what is still undecided | §11 |

**The reference implementation is `src/__design_lab/VariantN.tsx` and
`VariantNModal.tsx`** (temporary; see §10.0). They are pixel-accurate mocks
built on fixture data, with hardcoded hex values. Production code must go
through CSS tokens (§3) — do not copy the hex literals across.

---

## 1. The governing constraint

**The chrome sits directly beside the artwork the user is judging.**

Someone is looking at a 64×64 sprite deciding whether its hue, contrast and
edges are right. Any chrome that puts saturated colour, heavy borders, texture
or a coloured cast next to that surface corrupts the judgement — they compensate
for it, export, and the sprite is wrong in-engine.

This is why Photoshop, Aseprite, Blender and Figma all converged on neutral
grey. It is not timidity; it is a measurement requirement.

Every rule below derives from this. **When a rule conflicts with an aesthetic
preference, this constraint wins.**

Practical tests before shipping any surface:
1. Does it introduce chroma above ~0.02 on any large area adjacent to the viewport or a sprite preview?
2. Does it tint a checkerboard, a preview background, or an atlas page?
3. Would a user's read of the sprite change if this panel were hidden?

If yes to any, it is wrong regardless of how good it looks.

---

## 2. Provenance — what was explored and rejected

Thirteen directions were built as working mocks and compared side by side
against identical fixture data, with the same sprite in every viewport as a
control. **Do not re-propose the rejected ones without new information.**

### Rejected, with reasons

| Direction | Why not |
|---|---|
| **Neo-brutalism** | Saturated flat fields shift perceived sprite hue through simultaneous contrast. 3px borders in a 320px rail are unaffordable, and it needs 16px+ type to land — shrunk to 11px it is just noise. |
| **Glassmorphism** | Translucent chrome over an orbiting 3D viewport means panel colour changes as the user rotates the scene. Disqualifying. |
| **Neumorphism** | Low contrast is disqualifying for a precision tool. |
| **Material 3 (as-shipped)** | Its *surfaces* were adopted (§9.1). Its elevation shadows and violet-seeded neutral were not — soft edges and a colour cast next to artwork. |
| **Retro system chrome** (System 7 / Win95) | Bevels are pure noise at 11px. Nostalgia, not an argument. |
| **Contact sheet** (film metaphor) | Charming, but the metaphor cannot survive contact with the inspector without becoming costume. |
| **Blueprint** | Strong thesis (this app measures things), but a blue ground measurably shifts the sprite read. The *dimension-line* idea is worth revisiting for the atlas map only. |
| **Terminal-native** | Real identity payoff and grounded in the shipped CLI, but monospace prose labels hurt scanning. The mono-numerics half was adopted. |
| **Swiss grid** | Useful as a restraint pole. Pure whitespace grouping reads as unstructured at rail width. |
| **Darkroom** | Hiding affordances until hover costs more than the focus buys in an app with this many controls. |

### Adopted

The chosen direction, **N**, is a synthesis of six:

| Source | Contributed |
|---|---|
| Material 3 | Tonal surface roles |
| Bento box | Tile structure; sunken centred monospace inputs |
| Pipeline | Export rail organised as pipeline stages with per-step state |
| Density-first DCC | Rail density; drag-to-scrub numeric fields |
| Pixel-native | Monospace numerics; checkerboard as signature texture; no soft shadows |
| Fluent 2 | Hairline strokes; one accent carrying focus and selection; reveal on hover |

---

## 3. Tokens

### 3.1 Current state vs. proposed

The repo already ships a palette (commit `5697e82`, "Graphite Instrument") in
`src/index.css` at **hue 265**. N proposes moving surfaces to **hue 248** — the
hue already used by `--ring` and `--sidebar-primary`. The change unifies
surfaces and accent onto one hue instead of two.

This is a small, mechanical change. **It has not been applied yet.**

### 3.2 Dark surface ladder (authoritative)

Depth is carried by **tone only**. There are no drop shadows anywhere in this
system (§9.1).

| Role | Hex (from mock) | OKLCH (for `index.css`) | Used for |
|---|---|---|---|
| `--surface-sunken` | `#131415` | `oklch(0.191 0.003 248)` | Viewport, input interiors, atlas page |
| `--background` | `#171819` | `oklch(0.208 0.003 248)` | App shell behind tiles |
| `--card` | `#1e2022` | `oklch(0.242 0.005 248)` | Default tile |
| `--surface-high` | `#26282b` | `oklch(0.276 0.006 248)` | Raised tile, menus, footer tile |
| `--surface-highest` | `#2f3235` | `oklch(0.315 0.007 248)` | Active tab, pressed control |

Rule: **the viewport is always the darkest surface on screen.** Chrome sits
above it. This is the DCC convention and it keeps the artwork the subject.

### 3.3 Content

| Role | Hex | OKLCH | Used for |
|---|---|---|---|
| `--foreground` | `#e6e8ea` | `oklch(0.930 0.004 248)` | Primary text, values |
| `--muted-foreground` | `#9ba1a7` | `oklch(0.706 0.011 248)` | Labels, unselected rows |
| `--faint-foreground` | `#6b7177` | `oklch(0.546 0.012 248)` | Units, counts, micro-labels, connectors |

### 3.4 Accent and semantics

One accent. It carries selection, focus, active state and the primary action —
nothing else.

| Role | Hex | OKLCH |
|---|---|---|
| `--accent` | `#6fa4dc` | `oklch(0.704 0.100 251)` |
| `--accent-foreground` | `#0b1620` | `oklch(0.195 0.026 247)` |
| `--ok` | `#6fbf8f` | `oklch(0.740 0.106 156)` |
| `--warn` | `#e0b062` | `oklch(0.785 0.111 78)` |
| `--destructive` | `#e0605f` | `oklch(0.649 0.161 23)` |

### 3.5 Alpha layers

Never hardcode; these are the only overlays in the system.

| Token | Value | Used for |
|---|---|---|
| `--stroke` | `rgb(255 255 255 / 0.065)` | Every tile and control border |
| `--stroke-strong` | `rgb(255 255 255 / 0.13)` | Hover border |
| `--accent-soft` | `rgb(111 164 220 / 0.14)` | Selected row/chip background |
| `--accent-line` | `rgb(111 164 220 / 0.34)` | Selected control border |
| `--warn-soft` | `rgb(224 176 98 / 0.10)` | Warning surface background |
| `--warn-line` | `rgb(224 176 98 / 0.26)` | Warning surface border |
| `--row-hover` | `rgb(255 255 255 / 0.05)` | Row hover |

### 3.6 Light theme — **NOT YET DESIGNED**

N is dark-only. Light mode currently ships the committed hue-265 palette and
will look inconsistent with any N work. See §11.

---

## 4. Type

One family (system sans). Monospace **only** for values, never for labels.

| Use | Size | Weight | Notes |
|---|---|---|---|
| Tile / panel title | 10px | 600 | uppercase, `letter-spacing: 0.7px`, `--muted-foreground` |
| Body, row label | 11px | 400 | |
| Emphasis, stage title, format name | 11px | 600 | |
| Micro-label above a field group | 9px | 400 | `letter-spacing: 0.5px`, `--faint-foreground` |
| Numeric value | 11px | 400 | monospace, `tabular-nums` |
| Unit suffix | 9px | 400 | `--faint-foreground`, inline after value |
| Hint / readout (right-aligned) | 10px | 400 | monospace, `--faint-foreground` |

**Nothing in the chrome exceeds 13px.** If a heading wants to be bigger, the
layout is wrong.

**Casing:** sentence case for labels. Never rely on the data's casing —
`formatFieldLabel()` in `src/components/inspector/index.tsx` already handles
this (`fov` → `FOV`, `castShadow` → `Cast shadow`); reuse it rather than
re-implementing.

---

## 5. Geometry and space

### 5.1 Radii

| Element | Radius |
|---|---|
| Tile | 10px |
| Control (input, button, chip, tab) | 5px |
| Row (hover/selection) | 4px |
| Menu / popover | 8px |
| Dialog | 12px |
| Atlas map, preview frame | 6px |

The current `--radius: 0.625rem` (10px) applied to *controls* is what makes the
app read as a web dashboard. Tiles keep 10px; controls drop to 5px.

### 5.2 Borders and shadows

- Every surface: **1px `--stroke`**. Never thicker.
- **No `box-shadow` anywhere.** Depth is tonal. The only permitted `box-shadow`
  is `inset 0 0 0 1px` used as a hairline separator inside the atlas map.
- Selection is a **2px accent bar** on the leading edge of a row, plus
  `--accent-soft` background. Never a glow ring.

### 5.3 Spacing

| Gap | Value |
|---|---|
| Between tiles (shell gutter) | 8px |
| Tile padding | 8px |
| Tile title → body | 7px |
| Between control groups in a tile | 6–8px |
| Between fields in a group | 4px |
| Between pipeline stages | 14px |
| Stage header → stage content | 8px |

Spacing was explicitly called out in review — when in doubt, err generous.
Never claw back spacing to fit content; give the container more room instead.

### 5.4 Heights

| Element | Height |
|---|---|
| Top bar | 34px |
| Panel header row | 36px (`min-h-9`) |
| Tree / list row | 22px |
| Tab | 22px |
| Chip | 19px |
| Numeric field (axis) | 22px |
| Scrub field | 24px |
| Icon button | 26×24px |
| Primary action button | 30px |

---

## 6. Components

### 6.1 Tile

The unit of structure. Replaces the bordered-card-per-section pattern.

```
background: var(--card)        /* or --surface-high for raised */
border: 1px solid var(--stroke)
border-radius: 10px
padding: 8px
```

Optional header row: uppercase 10px/600 title left, monospace 10px hint right.

### 6.2 PanelHeader — **already implemented**

`src/components/panels/panel-header.tsx`. Fixed `min-h-9`, 15px muted icon,
`text-xs font-semibold` title, right-aligned hint, trailing actions. Already
adopted across both rails, the materials workbench and pose studio. **Reuse it;
do not create a fourth header implementation** (there were three before
consolidation).

### 6.3 PanelEmpty / PanelTabs — **already implemented**

`panel-empty.tsx`, `panel-tabs.tsx`. Same rule: reuse.

### 6.4 ScrubField

The signature control. Bento's shape carrying DCC's scrub affordance.

- 24px tall, `--surface-sunken`, 1px `--stroke`, 5px radius
- Label left (10px, `--muted-foreground`), value right (11px mono)
- **A 2px accent bar along the bottom edge**, width = value's position in range
- `cursor: ew-resize`; drag horizontally to change
- Hover: border → `--stroke-strong`

The fill is on the **bottom edge, not full-height**. A full-height fill (the
Blender idiom) bisects the label mid-word at low values and reads as a rendering
fault. On the edge it also doubles as Fluent's accent underline — one mark
serving two purposes.

### 6.5 AxisField

For X/Y/Z triples where a label would be noise. 22px, sunken, 5px radius,
centred monospace value, same scrub affordance and hover.

### 6.6 Row (tree item, list item, menu item)

- 22px tall, 4px radius
- Unselected: `--muted-foreground`
- Hover: `--row-hover` background
- Selected: `--accent-soft` background + 2px accent bar on the leading edge, text → `--foreground`
- **Type icons are required** in the scene explorer (camera / light / model),
  tinted `--accent` on the selected row, `--faint-foreground` otherwise

### 6.7 Chip (sequence selector)

19px, 5px radius. Selected: `--accent-soft` + transparent border + 600 weight.
Unselected: transparent + `--stroke` border. Trailing count in 9px mono
`--faint-foreground`.

### 6.8 Pipeline stage

The export rail's organising structure. **A status map, not a wizard** — every
stage stays reachable, because the workflow is loopy (people re-record after
seeing the atlas).

Order is **Scene → Capture → Effects → Pack → Export**, and each stage depends
only on those above it. Capture owns interval, frame size and safe margin,
because editing them invalidates everything downstream.

Structure — a **two-column grid, always**:

```
14px marker column │ 1fr content column
```

- Marker: 14px circle, 1px border in the state colour
- Connector: 1px `--stroke`, `flex: 1` below the marker

| State | Glyph | Colour |
|---|---|---|
| done | ✓ | `--ok` |
| active | ● | `--accent` (+ `--accent-soft` fill) |
| warn | ! | `--warn` |
| todo | ○ | `--faint-foreground` |

**Content must never span into the marker column.** Doing so breaks the
connector, so the one stage with a problem is also the one that looks detached
from the run — exactly backwards. This was a real bug; do not reintroduce it to
reclaim ~20px of width.

### 6.9 Warning surface

Never loose coloured prose. Always a surface:

```
background: var(--warn-soft)
border: 1px solid var(--warn-line)
border-radius: 6px
padding: 7px 8px
```

Alert glyph + 10px/600 `--warn` headline + 10px `--muted-foreground` detail +
inline fix action.

### 6.10 Buttons

| Kind | Spec |
|---|---|
| Primary | `--accent` fill, `--accent-foreground` text, 5–6px radius, 600–700 weight. Hover `filter: brightness(1.07)`. |
| Secondary / ghost | transparent, 1px `--stroke`, `--muted-foreground`. Hover: `--surface-highest` bg, `--foreground` text. |
| Icon | 26×24px, 5px radius, transparent → `--surface-highest` on hover. |

One primary action per surface.

### 6.11 Format mark (export dialog)

**Brand logos and our own icons get different substrates, deliberately.**

- Our icons are ours to theme: dark tile (`--surface-high`), `--accent` when selected.
- A third-party logo is **not ours to recolour**. Several ship with black fills
  that vanish on dark, and only Unity has a dark variant. Every brand logo gets
  a **light chip** (`#e9eaec`, 24px, 6px radius) — the background it was drawn
  for.

Logos live in `public/`. See §12 for a bug in the current mapping.

---

## 7. Layout

```
┌─ top bar (34px) ─────────────────────────────────────────────┐
├──────────────┬─────────────────────────────┬─────────────────┤
│ Scene tile   │  Scene view                 │ Export pipeline │
│ (grows)      │  └ Camera PiP (draggable)   │ tile (grows)    │
│              │                             │                 │
│ Inspector    ├─────────────────────────────┤ Action tile     │
│ tile (auto)  │  Sequence tile (auto)       │ (auto)          │
└──────────────┴─────────────────────────────┴─────────────────┘
```

Columns: `202px | 1fr | 250px`, 8px gutters, 8px shell padding.

### The three views — keep these distinct

This was got wrong once. They are three different things:

1. **Scene view** — where objects are *moved*. Keeps the grid and the translate
   gizmo. This is the editing surface.
2. **Camera** — what the render camera sees, i.e. exactly what will be
   captured. A draggable PiP nested in the scene view, labelled with the capture
   size. The camera panel *is* the capture bounds — do not also draw bounds in
   the scene view.
3. **Sequence** — playback of already-recorded frames. Carries the transport:
   sequence chips, loop toggle, ‹ / › frame stepping flanking the frame, scrubber,
   and *two* edit scopes ("Edit frame N" and "Edit sequence") so the target is
   never ambiguous.

**Do not put scene-view information (model name, frame counter) in the preview.**
It reads as clutter because it belongs to a different surface.

---

## 8. Interaction

| Behaviour | Spec |
|---|---|
| Transition | 120ms `ease-out` for colour/background/border; 150ms for layout |
| Row hover | background → `--row-hover` |
| Control hover | border → `--stroke-strong` |
| Primary button hover | `filter: brightness(1.07)` |
| Numeric fields | horizontal drag to scrub, `cursor: ew-resize` |
| Camera PiP | draggable by its header (grip cue, `grab`/`grabbing`), **clamped inside its parent** |
| Focus | visible ring using `--accent`; never remove outlines |

Respect `prefers-reduced-motion`.

---

## 9. Decision log

These were argued and settled. Do not re-litigate without new evidence.

### 9.1 Tonal surfaces, no shadows
M3 carries elevation as tone *and* shadow. We keep the ladder and drop the
shadows. Rationale: the depth was wanted; soft edges beside artwork were not.
This is also what resolved the objection to Material generally.

### 9.2 Tiles with dense interiors
Bento spends width on gutters; DCC spends it on content. We keep the tiles —
they carry the structure — and run DCC density *inside* them. Gutters stay,
interior padding does not.

### 9.3 Steel accent, not violet
The ask was Material *surfaces*, not Material violet. The ladder is seeded from
hue 248, already present as `--ring`. A violet-tinted neutral beside a sprite is
the exact failure mode §1 prohibits.

### 9.4 One warning, progressive detail
Warning copy is **shared strings**, not per-surface prose. The headline is
identical everywhere; the rail spends its remaining room on the *fix*, the dialog
on the *arithmetic*. A surface that paraphrases a warning makes the reader wonder
whether it is a different one. Model: `{ title, short, detail, fix }`.

### 9.5 Connector continuity beats width
See §6.8.

### 9.6 The export dialog is not a settings screen
By the time it opens, the rail has already reported the atlas state. It answers
one question: *what exactly is about to be written, and where.* Format left (the
only real choice), consequences right.

---

## 10. Implementation plan

### 10.0 First: remove the lab

The design lab is temporary and must not ship.

- Delete `src/__design_lab/`
- Delete `.claude-design/`
- Revert the `?design_lab=true` branch in `src/main.tsx` (only file touched)

Extract anything worth keeping first — the mocks are the reference for §6.

### 10.1 Already landed (commit `5697e82`)

- `PanelHeader`, `PanelEmpty`, `PanelTabs` primitives + adoption
- Consolidation of three duplicate `PanelHeader` implementations
- `formatFieldLabel()` in the inspector
- Export rail restructured into disclosure sections
- "Graphite Instrument" palette at hue 265

### 10.2 Ordered work

1. **Tokens** — `src/index.css`. Move the ladder to hue 248, add the surface,
   alpha and semantic tokens from §3. Drop `--radius` for controls to 5px.
   *Blocked on §11.1 for light mode.*
2. **Kill shadows** — remove `shadow-sm` from `src/components/ui/tabs.tsx` and
   any other `shadow-*` in chrome.
3. **Tile primitive** — new `src/components/panels/panel-tile.tsx` per §6.1.
4. **ScrubField / AxisField** — new controls per §6.4–6.5. Highest-value change
   for daily use; wire into the inspector's `vector3` and `number` field kinds.
5. **Scene explorer** — row spec §6.6. Icons are already present.
6. **Export rail → pipeline** — `src/components/export-workbench.tsx`. The
   largest change. Replace `PanelSection` disclosures with pipeline stages
   (§6.8). Requires a stage-state model derived from existing validation.
7. **Warning surfaces** — §6.9, and refactor `export-validation` messages to the
   `{ title, short, detail, fix }` shape (§9.4).
8. **Sequence transport** — §7, view 3. Loop, stepping, dual edit scopes.
9. **Camera PiP** — extract from the floating "Preview Canvas"; make it
   draggable and clamped.
10. **Export dialog** — §9.6, §6.11.

### 10.3 Verification

Screenshot both themes with Puppeteer (already in `devDependencies`) before and after
each step. The lab used a headless script at 2× DPR; that approach works — the
3D viewport needs `--use-gl=swiftshader --enable-unsafe-swiftshader` and
`waitUntil: "domcontentloaded"` plus a fixed delay, since `networkidle2` never
settles.

Run `npm run typecheck`, `npm run lint`, `npm test` on every step.

---

## 11. Open questions

### 11.1 Light theme — blocking
N is dark-only. Someone must derive the light ladder. Guidance:
- Keep hue 248 and the same accent.
- Invert the ladder, but **the viewport must remain the darkest element** — do
  not make it light just because the chrome is.
- Inputs stay *below* their surroundings (inset), as the current light palette
  already does.

### 11.2 Density at real volume — unverified
N was only ever rendered at 540–588px against tidy fixtures: 5 scene objects,
3 sequences, short filenames. It has **not** been tested against a 40-object
scene, a full effects stack, or long filenames. Do this before committing to
row heights.

### 11.3 Accessibility — one known failure

Measured contrast against `--card` (`#1e2022`):

| Pair | Ratio | AA body (4.5:1) |
|---|---|---|
| `--foreground` `#e6e8ea` | 13.30:1 | pass |
| `--muted-foreground` `#9ba1a7` | 6.26:1 | pass |
| `--warn` `#e0b062` | 8.22:1 | pass |
| `--accent` `#6fa4dc` | 6.24:1 | pass |
| `--accent-foreground` on `--accent` | 6.97:1 | pass |
| **`--faint-foreground` `#6b7177`** | **3.31:1** | **fail** |

`--faint-foreground` fails AA for body text. It is currently used only for
units, counts, micro-labels and connector lines — decorative or duplicated
information — which is defensible, but fragile.

**Rule: never use `--faint-foreground` for information available nowhere else.**
If it needs to carry meaning, lighten it to ≥ `oklch(0.62 …)` (~4.6:1) first.
Full audit still outstanding for hover and selected states.

### 11.4 Undecided
- Whether the top bar keeps icon-only buttons or gains text labels.
- Whether Effects becomes a pipeline stage with real inline content or stays a summary row.
- Whether the atlas map should adopt Blueprint's dimension lines (§2) — the one idea worth salvaging from a rejected direction.

---

## 12. Bugs found during this work

### 12.1 Godot logo 404s — unfixed
`src/components/export-workbench.tsx:147`

```ts
godot: { light: "/godot.svg" },
```

`public/` contains **`godot.png`**. The request 404s and fails silently, because
`FormatMark` renders `<img alt="" aria-hidden="true">` — an empty bordered box
with nothing in the console. Every other `FORMAT_LOGOS` entry resolves. One
character.

### 12.2 See also
`improvements.md` documents unrelated model-cache defects found earlier.

---

## 13. Glossary

| Term | Meaning |
|---|---|
| **Rail** | A full-height side column (left = scene/inspector, right = export) |
| **Tile** | A bordered, rounded surface inside a rail (§6.1) |
| **Stage** | One step of the export pipeline (§6.8) |
| **PiP** | The camera preview nested in the scene view (§7) |
| **Scrub** | Changing a numeric by horizontal drag (§6.4) |
| **Ladder** | The tonal surface scale (§3.2) |
