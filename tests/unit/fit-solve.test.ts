import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  DEFAULT_FIT_OPTIONS,
  computePosedBounds,
  createFitCamera,
  getClipSampleTimes,
  getFitRatio,
  getFitScopeKey,
  normalizeFitOptions,
  projectBoxToNdc,
  resolveFitLimits,
  sampleClipBounds,
  solveFitDistance,
  solveFitZoom,
  unionBoxes,
  unionNdcRects,
  type NdcRect,
} from "@/utils/fit-solve";

function makeStaticMesh(position: [number, number, number] = [0, 0, 0]) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial(),
  );
  mesh.position.set(...position);
  return mesh;
}

/**
 * A flat quad spanning y=0..1. The lower edge is bound to the root bone, the
 * upper edge to the tip bone, so moving the tip deforms the mesh past its
 * bind-pose bounds.
 */
function makeSkinnedMesh() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [-0.5, 0, 0, 0.5, 0, 0, -0.5, 1, 0, 0.5, 1, 0],
      3,
    ),
  );
  geometry.setAttribute(
    "skinIndex",
    new THREE.Uint16BufferAttribute(
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      4,
    ),
  );
  geometry.setAttribute(
    "skinWeight",
    new THREE.Float32BufferAttribute(
      [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      4,
    ),
  );

  const rootBone = new THREE.Bone();
  const tipBone = new THREE.Bone();
  tipBone.position.set(0, 1, 0);
  rootBone.add(tipBone);

  const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshBasicMaterial());
  mesh.add(rootBone);
  mesh.bind(new THREE.Skeleton([rootBone, tipBone]));
  mesh.updateMatrixWorld(true);

  return { mesh, rootBone, tipBone };
}

function rect(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): NdcRect {
  return { minX, minY, maxX, maxY, behindCamera: false };
}

describe("normalizeFitOptions", () => {
  it("falls back to the defaults", () => {
    expect(normalizeFitOptions()).toEqual(DEFAULT_FIT_OPTIONS);
  });

  it("defaults to manual so existing runs keep their framing", () => {
    expect(DEFAULT_FIT_OPTIONS.mode).toBe("manual");
  });

  it("clamps out-of-range input", () => {
    const options = normalizeFitOptions({
      margin: -8,
      samples: 0,
      vertexStride: 0.4,
    });

    expect(options.margin).toBe(0);
    expect(options.samples).toBe(1);
    expect(options.vertexStride).toBe(1);
  });
});

describe("getFitScopeKey", () => {
  it("buckets by the requested scope", () => {
    expect(getFitScopeKey("walk", "N", "all")).toBe("all");
    expect(getFitScopeKey("walk", "N", "animation")).toBe("animation:walk");
    expect(getFitScopeKey("walk", "N", "direction")).toBe("direction:N");
  });
});

describe("getClipSampleTimes", () => {
  it("returns a single sample for a static clip", () => {
    expect(getClipSampleTimes(0, 8)).toEqual([0]);
    expect(getClipSampleTimes(2, 1)).toEqual([0]);
  });

  it("spans the clip inclusively", () => {
    const times = getClipSampleTimes(2, 5);

    expect(times).toHaveLength(5);
    expect(times[0]).toBe(0);
    expect(times.at(-1)).toBe(2);
    expect(times).toEqual([0, 0.5, 1, 1.5, 2]);
  });
});

