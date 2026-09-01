import * as THREE from "three";

export type FitMode = "auto" | "manual";
export type FitScope = "all" | "animation" | "direction";
export type FitMarginUnit = "px" | "percent";

export type FitVec3 = [number, number, number];

export type FitOptions = {
  mode: FitMode;
  margin: number;
  marginUnit: FitMarginUnit;
  scope: FitScope;
  samples: number;
  vertexStride: number;
};

export type FitOptionsInput = Partial<FitOptions>;

export const DEFAULT_FIT_OPTIONS: FitOptions = {
  mode: "manual",
  margin: 0,
  marginUnit: "px",
  scope: "all",
  samples: 12,
  vertexStride: 4,
};

/** Smallest usable half-extent, so an absurd margin cannot collapse the frame. */
const MIN_FIT_LIMIT = 0.01;
const PROJECTION_EPSILON = 1e-6;

export type NdcRect = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  /** True when at least one corner fell behind the camera and was dropped. */
  behindCamera: boolean;
};

export const EMPTY_NDC_RECT: NdcRect = {
  minX: 0,
  minY: 0,
  maxX: 0,
  maxY: 0,
  behindCamera: false,
};

export type FitViewport = { width: number; height: number };

/** Usable NDC half-extents once the requested margin is reserved. */
export type FitLimits = { halfX: number; halfY: number };

export type SampledBounds = { time: number; box: THREE.Box3 };

export type FitFrustum = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

type FitCameraBase = {
  position: FitVec3;
  target: FitVec3;
  near?: number;
  far?: number;
  up?: FitVec3;
};

export type PerspectiveFitCamera = FitCameraBase & {
  cameraType: "perspective";
  fov: number;
  aspect: number;
};

export type OrthographicFitCamera = FitCameraBase & {
  cameraType: "orthographic";
  frustum: FitFrustum;
  zoom: number;
};

export type FitCameraInput = PerspectiveFitCamera | OrthographicFitCamera;

/**
 * How the solved parameter relates to apparent size: camera distance is
 * inverse (further is smaller), orthographic zoom is direct.
 */
export type FitRelation = "inverse" | "direct";

export type SolveFitInput = {
  reference: number;
  limits: FitLimits;
  relation: FitRelation;
  maxIterations?: number;
  tolerance?: number;
  min?: number;
  max?: number;
};

export type FitSolution = {
  /** Solved camera distance (perspective) or zoom (orthographic). */
  value: number;
  /** Apparent-size multiplier applied relative to `reference`. */
  scale: number;
  rect: NdcRect;
  iterations: number;
  converged: boolean;
  clipped: boolean;
};

export function normalizeFitOptions(input: FitOptionsInput = {}): FitOptions {
  return {
    mode: input.mode ?? DEFAULT_FIT_OPTIONS.mode,
    margin: Math.max(0, input.margin ?? DEFAULT_FIT_OPTIONS.margin),
    marginUnit: input.marginUnit ?? DEFAULT_FIT_OPTIONS.marginUnit,
    scope: input.scope ?? DEFAULT_FIT_OPTIONS.scope,
    samples: Math.max(
      1,
      Math.floor(input.samples ?? DEFAULT_FIT_OPTIONS.samples),
    ),
    vertexStride: Math.max(
      1,
      Math.floor(input.vertexStride ?? DEFAULT_FIT_OPTIONS.vertexStride),
    ),
  };
}

export function getFitScopeKey(
  animationName: string,
  directionLabel: string,
  scope: FitScope,
): string {
  switch (scope) {
    case "animation":
      return `animation:${animationName}`;
    case "direction":
      return `direction:${directionLabel}`;
    default:
      return "all";
  }
}

export function getClipSampleTimes(
  duration: number,
  samples: number,
): number[] {
  const count = Math.max(1, Math.floor(samples));
  const span = Math.max(0, duration);
  if (count === 1 || span === 0) return [0];

  const times: number[] = [];
  for (let index = 0; index < count; index++) {
    times.push((span * index) / (count - 1));
  }
  return times;
}

function isVisibleInTree(object: THREE.Object3D, root: THREE.Object3D): boolean {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (!current.visible) return false;
    if (current === root) break;
    current = current.parent;
  }
  return true;
}

/**
 * World-space bounds of the object in its *current* pose.
 *
 * `Box3.setFromObject` does resolve skinning for a `SkinnedMesh` -- but only
 * once. It calls `computeBoundingBox()` when `mesh.boundingBox` is still null
 * and caches the result forever, so every later pose reports the first pose's
 * bounds. Sampling a clip through it silently returns the same box at every
 * time. Deforming meshes are therefore measured directly, at a configurable
 * vertex stride through `getVertexPosition` (which resolves skinning and morph
 * targets), while static meshes keep the exact, near-free geometry-bounding-box
 * path.
 */
