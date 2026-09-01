# Design Lab run log

**Started:** 2026-08-28
**Target:** Workbench chrome — left rail + export rail (three-column shell)

## Preflight
- Framework: Vite + React, **no router** → lab mounts from `src/main.tsx` on `?design_lab=true`
- Styling: Tailwind v4, CSS-first tokens in `src/index.css`
- Package manager: npm
- Design Memory: none found

## Interview
- Surface: both rails, in a mini three-column shell (so each direction is judged next to the artwork)
- Palette freedom: **anything goes** — saturated fields permitted, some variants are demos not candidates
- Directions: pixel-native instrument, density-first DCC, darkroom, neo-brutalism (control), bento box (user-added)

## Variants
| | Direction | Axis explored |
|---|---|---|
| A | Pixel-native instrument | Surface language on the committed palette |
| B | Density-first DCC | Density + interaction model (drag-scrub fields) |
| C | Darkroom | Contrast budget, progressive reveal |
| D | Neo-brutalism | Control — full-strength, saturated |
| E | Bento box | Layout model — tiles instead of rails |
| F | Blueprint | Measurement as the visual language |
| G | Terminal-native | Identity borrowed from the shipped CLI |
| H | Contact sheet | Domain metaphor (film/capture), contained |
| I | Swiss grid | Restraint pole — no decoration at all |
| J | Pipeline | Information architecture, not skin |
| K | Retro system chrome | Second control — bevels, pixel-art era |
| L | Fluent 2 | Layered surfaces, reveal on hover |
| M | Material 3 | Elevation + tonal roles, at full strength |

## Files (all temporary)
- `src/__design_lab/` — page, variants, fixtures, shared primitives, FeedbackOverlay
- `.claude-design/design-brief.json`, `.claude-design/run-log.md`
- `src/main.tsx` — `?design_lab=true` branch (revert on cleanup)

## Notes
- Fixture atlas corrected mid-run: page is 256×256 with 22 frames (two full rows + a short third)
  so the map shows genuine waste and the 69% readout is computed from the placements.
- Verified the normal app still boots with no page errors after the `main.tsx` branch.

## Round 2 (variants F–M)
- User asked for more directions; picked all six proposed plus Fluent and Material.
- I had argued against Material (elevation shadows and a seeded violet next to the artwork).
  User reaffirmed, so it is built at full strength rather than hobbled — same treatment
  brutalism got — and the comparison decides it.
- Three defects found and fixed by rendering: `AtlasMini` stretched the square page into a
  rectangle (now aspect-correct, matching the shipped AtlasMap rule); F overflowed its shell
  because the square figure filled the rail; G tinted the sprite checkerboard green for no
  reason its thesis required.
- All 13 variants render with zero page or console errors.


## Round 3 — synthesis (variant N)

Feedback: "material surfaces, bento box structure and inputs, the pipeline
organization, the density first usability, the pixel native simplicity,
fluent 2 cleanliness."

Traits mapped M→surfaces, E→structure+inputs, J→organization, B→usability,
A→simplicity, L→cleanliness. Two conflicts had to be resolved rather than averaged:

1. **Material surfaces vs. pixel-native simplicity.** M3 carries elevation as tone
   *and* shadow. N keeps the tonal ladder, drops the shadows — the depth without
   the soft edges, and it retires the shadows-beside-artwork objection.
2. **Bento gutters vs. density-first.** Bento spends width on gutters, DCC on
   content. N keeps the tiles (they carry the structure) and runs DCC density
   inside them: 20px rows, 10–11px labels, scrub fields.

Judgement call: reseeded the M3 tonal ladder from the steel accent already in
index.css instead of M3 dark's violet. The ask was Material *surfaces*, and a
violet-tinted neutral beside a sprite is the exact failure mode this whole
exploration has been testing.

Lab restructured: N leads, six contributing sources kept below with took/left
notes, other seven retired (files kept on disk, unimported).


## Round 4 — N revised from interactive feedback (7 comments)

| # | Comment | Resolution |
|---|---|---|
| 1 | coverage "can take all width" | Stage gained a `wide` slot that breaks out of the step indent; atlas + coverage now span the tile. |
| 2 | "pipeline steps more towards edit to completion, make sure it makes sense" | Re-cut to Scene → Capture → Effects → Pack → Export. Dropped the invented "Trim"; added Effects (a real stage that was missing); moved interval/margin into Capture, since editing them invalidates everything downstream. |
| 3 | "can this have the actual sprites?" | `AtlasMini` gained a `sprites` mode drawing real frames. Needed a wider page to leave legible cells — fixture is now 320×128 (a more typical sheet) with 14 frames at 70% coverage. |
| 4 | "see the top bar and the menus" | Top bar added (icon groups, undo/redo, primary Record action) plus one open menu showing item, shortcut, divider and hover styling. |
| 5 | "explorer should keep their icons" | Type icons restored — camera / light / model — tinted to accent on the selected row. New `icons.tsx` matching the lucide shapes the app already uses. |
| 6 | "preview vs scene views" | Split into two surfaces. Scene view keeps the furniture (grid, dashed capture bounds labelled 64×64); preview is a separate tile with its own frame scrubber. |
| 7 | "do not need this info in the preview" | Frame caption removed. The preview carries only the pixels and its scrubber. |

Follow-up caught while rendering: the open menu was anchored under Create and
covered the explorer — hiding the icons comment 5 had just asked for. Re-anchored
under Workflows so it opens over the viewport instead.