describe("computePosedBounds", () => {
  it("measures static meshes in world space", () => {
    const mesh = makeStaticMesh([2, 0, 0]);
    const box = computePosedBounds(mesh);

    expect(box.min.x).toBeCloseTo(1.5, 5);
    expect(box.max.x).toBeCloseTo(2.5, 5);
  });

  it("ignores hidden meshes", () => {
    const group = new THREE.Group();
    const visible = makeStaticMesh([0, 0, 0]);
    const hidden = makeStaticMesh([10, 0, 0]);
    hidden.visible = false;
    group.add(visible, hidden);

    expect(computePosedBounds(group).max.x).toBeCloseTo(0.5, 5);
  });

  it("tracks the posed skeleton", () => {
    const { mesh, tipBone } = makeSkinnedMesh();

    expect(computePosedBounds(mesh, { vertexStride: 1 }).max.x).toBeCloseTo(
      0.5,
      5,
    );

    tipBone.position.set(3, 1, 0);
    mesh.updateMatrixWorld(true);

    expect(computePosedBounds(mesh, { vertexStride: 1 }).max.x).toBeCloseTo(
      3.5,
      5,
    );
  });

  it("stays live where Box3.setFromObject caches the first pose", () => {
    const { mesh, tipBone } = makeSkinnedMesh();

    // Priming the cache is what a first sample does in a real measure pass.
    expect(new THREE.Box3().setFromObject(mesh).max.x).toBeCloseTo(0.5, 5);

    tipBone.position.set(3, 1, 0);
    mesh.updateMatrixWorld(true);

    expect(new THREE.Box3().setFromObject(mesh).max.x).toBeCloseTo(0.5, 5);
    expect(computePosedBounds(mesh, { vertexStride: 1 }).max.x).toBeCloseTo(
      3.5,
      5,
    );
  });

  it("never lets the stride skip the final vertex", () => {
    const { mesh, tipBone } = makeSkinnedMesh();
    tipBone.position.set(0, 1, 0);
    mesh.updateMatrixWorld(true);

    // Vertex 3 is the last one; a stride of 3 would otherwise land on 0 and 3
    // only by luck, so check a stride that misses it arithmetically.
    const strided = computePosedBounds(mesh, { vertexStride: 2 });
    const exact = computePosedBounds(mesh, { vertexStride: 1 });

    expect(strided.max.x).toBeCloseTo(exact.max.x, 5);
  });
});

describe("sampleClipBounds", () => {
  it("captures the full sweep of a moving clip", () => {
    const mesh = makeStaticMesh([0, 0, 0]);
    const root = new THREE.Group();
    root.name = "root";
    root.add(mesh);

    const clip = new THREE.AnimationClip("slide", 2, [
      new THREE.VectorKeyframeTrack(
        "root.position",
        [0, 2],
        [0, 0, 0, 4, 0, 0],
      ),
    ]);

    const bounds = sampleClipBounds(root, clip, { samples: 5 });
    const union = unionBoxes(bounds.map((entry) => entry.box));

    expect(bounds).toHaveLength(5);
    expect(union.min.x).toBeCloseTo(-0.5, 4);
    expect(union.max.x).toBeCloseTo(4.5, 4);
  });

  it("keeps the end pose instead of wrapping to the start", () => {
    const mesh = makeStaticMesh([0, 0, 0]);
    const root = new THREE.Group();
    root.name = "root";
    root.add(mesh);

    const clip = new THREE.AnimationClip("slide", 2, [
      new THREE.VectorKeyframeTrack(
        "root.position",
        [0, 2],
        [0, 0, 0, 4, 0, 0],
      ),
    ]);

    const bounds = sampleClipBounds(root, clip, { samples: 3 });

    expect(bounds.at(-1)?.time).toBe(2);
    expect(bounds.at(-1)?.box.max.x).toBeCloseTo(4.5, 4);
  });

  it("samples a static clip once", () => {
    const root = new THREE.Group();
    root.add(makeStaticMesh());

    const bounds = sampleClipBounds(root, new THREE.AnimationClip("idle", 0, []));

    expect(bounds).toHaveLength(1);
  });
});