export function computePosedBounds(
  object: THREE.Object3D,
  options: Pick<FitOptionsInput, "vertexStride"> = {},
): THREE.Box3 {
  const { vertexStride } = normalizeFitOptions(options);
  const box = new THREE.Box3().makeEmpty();
  const vertex = new THREE.Vector3();

  object.updateWorldMatrix(true, true);

  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    if (!isVisibleInTree(mesh, object)) return;

    const position = mesh.geometry.getAttribute("position");
    if (!position) return;

    const deforms =
      (mesh as THREE.SkinnedMesh).isSkinnedMesh === true ||
      (mesh.morphTargetInfluences?.length ?? 0) > 0;

    if (!deforms) {
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      const geometryBox = mesh.geometry.boundingBox;
      if (geometryBox) {
        box.union(geometryBox.clone().applyMatrix4(mesh.matrixWorld));
      }
      return;
    }

    const expandAt = (index: number) => {
      mesh.getVertexPosition(index, vertex);
      box.expandByPoint(vertex.applyMatrix4(mesh.matrixWorld));
    };

    for (let index = 0; index < position.count; index += vertexStride) {
      expandAt(index);
    }

    // The stride must never be able to skip the final vertex.
    const last = position.count - 1;
    if (last >= 0 && last % vertexStride !== 0) expandAt(last);
  });

  return box;
}

export function unionBoxes(boxes: THREE.Box3[]): THREE.Box3 {
  const union = new THREE.Box3().makeEmpty();
  for (const box of boxes) {
    if (!box.isEmpty()) union.union(box);
  }
  return union;
}

/**
 * Measures bounds at each time, using the caller's own seek.
 *
 * The workflow pre-pass drives the live mixer through this so it measures the
 * exact rig the capture pass will render — trims, renames, and forced-in-place
 * clips included — rather than a private copy that could drift from it.
 *
 * Leaves the model on the last sampled pose; callers restore playback state.
 */
export function sampleBoundsAtTimes(
  root: THREE.Object3D,
  seek: (time: number) => void,
  times: number[],
  options: FitOptionsInput = {},
): SampledBounds[] {
  const { vertexStride } = normalizeFitOptions(options);

  return times.map((time) => {
    seek(time);
    root.updateMatrixWorld(true);
    return { time, box: computePosedBounds(root, { vertexStride }) };
  });
}

/**
 * Poses `root` across `clip` and measures bounds at each sample.
 *
 * Leaves the model on the last sampled pose — callers are expected to restore
 * playback state afterwards.
 */
export function sampleClipBounds(
  root: THREE.Object3D,
  clip: THREE.AnimationClip,
  options: FitOptionsInput = {},
): SampledBounds[] {
  const normalized = normalizeFitOptions(options);
  const times = getClipSampleTimes(clip.duration, normalized.samples);
  const mixer = new THREE.AnimationMixer(root);
  const action = mixer.clipAction(clip);
  // A looping action wraps t=duration back to t=0, which quietly drops the end
  // pose -- exactly the extreme a fit solve is looking for.
  action.loop = THREE.LoopOnce;
  action.clampWhenFinished = true;
  action.play();

  try {
    return sampleBoundsAtTimes(
      root,
      (time) => mixer.setTime(time),
      times,
      normalized,
    );
  } finally {
    action.stop();
    mixer.stopAllAction();
    mixer.uncacheClip(clip);
  }
}

export function createFitCamera(input: FitCameraInput): THREE.Camera {
  const near = input.near ?? 0.1;
  const far = input.far ?? 100;

  const camera =
    input.cameraType === "orthographic"
      ? new THREE.OrthographicCamera(
          input.frustum.left,
          input.frustum.right,
          input.frustum.top,
          input.frustum.bottom,
          near,
          far,
        )
      : new THREE.PerspectiveCamera(input.fov, input.aspect, near, far);

  if (camera instanceof THREE.OrthographicCamera) {
    camera.zoom = (input as OrthographicFitCamera).zoom;
  }

  camera.up.set(...(input.up ?? [0, 1, 0]));
  camera.position.set(...input.position);
  camera.lookAt(new THREE.Vector3(...input.target));
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();

  return camera;
}

