# Auto-Fit Framing & Sprite Margins

## Status

Phases 1–4, 6 and 7 are implemented, tested, and documented. Phase 5 shipped in part.

| Phase | State | Notes |
| ----- | ----- | ----- |
| 1 — `fit-solve.ts` | Done | 33 unit tests. |
| 2 — Workflow pre-pass | Done | Serves the web UI and the CLI from one implementation. |
| 3 — Postprocess margin | Done, rationale corrected | See below. |
| 4 — Non-workflow export | Done | `useFitCamera` + **Fit camera to animation** in the Export Workbench. |
| 5 — Trim, margin, pivot | **Partial** | `spriteMargin` and metadata shipped; per-frame alpha trim and pivots **not** done. |
| 6 — Web UI | Done | Measuring phase and fit warnings in the workflow panel. |
| 7 — CLI passthrough | Done | `--fit`, `--margin`, `--marginUnit`, `--fitScope`, `--fitSamples`, `--atlasSpriteMargin`. |

### Corrections to this plan, found while building

**Phase 3's stated rationale was wrong.** The claim was that a row with an outline ends up at a different effective scale than a row without one. It does not: `getRequiredPadding` reads *global* postprocess settings and `applySpritePostprocessRows` grows every row by the same amount, so there is no per-row drift. The real defect is smaller but real — a 64×64 export silently leaves as 70×70 once a 3px outline is on. Phase 3 shipped as the fix for *that*: the solve reserves the effect's pixels up front, and `preserveFrameSize` draws effects inside the captured frame so the requested size is what ships.

**`getModelFromCache` is dead code.** `modelCache` in `src/store/next/models/index.ts` is read (`getModelFromCache`, `useModelObject`) and cleared, but never written to — every call returns `null`. The first pre-pass implementation used it and measured nothing at all, silently: empty bounds, no solve, no visible error. The live objects come from `useRefsStore` instead. Worth deleting or fixing separately.

### Phase 5, what is left

`spriteMargin` is implemented end to end (options → slot size → placement → renderer → `meta.margin`), distinct from `padding` (slot gutter) and `extrude` (gutter fill). Per-frame alpha trimming and pivot emission are not. They need per-frame bbox measurement wired into the export path, per-frame rects with `spriteSourceSize`/`sourceSize`, normal-map rect alignment, and an audit of every engine exporter that assumes a fixed grid. Their value is also lower now: with one shared framing and a known margin, trim is mainly an atlas-space saving, and the `packed` layout already recovers some of that.

## Summary

Capture is single-pass today: every frame renders with a camera distance the user guessed before anything is known about the model's on-screen extent. That produces the two symptoms that make sheets non-production-ready — perspective drift between animations (a jump, a drawn weapon, or a wider profile silently changes world-units-per-pixel) and unpredictable margins (`atlasPadding` pads the *cell*, not the *sprite*).

Fix both with one primitive: **a measure pass before capture** that walks the full export matrix, unions every extent into one box, and solves a single framing that fits the worst case with a declared margin. Capture then runs with locked parameters, so one scale and one pivot hold across the whole sheet.

The workflow runner (`src/hooks/next/use-workflow.ts:278`) is a React hook in the browser; the CLI drives it through `__SSH_BRIDGE__` + PubSub rather than owning a capture loop. **The solve therefore lands in the web app and the CLI from a single implementation** — the CLI adds flag passthrough only. Two surfaces need separate wiring: the non-workflow export path (web only) and the atlas trim/pivot step (shared, but downstream of capture).

## Key Changes

### Phase 1 — Shared solve module (`src/utils/fit-solve.ts`)

Pure, React-free, store-free — same shape as `src/utils/workflow-camera.ts`, unit-testable in isolation.