## Round 5 — N revised again (4 comments)

| # | Comment | Resolution |
|---|---|---|
| 1 | "is there a way to select the sequence?" | Sequence chips added to the preview panel (idle 6 / walk 5 / attack 3), selected chip carries the accent tint; the scrubber length follows the chosen sequence. |
| 2 | "there are 2 views here, the scene, where elements can be moved and the preview, which is the view from the camera" | Corrected my model. There are three things, not two: **Scene view** (objects are moved — now carries a translate gizmo and keeps the grid), **Camera** (what the render camera sees — a PiP nested bottom-right, labelled with the capture size), and **Sequence** (playback). The dashed capture bounds moved out of the scene view; the camera PiP *is* the bounds. |
| 3 | "keep this preview of the sequence, i like it" | Kept, structure unchanged, selector added. |
| 4 | "can i see an example of the export modal?" | New `VariantNModal`, rendered under N as `data-variant="N-modal"`. |

Export dialog premise: the rail has already reported the atlas state by the time
this opens, so the dialog is not a second settings screen — it answers "what is
about to be written, and where". Format list left (the only real choice, grouped
as the app groups it), consequences right: atlas thumbnail with real frames,
page/used/pages, the warning, and the exact files with sizes and destination.

The warning is one shared string in fixtures, printed identically by the Pack
stage and the dialog. Also replaced the earlier invented "1 sequence spills"
warning, which was inconsistent with 70% coverage on a single page — it is now
a genuine non-power-of-two warning that matches the fixture data.

Defect caught while rendering: `AtlasMini` sizes from `width: 100%`, so placing
it in an `auto` grid track collapsed it to zero width in the dialog. Given a real
156px track.


## Round 6 — N revised (2 comments)

| # | Comment | Resolution |
|---|---|---|
| 1 | "sequence preview, loop option, or option to edit the current frame, also to go to next or previous frame like a carrousel (just two buttons on the side)" | Transport filled in: ‹ / › step buttons flanking the frame so the thumbnail reads as a carousel, frame number badged on the frame itself, a Loop toggle (shown engaged — looping is the default for sprite work), and "Edit frame 4" placed directly beside the frame it acts on rather than in the header. |
| 2 | warning "could be better stylized" | Given a surface of its own — amber-tinted card, hairline border, alert glyph, headline, one-line detail, and the fix as an inline action. It now reads as a state to resolve rather than a sentence left in the panel. |

Warning wording is now three shared strings (`title`, `short`, `detail`, `fix`)
in fixtures. Headline is identical in both places; the rail spends its room on
the fix, the dialog on the arithmetic behind it. Progressive detail, never a
paraphrase.


## Round 7 — N revised (3 comments)

| # | Comment | Resolution |
|---|---|---|
| 1 | "edit frame and edit sequence buttons" | Two buttons, two scopes: "Edit frame 4" (names the frame shown beside it) and "Edit sequence" (acts on the chip selected above). Placed together so the pair reads as a choice of scope rather than one button with an implied target. |
| 2 | "the line on the steps should still be connected even if there is a warning, also spacing is important between elements so nothing feels overlapped" | Real structural bug I introduced in round 4: to widen the coverage readout I let stage content span both grid columns, which cut the connector — the line stopped above the block and restarted below, so a warned stage read as detached from the run. Content is back in the content column, connector runs unbroken from stage 1 to 5, and the indent narrowed (16→14 marker, 7→6 gap) to buy back most of the width. Spacing between stages 9→14px, content offset 6→8px, sub-block gaps 6→8px. |
| 3 | "hopefully this is dragabble" | It is now — really, not as a drawing. `CameraPiP` holds its own offset, drags from its header (grip cue, grab/grabbing cursors), and clamps inside the scene view. Verified by driving a real mouse drag in Puppeteer and asserting both the movement and the clamp. |

Follow-on caught by rendering: the opened-up spacing pushed stage 5 out of the
tile, which clips under `overflow: hidden`. Spacing is what was asked for, so
the mock gained height (540→588) and the atlas lost 6px rather than the spacing
being clawed back.

Self-inflicted defect worth noting: the `Stage` rewrite sliced from
`function Stage` to `function TopBarButton` and silently deleted `TranslateGizmo`,
which lived between them. Caught by the runtime error in the browser console,
not by tsc.


## Round 8 — N-modal (1 comment)

"use the logos for the export options" — done, from the real assets in `public/`.

Design decision the request forced: brand logos and our own icons get different
substrates. Our icons are ours to theme, so they sit on the dark tile and take
the accent when selected. A third-party mark is not ours to recolour — several
of these ship with black fills that vanish on a dark surface, and only Unity has
a dark variant — so every logo gets a light chip, the background it was drawn
for. Formats with no brand mark (Spritesheet, ZIP, GIF) keep a lucide icon.

Verified all four logos decode in the browser (naturalWidth > 0) with no failed
requests, rather than trusting the paths.

### Bug found in the shipped app (not the mock)

`src/components/export-workbench.tsx:147`

```ts
godot: { light: "/godot.svg" },
```

`public/` contains **godot.png**, not godot.svg. The request 404s and, because
`FormatMark` renders `<img alt="" aria-hidden="true">`, it fails silently — an
empty bordered box where the Godot logo should be, with nothing in the console
to suggest why. Every other entry in `FORMAT_LOGOS` matches a real file. One
character fix; recorded here rather than changed, since the export rail is
mid-redesign.