export function projectBoxToNdc(
  box: THREE.Box3,
  camera: THREE.Camera,
): NdcRect {
  if (box.isEmpty()) return { ...EMPTY_NDC_RECT };

  const viewProjection = new THREE.Matrix4().multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse,
  );
  const corner = new THREE.Vector4();

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let behindCamera = false;

  for (let mask = 0; mask < 8; mask++) {
    corner.set(
      mask & 1 ? box.max.x : box.min.x,
      mask & 2 ? box.max.y : box.min.y,
      mask & 4 ? box.max.z : box.min.z,
      1,
    );
    corner.applyMatrix4(viewProjection);

    // A non-positive w means the corner sits at or behind the eye, where the
    // perspective divide flips the result. Drop it and flag the rect instead.
    if (corner.w <= PROJECTION_EPSILON) {
      behindCamera = true;
      continue;
    }

    const ndcX = corner.x / corner.w;
    const ndcY = corner.y / corner.w;
    minX = Math.min(minX, ndcX);
    minY = Math.min(minY, ndcY);
    maxX = Math.max(maxX, ndcX);
    maxY = Math.max(maxY, ndcY);
  }

  if (!Number.isFinite(minX)) {
    return { ...EMPTY_NDC_RECT, behindCamera: true };
  }

  return { minX, minY, maxX, maxY, behindCamera };
}

export function unionNdcRects(rects: NdcRect[]): NdcRect {
  const usable = rects.filter(
    (rect) => rect.minX !== rect.maxX || rect.minY !== rect.maxY,
  );
  if (usable.length === 0) {
    return {
      ...EMPTY_NDC_RECT,
      behindCamera: rects.some((rect) => rect.behindCamera),
    };
  }

  return {
    minX: Math.min(...usable.map((rect) => rect.minX)),
    minY: Math.min(...usable.map((rect) => rect.minY)),
    maxX: Math.max(...usable.map((rect) => rect.maxX)),
    maxY: Math.max(...usable.map((rect) => rect.maxY)),
    behindCamera: rects.some((rect) => rect.behindCamera),
  };
}

/**
 * Converts a requested margin into usable NDC half-extents.
 *
 * `px` is per side against the frame dimension, `percent` is per side against
 * the full frame — so 4px on a 64px frame and 6.25% both leave 0.875.
 */
export function resolveFitLimits(
  margin: number,
  marginUnit: FitMarginUnit,
  viewport: FitViewport,
): FitLimits {
  const width = Math.max(1, viewport.width);
  const height = Math.max(1, viewport.height);
  const requested = Math.max(0, margin);

  const fractionX = marginUnit === "percent" ? requested / 100 : requested / width;
  const fractionY =
    marginUnit === "percent" ? requested / 100 : requested / height;

  return {
    halfX: Math.min(1, Math.max(MIN_FIT_LIMIT, 1 - 2 * fractionX)),
    halfY: Math.min(1, Math.max(MIN_FIT_LIMIT, 1 - 2 * fractionY)),
  };
}

/**
 * How much the content may grow before it breaches the margin. Half-extents are
 * measured from the NDC origin rather than the rect centre, because the camera
 * target is the pivot the sheet is aligned to.
 */
export function getFitRatio(rect: NdcRect, limits: FitLimits): number {
  const halfX = Math.max(Math.abs(rect.minX), Math.abs(rect.maxX));
  const halfY = Math.max(Math.abs(rect.minY), Math.abs(rect.maxY));

  if (halfX <= PROJECTION_EPSILON && halfY <= PROJECTION_EPSILON) return 1;

  const ratioX = halfX > PROJECTION_EPSILON ? limits.halfX / halfX : Infinity;
  const ratioY = halfY > PROJECTION_EPSILON ? limits.halfY / halfY : Infinity;

  return Math.min(ratioX, ratioY);
}

/**
 * Iteratively solves the framing parameter that lands the projected content on
 * the margin. Orthographic zoom converges in one step; perspective needs a few
 * because a box with depth does not scale exactly with 1/distance.
 */
export function solveFit(
  project: (value: number) => NdcRect,
  {
    reference,
    limits,
    relation,
    maxIterations = 8,
    tolerance = 0.005,
    min = 1e-3,
    max = 1e6,
  }: SolveFitInput,
): FitSolution {
  let value = Math.min(max, Math.max(min, reference));
  let rect = project(value);
  let iterations = 0;
  let converged = false;

  for (let step = 0; step < maxIterations; step++) {
    const ratio = getFitRatio(rect, limits);
    iterations = step + 1;

    if (!Number.isFinite(ratio) || Math.abs(ratio - 1) <= tolerance) {
      converged = true;
      break;
    }

    const next = Math.min(
      max,
      Math.max(min, relation === "inverse" ? value / ratio : value * ratio),
    );
    if (next === value) {
      converged = true;
      break;
    }

    value = next;
    rect = project(value);
  }

  return {
    value,
    scale: relation === "inverse" ? reference / value : value / reference,
    rect,
    iterations,
    converged,
    clipped: rect.behindCamera,
  };
}

export function solveFitDistance(
  project: (distance: number) => NdcRect,
  input: Omit<SolveFitInput, "relation">,
): FitSolution {
  return solveFit(project, { ...input, relation: "inverse" });
}

export function solveFitZoom(
  project: (zoom: number) => NdcRect,
  input: Omit<SolveFitInput, "relation">,
): FitSolution {
  return solveFit(project, { ...input, relation: "direct" });
}
