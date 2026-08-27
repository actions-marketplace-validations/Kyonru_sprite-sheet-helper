import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  solveWorkflowFit,
  type SolveWorkflowFitInput,
  type WorkflowFitStep,
} from "@/utils/workflow-fit";
import {
  createFitCamera,
  projectBoxToNdc,
  resolveFitLimits,
} from "@/utils/fit-solve";
import { computePosition } from "@/constants/workflows";

const DIRECTIONS = [
  { label: "N", phi: 55, theta: 0 },
  { label: "E", phi: 55, theta: 90 },
  { label: "S", phi: 55, theta: 180 },
  { label: "W", phi: 55, theta: 270 },
];

function box(halfWidth: number, height: number) {
  return new THREE.Box3(
    new THREE.Vector3(-halfWidth, 0, -halfWidth),
    new THREE.Vector3(halfWidth, height, halfWidth),
  );
}

function makeSteps(animations: string[]): WorkflowFitStep[] {
  return animations.flatMap((animationName) =>
    DIRECTIONS.map((direction) => ({
      rowLabel: `${animationName}_${direction.label}`,
      animationKey: animationName,
      animationName,
      directionLabel: direction.label,
      phi: direction.phi,
      theta: direction.theta,
    })),
  );
}

function baseInput(
  overrides: Partial<SolveWorkflowFitInput> = {},
): SolveWorkflowFitInput {
  return {
    steps: makeSteps(["idle"]),
    boundsByAnimation: { idle: box(0.4, 1.8) },
    lens: { cameraType: "perspective", fov: 75 },
    viewport: { width: 64, height: 64 },
    baseDistance: 5,
    baseTarget: [0, 0, 0],
    fit: { mode: "auto", margin: 4, marginUnit: "px" },
    ...overrides,
  };
}

/** Re-projects a solved step the way the capture pass will render it. */
function projectSolved(
  step: WorkflowFitStep,
  solution: { distance: number; target: [number, number, number] },
  worldBox: THREE.Box3,
  fov = 75,
) {
  return projectBoxToNdc(
    worldBox,
    createFitCamera({
      cameraType: "perspective",
      position: computePosition(
        step.phi,
        step.theta,
        solution.distance,
        solution.target,
      ),
      target: solution.target,
      fov,
      aspect: 1,
    }),
  );
}

