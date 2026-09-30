"use client";

import {
    useEffect,
    useRef,
} from "react";

import {
    useFrame,
    useThree,
} from "@react-three/fiber";

import * as THREE from "three";

export interface CameraTarget {
    position: [
        number,
        number,
        number,
    ];
    lookAt: [
        number,
        number,
        number,
    ];
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
    const {
        camera,
        controls,
    } =
        useThree() as unknown as {
            camera: THREE.Camera;
            controls: ControlsLike;
        };

    const controlsRef = useRef<ControlsLike>(null);

    useEffect(() => {
        controlsRef.current = controls;
    }, [controls]);

    const desiredPosition =
        useRef(
            new THREE.Vector3(),
        );

    const desiredLookAt =
        useRef(
            new THREE.Vector3(),
        );

    const animating =
        useRef(false);

    useEffect(() => {
        desiredPosition.current.set(
            ...target.position,
        );

        desiredLookAt.current.set(
            ...target.lookAt,
        );

        animating.current = true;

        const currentControls =
            controlsRef.current;

        if (currentControls) {
            currentControls.enabled = false;

            currentControls.target.copy(
                desiredLookAt.current,
            );
        }
    }, [target]);

    useFrame(() => {
        if (
            !animating.current
        ) {
            return;
        }

        camera.position.lerp(
            desiredPosition.current,
            lerpSpeed,
        );

        const currentControls =
            controlsRef.current;

        if (currentControls) {
            currentControls.target.lerp(
                desiredLookAt.current,
                lerpSpeed,
            );
        } else {
            camera.lookAt(
                desiredLookAt.current,
            );
        }

        const positionDistance =
            camera.position.distanceTo(
                desiredPosition.current,
            );

        const targetDistance =
            currentControls
                ? currentControls.target.distanceTo(
                    desiredLookAt.current,
                )
                : 0;

        if (
            positionDistance <
            0.05 &&
            targetDistance <
            0.05
        ) {
            camera.position.copy(
                desiredPosition.current,
            );

            if (currentControls) {
                currentControls.target.copy(
                    desiredLookAt.current,
                );

                currentControls.enabled = true;

                currentControls.update();
            } else {
                camera.lookAt(
                    desiredLookAt.current,
                );
            }

            animating.current =
                false;
        }
    });

    useEffect(() => {
        return () => {
            const currentControls =
                controlsRef.current;

            if (currentControls) {
                currentControls.enabled = true;
            }
        };
    }, []);

    return null;
}