describe("projectBoxToNdc", () => {
  it("returns a centred rect for a centred box", () => {
    const camera = createFitCamera({
      cameraType: "perspective",
      position: [0, 0, 5],
      target: [0, 0, 0],
      fov: 75,
      aspect: 1,
    });
    const box = new THREE.Box3(
      new THREE.Vector3(-1, -1, -1),
      new THREE.Vector3(1, 1, 1),
    );

    const projected = projectBoxToNdc(box, camera);

    expect(projected.behindCamera).toBe(false);
    expect(projected.minX).toBeCloseTo(-projected.maxX, 5);
    expect(projected.minY).toBeCloseTo(-projected.maxY, 5);
    expect(projected.maxX).toBeGreaterThan(0);
  });

  it("grows as the camera moves closer", () => {
    const box = new THREE.Box3(
      new THREE.Vector3(-1, -1, -1),
      new THREE.Vector3(1, 1, 1),
    );
    const at = (distance: number) =>
      projectBoxToNdc(
        box,
        createFitCamera({
          cameraType: "perspective",
          position: [0, 0, distance],
          target: [0, 0, 0],
          fov: 75,
          aspect: 1,
        }),
      );

    expect(at(3).maxY).toBeGreaterThan(at(9).maxY);
  });

  it("flags geometry behind the camera", () => {
    const camera = createFitCamera({
      cameraType: "perspective",
      position: [0, 0, 5],
      target: [0, 0, 0],
      fov: 75,
      aspect: 1,
    });
    const behind = new THREE.Box3(
      new THREE.Vector3(-1, -1, 8),
      new THREE.Vector3(1, 1, 10),
    );

    expect(projectBoxToNdc(behind, camera).behindCamera).toBe(true);
  });

  it("returns an empty rect for empty bounds", () => {
    const camera = createFitCamera({
      cameraType: "orthographic",
      position: [0, 0, 5],
      target: [0, 0, 0],
      frustum: { left: -1, right: 1, top: 1, bottom: -1 },
      zoom: 1,
    });

    expect(projectBoxToNdc(new THREE.Box3().makeEmpty(), camera)).toEqual({
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
      behindCamera: false,
    });
  });
});

describe("unionNdcRects", () => {
  it("unions rects and carries the clipped flag", () => {
    const union = unionNdcRects([
      rect(-0.2, -0.4, 0.3, 0.1),
      { ...rect(-0.5, -0.1, 0.1, 0.6), behindCamera: true },
    ]);

    expect(union).toEqual({
      minX: -0.5,
      minY: -0.4,
      maxX: 0.3,
      maxY: 0.6,
      behindCamera: true,
    });
  });

  it("ignores degenerate rects", () => {
    const union = unionNdcRects([rect(0, 0, 0, 0), rect(-0.5, -0.5, 0.5, 0.5)]);

    expect(union.minX).toBe(-0.5);
    expect(union.maxX).toBe(0.5);
  });
});

describe("resolveFitLimits", () => {
  it("reserves a pixel margin per side", () => {
    expect(resolveFitLimits(4, "px", { width: 64, height: 64 })).toEqual({
      halfX: 0.875,
      halfY: 0.875,
    });
  });

  it("matches the equivalent percentage", () => {
    expect(resolveFitLimits(6.25, "percent", { width: 64, height: 64 })).toEqual(
      resolveFitLimits(4, "px", { width: 64, height: 64 }),
    );
  });

  it("resolves each axis against its own dimension", () => {
    const limits = resolveFitLimits(8, "px", { width: 128, height: 64 });

    expect(limits.halfX).toBeCloseTo(0.875, 6);
    expect(limits.halfY).toBeCloseTo(0.75, 6);
  });

  it("never collapses the frame", () => {
    const limits = resolveFitLimits(999, "px", { width: 64, height: 64 });

    expect(limits.halfX).toBeGreaterThan(0);
    expect(limits.halfY).toBeGreaterThan(0);
  });
});