describe("solveWorkflowFit", () => {
  it("does nothing in manual mode", () => {
    const result = solveWorkflowFit(baseInput({ fit: { mode: "manual" } }));

    expect(result.solutions).toEqual({});
    expect(result.warnings).toEqual([]);
  });

  it("gives every step one framing under the default scope", () => {
    const result = solveWorkflowFit(
      baseInput({
        steps: makeSteps(["idle", "jump"]),
        boundsByAnimation: { idle: box(0.4, 1.8), jump: box(0.5, 3.2) },
      }),
    );

    const solutions = Object.values(result.solutions);
    expect(solutions).toHaveLength(8);

    const distances = new Set(solutions.map((s) => s.distance.toFixed(6)));
    const targets = new Set(solutions.map((s) => s.target.join(",")));
    expect(distances.size).toBe(1);
    expect(targets.size).toBe(1);
  });

  it("keeps the tallest animation inside the margin", () => {
    const bounds = { idle: box(0.4, 1.8), jump: box(0.5, 3.2) };
    const steps = makeSteps(["idle", "jump"]);
    const result = solveWorkflowFit(
      baseInput({ steps, boundsByAnimation: bounds }),
    );

    const limits = resolveFitLimits(4, "px", { width: 64, height: 64 });
    const union = new THREE.Box3().union(bounds.idle).union(bounds.jump);

    for (const step of steps) {
      const solution = result.solutions[step.rowLabel];
      const rect = projectSolved(step, solution, union);

      expect(Math.abs(rect.maxY)).toBeLessThanOrEqual(limits.halfY + 0.02);
      expect(Math.abs(rect.minY)).toBeLessThanOrEqual(limits.halfY + 0.02);
      expect(Math.abs(rect.maxX)).toBeLessThanOrEqual(limits.halfX + 0.02);
    }
  });

  it("is the fix for perspective drift: one scale, not one per clip", () => {
    const bounds = { idle: box(0.4, 1.8), jump: box(0.5, 3.2) };

    const shared = solveWorkflowFit(
      baseInput({
        steps: makeSteps(["idle", "jump"]),
        boundsByAnimation: bounds,
        fit: { mode: "auto", margin: 4, scope: "all" },
      }),
    );
    const perClip = solveWorkflowFit(
      baseInput({
        steps: makeSteps(["idle", "jump"]),
        boundsByAnimation: bounds,
        fit: { mode: "auto", margin: 4, scope: "animation" },
      }),
    );

    expect(shared.solutions.idle_N.distance).toBe(shared.solutions.jump_N.distance);
    // Per-clip fitting is exactly the drift auto-fit exists to remove, so the
    // two scopes must disagree — otherwise the test proves nothing.
    expect(perClip.solutions.idle_N.distance).not.toBe(
      perClip.solutions.jump_N.distance,
    );
    expect(perClip.solutions.jump_N.distance).toBeGreaterThan(
      perClip.solutions.idle_N.distance,
    );
  });

  it("buckets per direction when asked", () => {
    const result = solveWorkflowFit(
      baseInput({
        boundsByAnimation: { idle: box(0.4, 1.8) },
        fit: { mode: "auto", margin: 0, scope: "direction" },
      }),
    );

    expect(result.solutions.idle_N.scopeKey).toBe("direction:N");
    expect(result.solutions.idle_E.scopeKey).toBe("direction:E");
  });

  it("re-centres on the measured content", () => {
    const result = solveWorkflowFit(
      baseInput({ boundsByAnimation: { idle: box(0.4, 1.8) } }),
    );

    expect(result.solutions.idle_N.target[1]).toBeCloseTo(0.9, 6);
  });

  it("leaves an explicit target alone", () => {
    const result = solveWorkflowFit(
      baseInput({ recenter: false, baseTarget: [0, 0.25, 0] }),
    );

    expect(result.solutions.idle_N.target).toEqual([0, 0.25, 0]);
  });

  it("pulls back further when the postprocess reserves pixels", () => {
    const plain = solveWorkflowFit(baseInput());
    const outlined = solveWorkflowFit(baseInput({ reservedMargin: 6 }));

    expect(outlined.solutions.idle_N.distance).toBeGreaterThan(
      plain.solutions.idle_N.distance,
    );
  });

  it("solves zoom for an orthographic lens and leaves the eye put", () => {
    const result = solveWorkflowFit(
      baseInput({
        lens: {
          cameraType: "orthographic",
          frustum: { left: -2, right: 2, top: 2, bottom: -2 },
        },
        baseZoom: 1,
      }),
    );

    const solution = result.solutions.idle_N;
    expect(solution.distance).toBe(5);
    expect(solution.zoom).toBeGreaterThan(1);
    expect(solution.converged).toBe(true);
  });

  it("warns and skips when an animation has no geometry", () => {
    const result = solveWorkflowFit(
      baseInput({ boundsByAnimation: { idle: new THREE.Box3().makeEmpty() } }),
    );

    expect(result.solutions).toEqual({});
    expect(result.warnings[0]).toContain("No measurable geometry");
  });

  it("widens the frame as the margin grows", () => {
    const tight = solveWorkflowFit(
      baseInput({ fit: { mode: "auto", margin: 0 } }),
    );
    const loose = solveWorkflowFit(
      baseInput({ fit: { mode: "auto", margin: 12 } }),
    );

    expect(loose.solutions.idle_N.distance).toBeGreaterThan(
      tight.solutions.idle_N.distance,
    );
  });
});