- `sampleClipBounds(model, clip, sampleTimes, options)` → world-space `Box3` per sample. Drives `AnimationMixer.setTime(t)`, forces `updateWorldMatrix`, then computes bounds.
- `projectBoundsToNdc(box, camera)` → projects the 8 corners through the resolved camera, returns an NDC rect.
- `solveFit(rects, { margin, marginUnit, aspect, cameraType })` → `{ distance, zoom, targetOffset, scale }`. Perspective solves distance; orthographic solves zoom.
- `resolveFitScope(steps, scope)` → groups steps into solve buckets (`all` = one framing for everything, `animation` = one per clip, `direction` = one per direction).

**Skinned bounds are the accuracy risk.** `Box3.setFromObject` *does* resolve skinning for a `SkinnedMesh` — but only once. It calls `computeBoundingBox()` when `mesh.boundingBox` is still null, then caches that box forever, so every later pose reports the first pose's bounds. Sampling a clip through it returns an identical box at every time, silently. Verified against three 0.176 in this repo. The solve therefore measures deforming meshes directly, via `getVertexPosition` (which resolves skinning *and* morph targets) over a strided vertex subset; static meshes keep the exact geometry-bounding-box path. `src/utils/pose-ik.ts:446` uses the cached call, which is fine for its one-shot use but must not be copied into the measure pass.

### Phase 2 — Workflow pre-pass (`src/hooks/next/use-workflow.ts`)

- Add `fit` to `WorkflowRunOptions` (`src/utils/workflow-camera.ts:16`):
  `{ mode: "auto" | "manual", margin: number, marginUnit: "px" | "percent", scope: "all" | "animation" | "direction" }`.
- Before the capture loop at `:329`, walk the same resolved step list: resolve each step's camera via `resolveWorkflowCamera`, sample its clip, project, union per scope bucket.
- Feed the solved distance/zoom in as `defaultDistance` for the per-step `resolveWorkflowCamera` call at `:353`, so per-direction overrides still layer on top of the solve rather than being replaced by it.
- Measure must honour the same `forceAnimationsInPlace` setting used at capture — with root motion live, bounds sweep the entire travel path and the solve zooms way out.
- Extend workflow state with `phase: "measuring" | "capturing"` so progress reporting stays honest during the pre-pass.

Both `runWorkflow` call sites — `workflows.tsx:707` (UI Run button) and `:915` (CLI `START_WORKFLOW`) — inherit this with no further change.

### Phase 3 — Reserve postprocess margin in the solve

`getSpritePostprocessPadding` (`src/utils/sprite-postprocess.ts:401`) already computes exactly how many pixels outline/glow/shadow need. It is currently applied *after* capture by growing the canvas (`padFrame`, `:354`), which means a row with a 3px outline ends up at a different effective sprite scale than a row without one — silhouette drift from the opposite direction.

Feed that number into `solveFit` as reserved margin so the frame is sized correctly up front and the scale stays uniform.

### Phase 4 — Non-workflow export path (web only)

Single-sequence export goes through `src/hooks/next/use-export.ts` and never touches workflow camera resolution — this is the one gap the CLI does not cover.

- Add a **Fit to animation** action in the Export Workbench that runs the same solve over the selected clip(s) and writes the result to `cameraDistance` / `target` in the settings store.
- Reuse Phase 1 directly; no second solve implementation.

### Phase 5 — Trim, margin, and pivot at pack time (`src/utils/atlas.ts`)

Independent of Phases 1–4 and shippable separately. Export runs browser-side for both surfaces, so this is shared automatically.

- Measure the alpha bbox of each captured frame; record a per-row content box and pivot in the atlas plan and the spritesheet JSON.
- Introduce `spriteMargin` — a guaranteed transparent border *inside* the cell — as a distinct concept from the existing `atlasPadding` (slot gutter) and `atlasBleed` (edge extrusion). All three keep their current meanings.
- Keep colour and normal rects aligned; normal frames are padded, never trimmed independently.

### Phase 6 — Web-only UI payoff

The solved box is drawable, which the CLI can never offer:

- Render the fit box and margin guides in the workflow preview.
- Warn at setup time when a step's measured extent exceeds the solved frame — turning "the jump was clipped, found out after importing to Godot" into something visible before capture.

