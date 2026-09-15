"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export interface CameraTarget {
    position: [number, number, number];
    lookAt: [number, number, number];
}

type ControlsLike = {
    target: THREE.Vector3;
    update: () => void;
    enabled: boolean;
} | null;

interface CameraControllerProps {
    target: CameraTarget;
    lerpSpeed?: number;
}

export function CameraController({
    target,
    lerpSpeed = 0.08,
}: CameraControllerProps) {
    const { camera, controls } = useThree() as unknown as {
        camera: THREE.Camera;
        controls: ControlsLike;
    };

    const desiredPosition = useRef(new THREE.Vector3());
    const desiredLookAt = useRef(new THREE.Vector3());

    const animating = useRef(false);

    useEffect(() => {
        desiredPosition.current.set(...target.position);
        desiredLookAt.current.set(...target.lookAt);

        animating.current = true;

        if (controls) {
            controls.enabled = false;

            // Immediately establish the correct center point.
            controls.target.copy(desiredLookAt.current);
        }
    }, [target, controls]);

    useFrame(() => {
        if (!animating.current) {
            return;
        }

        camera.position.lerp(
            desiredPosition.current,
            lerpSpeed
        );

        if (controls) {
            controls.target.lerp(
                desiredLookAt.current,
                lerpSpeed
            );
        } else {
            camera.lookAt(desiredLookAt.current);
        }

        const positionDistance =
            camera.position.distanceTo(
                desiredPosition.current
            );

        const targetDistance = controls
            ? controls.target.distanceTo(
                desiredLookAt.current
            )
            : 0;

        if (
            positionDistance < 0.05 &&
            targetDistance < 0.05
        ) {
            camera.position.copy(
                desiredPosition.current
            );

            if (controls) {
                controls.target.copy(
                    desiredLookAt.current
                );

                controls.enabled = true;
                controls.update();
            } else {
                camera.lookAt(
                    desiredLookAt.current
                );
            }

            animating.current = false;
        }
    });

    useEffect(() => {
        return () => {
            if (controls) {
                controls.enabled = true;
            }
        };
    }, [controls]);

    return null;
}
