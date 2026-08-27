import { useCallback } from "react";
import * as THREE from "three";
import { PubSub, EventType } from "@/lib/events";
import { useModelsStore } from "@/store/next/models";
import { useRefsStore } from "@/store/next/refs";
import { useSettingsStore } from "@/store/next/settings";
import {
  DEFAULT_ORTHOGRAPHIC_CAMERA,
  DEFAULT_PERSPECTIVE_CAMERA,
  ORTHOGRAPHIC_FRUSTUM_SIZE,
  useCamerasStore,
} from "@/store/next/cameras";
import { useTargetsStore } from "@/store/next/targets";
import { useTransformsStore } from "@/store/next/transforms";
import { useSpritePostprocessStore } from "@/store/next/sprite-postprocess";
import { getSpritePostprocessPadding } from "@/utils/sprite-postprocess";
import {
  computePosedBounds,
  getClipSampleTimes,
  normalizeFitOptions,
  sampleBoundsAtTimes,
  unionBoxes,
  type FitOptionsInput,
  type FitVec3,
} from "@/utils/fit-solve";
import {
  solveWorkflowFit,
  type WorkflowFitLens,
} from "@/utils/workflow-fit";
import { getWorkflowCameraTransform } from "@/utils/workflow-camera";
import { computePosition } from "@/constants/workflows";

const CLIP_END_EPSILON = 1e-3;
const FIT_ROW_LABEL = "fit";

export type FitCameraResult = {
  fitted: boolean;
  distance?: number;
  zoom?: number;
  warnings: string[];
};

/**
 * The live scene object for a model.
 *
 * Registered by the model component; `getModelFromCache` in the models store
 * looks like the obvious source but its cache is never written to.
 */
function getModelObject(uuid: string): THREE.Object3D | null {
  return useRefsStore.getState().refs[uuid]?.current ?? null;
}

/**
 * Bounds of everything loaded, swept across each model's current animation.
 *
 * The single-sequence export has no workflow to walk, so "the scene as it will
 * be captured" is the honest thing to measure.
 */
function measureLoadedModels(fit: ReturnType<typeof normalizeFitOptions>) {
  const state = useModelsStore.getState();
  const boxes: THREE.Box3[] = [];

  for (const [uuid, model] of Object.entries(state.models)) {
    if (model.loadState !== "loaded") continue;

    const root = getModelObject(uuid);
    if (!root) continue;

    const animation = state.animations[uuid];
    const clip = (state.clips[uuid] ?? []).find(
      (entry) => entry.clip.name === animation,
    )?.clip;
    const mixer = state.mixerRef[uuid];

    if (!animation || animation === "none" || !clip || !mixer) {
      boxes.push(computePosedBounds(root, fit));
      continue;
    }

    const [start, end] = state.durations[uuid]?.[animation] ?? [
      0,
      clip.duration,
    ];
    const span = Math.max(0, end - start);
    const lastUsable = Math.max(start, end - CLIP_END_EPSILON);
    const times = getClipSampleTimes(span, fit.samples).map((offset) =>
      Math.min(start + offset, lastUsable),
    );

    const sampled = sampleBoundsAtTimes(
      root,
      (time) => mixer.setTime(time),
      times,
      fit,
    );
    boxes.push(unionBoxes(sampled.map((entry) => entry.box)));
  }

  return unionBoxes(boxes);
}

/**
 * Fits the live camera to the loaded models, keeping its current direction.
 *
 * Shares the workflow solve, so a single-sequence export lands on the same
 * framing rules a workflow run would produce from the same angle.
 */
export const useFitCamera = () => {
  const fitCameraToAnimation = useCallback(
    (fitInput: FitOptionsInput = {}): FitCameraResult => {
      const fit = normalizeFitOptions({ mode: "auto", ...fitInput });
      const cameraUUID = useCamerasStore.getState().mainCamera;
      if (!cameraUUID) {
        return { fitted: false, warnings: ["No camera in the scene."] };
      }

      const worldBox = measureLoadedModels(fit);
      if (worldBox.isEmpty()) {
        return { fitted: false, warnings: ["Nothing measurable is loaded."] };
      }

      const camerasState = useCamerasStore.getState();
      const cameraValues = camerasState.cameras[cameraUUID];
      const transform = useTransformsStore.getState().transforms[cameraUUID];
      const target = (useTargetsStore.getState().targets[cameraUUID] ?? [
        0, 0, 0,
      ]) as FitVec3;

      // Keep the angle the user framed; only the distance is solved.
      const offset = new THREE.Vector3(
        ...((transform?.position as FitVec3) ?? [5, 5, 5]),
      ).sub(new THREE.Vector3(...target));
      const spherical = new THREE.Spherical().setFromVector3(offset);
      const phi = THREE.MathUtils.radToDeg(spherical.phi);
      const theta = THREE.MathUtils.radToDeg(spherical.theta);
      const baseDistance = Math.max(1e-3, spherical.radius);

      const { exportWidth, exportHeight } = useSettingsStore.getState();
      const aspect = Math.max(1e-6, exportWidth / exportHeight);
      const isOrthographic = cameraValues?.type === "orthographic";

      const lens: WorkflowFitLens = isOrthographic
        ? {
            cameraType: "orthographic",
            frustum: {
              left: (ORTHOGRAPHIC_FRUSTUM_SIZE * aspect) / -2,
              right: (ORTHOGRAPHIC_FRUSTUM_SIZE * aspect) / 2,
              top: ORTHOGRAPHIC_FRUSTUM_SIZE / 2,
              bottom: ORTHOGRAPHIC_FRUSTUM_SIZE / -2,
            },
          }
        : {
            cameraType: "perspective",
            fov: cameraValues?.fov ?? DEFAULT_PERSPECTIVE_CAMERA.fov ?? 75,
          };

      const { solutions, warnings } = solveWorkflowFit({
        steps: [
          {
            rowLabel: FIT_ROW_LABEL,
            animationKey: FIT_ROW_LABEL,
            animationName: FIT_ROW_LABEL,
            directionLabel: FIT_ROW_LABEL,
            phi,
            theta,
          },
        ],
        boundsByAnimation: { [FIT_ROW_LABEL]: worldBox },
        lens,
        viewport: { width: exportWidth, height: exportHeight },
        baseDistance,
        baseZoom: cameraValues?.zoom ?? DEFAULT_ORTHOGRAPHIC_CAMERA.zoom ?? 1,
        baseTarget: target,
        reservedMargin: getSpritePostprocessPadding(
          useSpritePostprocessStore.getState().getSnapshot(),
        ),
        fit,
      });

      const solution = solutions[FIT_ROW_LABEL];
      if (!solution) return { fitted: false, warnings };

      const position = computePosition(
        phi,
        theta,
        solution.distance,
        solution.target,
      );

      useTransformsStore
        .getState()
        .setTransform(
          cameraUUID,
          getWorkflowCameraTransform({ position, target: solution.target }),
        );
      useTargetsStore.getState().setTarget(cameraUUID, [...solution.target]);
      useSettingsStore.getState().setCameraDistance(solution.distance);

      if (isOrthographic && solution.zoom !== undefined) {
        camerasState.setCamera(cameraUUID, { zoom: solution.zoom });
      }

      PubSub.emit(EventType.SET_CAMERA_ANGLE, {
        position,
        target: solution.target,
        immediate: true,
      });

      return {
        fitted: true,
        distance: solution.distance,
        zoom: solution.zoom,
        warnings,
      };
    },
    [],
  );

  return { fitCameraToAnimation };
};