### Phase 7 — CLI passthrough (`cli/options.ts`, `cli/workflows.ts`)

Add `--fit auto|manual`, `--margin <px|%>`, `--fitScope all|animation|direction`. Each option touches the six existing spots in `cli/options.ts` (DEFAULTS `~:28`, raw type `~:66`, parseArgs config `~:194`, help text `~:346`, key list `~:395`, resolution `~:550`), then joins `workflowRunOptions` in `cli/workflows.ts:102`.

## Interfaces

New exported types in `src/utils/fit-solve.ts`:

- `FitMode`, `FitScope`, `FitMarginUnit`
- `FitOptions` — margin, marginUnit, scope, sample density
- `FitSolution` — `{ distance, zoom?, targetOffset, scale, measuredRect }`
- `SampledBounds`

Extended:

- `WorkflowRunOptions` gains optional `fit` (`src/utils/workflow-camera.ts:16`)
- `AtlasOptions` gains optional `spriteMargin` and `trim`
- Workflow state gains `phase`

Compatibility:

- `fit.mode` defaults to `"manual"` — existing projects, CI configs, and goldens keep their current framing until opted in.
- Per-frame trim/pivot in the spritesheet JSON is additive and optional; audit `src/utils/exports/` for exporters that assume a fixed grid before enabling trim by default.

## Test Plan

Unit:

- `tests/unit/fit-solve.test.ts` — bounds sampling across a clip, skinned vs static meshes, NDC projection, margin math in px and percent, perspective distance vs orthographic zoom, the three scope modes
- `tests/unit/atlas.test.ts` and `tests/unit/spritesheet-json.test.ts` — trim boxes, `spriteMargin` vs `atlasPadding`, pivot output, normal-rect alignment
- `tests/unit/cli-options.test.ts` — new flags, defaults, invalid values

Integration:

- `tests/integration/cli-workflows.test.ts` — a workflow run with `--fit auto` produces one framing across steps
- `tests/integration/exporters.test.ts` — engine exporters still emit valid output with trim metadata present

E2E:

- `tests/e2e/workflow-goldens.test.ts` — goldens shift once auto-fit is enabled in a fixture; regenerate with `npm run test:e2e:update-goldens` and review the diff by eye, not blindly
- `tests/e2e/web-ui-workflow-reproducibility.test.ts` — UI and CLI must still agree frame-for-frame with `fit` set, which is the real proof that one implementation serves both surfaces

Commands: `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build`

Manual checks:

- A model with a jump and an idle: confirm both render at identical scale and neither clips
- A character with root motion: confirm `forceAnimationsInPlace` on and off both frame sensibly
- Outline postprocess on one row only: confirm scale matches the unoutlined rows

Docs to update: `docs/workflows.md`, `docs/cli.md`, `docs/exporting.md`, `docs/reproducible-workflows.md`, plus the CLI option tables in `README.md`.

## Risks

- **Skinned bounds accuracy** — the central technical risk; mitigated by direct `getVertexPosition` sampling rather than the cache-once `Box3.setFromObject` path. Covered by a regression test that pins the caching behaviour.
- **Sampling vs capture drift** — capture is wall-clock driven (`scheduleInterval`, `use-export.ts:305`), so measured sample times do not map exactly to captured poses. Mitigate by sampling denser than `frameCount` and keeping a small safety margin in the solve.
- **Golden churn** — any fixture that opts into auto-fit produces new goldens; keep the opt-in narrow at first.
- **Measure cost** — the pre-pass walks animations × directions. Strided vertices and capped sample counts keep it well under capture time, but it needs a progress phase so long runs do not look hung.

## Assumptions

- `manual` stays the default; auto-fit is opt-in per run, not a silent behaviour change.
- Phases 1–2 are the core deliverable and cover both surfaces; Phase 5 is independently valuable and can ship on its own schedule.
- Margins are expressed against the final frame size, so `atlasScale` composes on top rather than being folded into the solve.
- Fits the v0.5 "Atlas & Rendering Quality / Rendering Safety" slot in `ROADMAP.md`.
