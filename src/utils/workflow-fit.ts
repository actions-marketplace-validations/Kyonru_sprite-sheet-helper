import * as THREE from "three";
import { computePosition } from "@/constants/workflows";
import {
  createFitCamera,
  getFitScopeKey,
  normalizeFitOptions,
  projectBoxToNdc,
  resolveFitLimits,
  solveFit,
  unionBoxes,
  unionNdcRects,
  type FitFrustum,
  type FitLimits,
  type FitOptionsInput,
  type FitVec3,
  type FitViewport,
  type NdcRect,
} from "./fit-solve";

/** One capture the solve has to keep inside the frame. */
export type WorkflowFitStep = {
  rowLabel: string;
  /** Identifies the measured bounds this step reuses. */
  animationKey: string;
  animationName: string;
  directionLabel: string;
  phi: number;
  theta: number;
};

export type WorkflowFitLens =
  | { cameraType: "perspective"; fov: number }
  | { cameraType: "orthographic"; frustum: FitFrustum };

export type SolveWorkflowFitInput = {
  steps: WorkflowFitStep[];
  /** World-space bounds per animation key, unioned across sampled times. */
  boundsByAnimation: Record<string, THREE.Box3>;
  lens: WorkflowFitLens;
  viewport: FitViewport;
  baseDistance: number;
  baseZoom?: number;
  baseTarget: FitVec3;
  /**
   * Re-centre on the measured content. Skipped when the run carries an explicit
   * target, because that is a deliberate pivot choice.
   */
  recenter?: boolean;
  /** Extra pixels per side the sprite postprocess will consume. */
  reservedMargin?: number;
  fit?: FitOptionsInput;
};

export type WorkflowFitStepSolution = {
  distance: number;
  zoom?: number;
  target: FitVec3;
  scale: number;
  converged: boolean;
  clipped: boolean;
  scopeKey: string;
};

export type WorkflowFitResult = {
  /** Solutions by row label. Empty when the run is not fitting. */
  solutions: Record<string, WorkflowFitStepSolution>;
  warnings: string[];
};

export const EMPTY_WORKFLOW_FIT: WorkflowFitResult = {
  solutions: {},
  warnings: [],
};

/**
 * Stacks two margin allowances.
 *
 * Half-extents are `1 - 2f`, so combining reserves is `halfA + halfB - 1`
 * rather than a product.
 */
function combineLimits(a: FitLimits, b: FitLimits): FitLimits {
  return {
    halfX: Math.max(0.01, Math.min(a.halfX, a.halfX + b.halfX - 1)),
    halfY: Math.max(0.01, Math.min(a.halfY, a.halfY + b.halfY - 1)),
  };
}

function toVec3(vector: THREE.Vector3): FitVec3 {
  return [vector.x, vector.y, vector.z];
}

/**
 * Solves one framing per scope bucket.
 *
 * World bounds do not depend on the camera, so they are measured once per
 * animation and re-projected per direction here — the matrix is walked once,
 * not once per direction.
 */
export function solveWorkflowFit({
  steps,
  boundsByAnimation,
  lens,
  viewport,
  baseDistance,
  baseZoom,
  baseTarget,
  recenter = true,
  reservedMargin = 0,
  fit,
}: SolveWorkflowFitInput): WorkflowFitResult {
  const options = normalizeFitOptions(fit);
  if (options.mode !== "auto" || steps.length === 0) {
    return { solutions: {}, warnings: [] };
  }

  const limits = combineLimits(
    resolveFitLimits(options.margin, options.marginUnit, viewport),
    resolveFitLimits(reservedMargin, "px", viewport),
  );

  const buckets = new Map<string, WorkflowFitStep[]>();
  for (const step of steps) {
    const key = getFitScopeKey(
      step.animationName,
      step.directionLabel,
      options.scope,
    );
    const bucket = buckets.get(key);
    if (bucket) bucket.push(step);
    else buckets.set(key, [step]);
  }

  const solutions: Record<string, WorkflowFitStepSolution> = {};
  const warnings: string[] = [];
  const aspect = Math.max(1e-6, viewport.width / viewport.height);

  for (const [scopeKey, bucket] of buckets) {
    const boxes = [
      ...new Set(bucket.map((step) => step.animationKey)),
    ]
      .map((key) => boundsByAnimation[key])
      .filter((box): box is THREE.Box3 => Boolean(box) && !box.isEmpty());

    if (boxes.length === 0) {
      warnings.push(`No measurable geometry for ${scopeKey}; kept manual framing.`);
      continue;
    }

    const worldBox = unionBoxes(boxes);
    const target = recenter ? toVec3(worldBox.getCenter(new THREE.Vector3())) : baseTarget;

    const project = (value: number): NdcRect => {
      const rects = bucket.map((step) => {
        // Orthographic framing is the zoom; the eye stays where it was.
        const distance = lens.cameraType === "orthographic" ? baseDistance : value;
        const position = computePosition(step.phi, step.theta, distance, target);

        const camera = createFitCamera(
          lens.cameraType === "perspective"
            ? {
                cameraType: "perspective",
                position,
                target,
                fov: lens.fov,
                aspect,
              }
            : {
                cameraType: "orthographic",
                position,
                target,
                frustum: lens.frustum,
                zoom: value,
              },
        );

        return projectBoxToNdc(worldBox, camera);
      });

      return unionNdcRects(rects);
    };

    const isOrthographic = lens.cameraType === "orthographic";
    const solved = solveFit(project, {
      reference: isOrthographic ? (baseZoom ?? 1) : baseDistance,
      limits,
      relation: isOrthographic ? "direct" : "inverse",
    });

    if (!solved.converged) {
      warnings.push(`Fit did not settle for ${scopeKey}; using the closest framing.`);
    }
    if (solved.clipped) {
      warnings.push(`Geometry fell behind the camera while fitting ${scopeKey}.`);
    }

    for (const step of bucket) {
      solutions[step.rowLabel] = {
        distance: isOrthographic ? baseDistance : solved.value,
        ...(isOrthographic ? { zoom: solved.value } : {}),
        target,
        scale: solved.scale,
        converged: solved.converged,
        clipped: solved.clipped,
        scopeKey,
      };
    }
  }

  return { solutions, warnings };
}
