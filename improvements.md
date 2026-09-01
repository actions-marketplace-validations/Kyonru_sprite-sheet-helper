# Improvements

Findings worth fixing, recorded as they turn up. Not a roadmap — see `ROADMAP.md` for planned work.

---

## Model caches that are never populated

**Found:** while wiring the auto-fit measure pass, which read `getModelFromCache` and silently measured nothing.

There are two independent sets of model caches, and neither exposes a working `getModelFromCache`.

### `src/store/next/models/index.ts`

```ts
const modelCache = new Map<string, THREE.Object3D>();   // never .set()
const mixerCache = new Map<string, THREE.AnimationMixer>();
const clipsCache = new Map<string, ClipEntry[]>();

export const getModelFromCache = (uuid: string) => modelCache.get(uuid) ?? null;
```

`mixerCache` and `clipsCache` are written to normally (`:719`, `:738`, `:474`, `:858`, `:1048`, `:1154`). `modelCache` is only ever **read** and **cleared** (`:650`, `:1182`) — there is no `modelCache.set` anywhere in the file, so `getModelFromCache` returns `null` for every uuid, always.

### `src/utils/model.ts`

```ts
const modelCache = new Map<string, THREE.Object3D>();
const mixerCache = new Map<string, THREE.AnimationMixer>();
const clipsCache = new Map<string, ClipEntry[]>();

export const getModelFromCache = ...
export const getMixerFromCache = ...
export const getClipsFromCache = ...
```

A second trio with the same names as the store's. **None of the three is ever written to** — all three accessors are permanently empty, and nothing imports them (only `parseModel` and `disposeParsedModel` are imported from this module). The duplicate naming is a large part of why this stays invisible: a reader who checks one file and finds `mixerCache.set` reasonably assumes the whole group works.

### Why it goes unnoticed

Every accessor returns a valid empty value — `null` or `[]` — rather than throwing. A caller measuring geometry through `getModelFromCache` gets an empty result set, produces output byte-identical to doing nothing at all, and reports success. The auto-fit pre-pass did exactly that until the output was measured against a baseline.

### Live consumer getting `null`

`src/components/entity.tsx:112`

```ts
const modelObject = useModelObject(uuid);
```

used at `:125` as the sole dependency of the `useEffect` that attaches TransformControls. Because it is always `null`, the dependency never changes and the effect never re-runs when a model finishes loading. The effect still runs on mount, so this may not be visible today, but the intended re-attach is dead.

### Separate defect in the same lines

`src/store/next/models/index.ts:1459-1461`

```ts
export const useModelObject = (uuid: string) => getModelFromCache(uuid);
export const useModelMixer = (uuid: string) => getMixerFromCache(uuid);
export const useModelClips = (uuid: string) => getClipsFromCache(uuid);
```

These are named as hooks but read plain module-level Maps. They subscribe to nothing, so a component calling them never re-renders when the underlying value changes. `useModelMixer` and `useModelClips` read caches that *are* populated, which makes them worse than the broken one: they return real data that then goes stale without notice.

### Suggested fix

The live objects are in `useRefsStore` (`src/store/next/refs.ts`), registered by `src/components/object/model.tsx:343`. That is what the auto-fit pre-pass uses.

1. Delete `modelCache` and `getModelFromCache` from the models store, or populate it where `mixerCache` is populated.
2. Delete the whole cache trio from `src/utils/model.ts` — dead in every direction.
3. Point `useModelObject` at `useRefsStore` so it actually subscribes, and either make `useModelMixer` / `useModelClips` selector-based or rename them to `getModelMixer` / `getModelClips` so callers stop expecting reactivity.
4. Check whether `entity.tsx`'s TransformControls re-attach was load-bearing once `useModelObject` starts returning real values.