describe("getFitRatio", () => {
  it("reports how much room is left", () => {
    const ratio = getFitRatio(rect(-0.5, -0.5, 0.5, 0.5), {
      halfX: 1,
      halfY: 1,
    });

    expect(ratio).toBeCloseTo(2, 6);
  });

  it("is bound by the tighter axis", () => {
    const ratio = getFitRatio(rect(-0.5, -0.9, 0.5, 0.9), {
      halfX: 1,
      halfY: 1,
    });

    expect(ratio).toBeCloseTo(1 / 0.9, 6);
  });

  it("measures from the origin, not the rect centre", () => {
    // Content pushed off-centre still counts its far edge, because the camera
    // target is the pivot the sheet aligns to.
    expect(
      getFitRatio(rect(0.4, -0.1, 0.8, 0.1), { halfX: 1, halfY: 1 }),
    ).toBeCloseTo(1.25, 6);
  });

  it("leaves empty content alone", () => {
    expect(getFitRatio(rect(0, 0, 0, 0), { halfX: 1, halfY: 1 })).toBe(1);
  });
});

describe("solveFitZoom", () => {
  it("converges on an exactly linear projector", () => {
    const project = (zoom: number) => rect(-0.25 * zoom, -0.25 * zoom, 0.25 * zoom, 0.25 * zoom);

    const solution = solveFitZoom(project, {
      reference: 1,
      limits: { halfX: 0.875, halfY: 0.875 },
    });

    expect(solution.value).toBeCloseTo(3.5, 4);
    expect(solution.converged).toBe(true);
    expect(solution.iterations).toBeLessThanOrEqual(2);
    expect(solution.scale).toBeCloseTo(3.5, 4);
  });
});

describe("solveFitDistance", () => {
  it("pushes the camera back until the content fits", () => {
    // Apparent size falls off as 1/distance.
    const project = (distance: number) => {
      const half = 2 / distance;
      return rect(-half, -half, half, half);
    };

    const solution = solveFitDistance(project, {
      reference: 1,
      limits: { halfX: 0.875, halfY: 0.875 },
    });

    expect(solution.value).toBeCloseTo(2 / 0.875, 3);
    expect(solution.converged).toBe(true);
    expect(solution.scale).toBeLessThan(1);
  });

  it("pulls in when the content is smaller than the margin allows", () => {
    const project = (distance: number) => {
      const half = 0.1 / distance;
      return rect(-half, -half, half, half);
    };

    const solution = solveFitDistance(project, {
      reference: 1,
      limits: { halfX: 0.9, halfY: 0.9 },
    });

    expect(solution.value).toBeLessThan(1);
    expect(solution.converged).toBe(true);
  });

  it("respects the distance bounds", () => {
    const project = (distance: number) => {
      const half = 50 / distance;
      return rect(-half, -half, half, half);
    };

    const solution = solveFitDistance(project, {
      reference: 1,
      limits: { halfX: 0.5, halfY: 0.5 },
      max: 10,
    });

    expect(solution.value).toBe(10);
  });

  it("lands a real perspective projection inside the margin", () => {
    const box = new THREE.Box3(
      new THREE.Vector3(-0.6, -1.2, -0.4),
      new THREE.Vector3(0.6, 1.2, 0.4),
    );
    const limits = resolveFitLimits(4, "px", { width: 64, height: 64 });
    const project = (distance: number) =>
      projectBoxToNdc(
        box,
        createFitCamera({
          cameraType: "perspective",
          position: [0, 0, distance],
          target: [0, 0, 0],
          fov: 75,
          aspect: 1,
        }),
      );

    const solution = solveFitDistance(project, { reference: 5, limits });
    const fitted = project(solution.value);

    expect(solution.converged).toBe(true);
    expect(solution.clipped).toBe(false);
    expect(Math.abs(fitted.maxY)).toBeLessThanOrEqual(limits.halfY + 0.01);
    expect(Math.abs(fitted.minY)).toBeLessThanOrEqual(limits.halfY + 0.01);
    // The tall axis should be the one touching the margin.
    expect(Math.abs(fitted.maxY)).toBeCloseTo(limits.halfY, 1);
  });
});
