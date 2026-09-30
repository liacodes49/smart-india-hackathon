"use client";

import { Grid } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

interface OverviewEnvironmentProps {
    timeOfDay: number;
}

function getLightingState(
    time: number,
) {
    /*
     * Prototype Antarctic lighting cycle.
     *
     * 00:00 → 06:00  Night
     * 06:00 → 08:00  Dawn
     * 08:00 → 18:00  Day
     * 18:00 → 20:00  Dusk
     * 20:00 → 24:00  Night
     */

    const dawn = 6;
    const sunrise = 8;
    const sunset = 18;
    const dusk = 20;

    let daylight = 0;

    if (
        time >= sunrise &&
        time <= sunset
    ) {
        daylight = 1;
    } else if (
        time >= dawn &&
        time < sunrise
    ) {
        daylight =
            (time - dawn) /
            (sunrise - dawn);
    } else if (
        time > sunset &&
        time <= dusk
    ) {
        daylight =
            1 -
            (time - sunset) /
            (dusk - sunset);
    }

    const twilight =
        daylight > 0 &&
        daylight < 1;

    return {
        daylight:
            THREE.MathUtils.clamp(
                daylight,
                0,
                1,
            ),
        twilight,
    };
}

export default function OverviewEnvironment({
    timeOfDay,
}: OverviewEnvironmentProps) {
    const ambientRef =
        useRef<THREE.AmbientLight>(null);

    const sunRef =
        useRef<THREE.DirectionalLight>(
            null,
        );

    const fillRef =
        useRef<THREE.DirectionalLight>(
            null,
        );

    const horizonRef =
        useRef<THREE.PointLight>(null);

    const {
        daylight,
        twilight,
    } = getLightingState(
        timeOfDay,
    );

    /*
     * Smoothly transition the lighting
     * whenever the simulation clock changes.
     */
    useFrame(() => {
        const targetAmbient =
            THREE.MathUtils.lerp(
                0.18,
                0.65,
                daylight,
            );

        const targetSun =
            THREE.MathUtils.lerp(
                0.18,
                2.15,
                daylight,
            );

        const targetFill =
            THREE.MathUtils.lerp(
                0.45,
                0.65,
                daylight,
            );

        const targetHorizon =
            THREE.MathUtils.lerp(
                1.25,
                0.7,
                daylight,
            );

        if (ambientRef.current) {
            ambientRef.current.intensity =
                THREE.MathUtils.lerp(
                    ambientRef.current
                        .intensity,
                    targetAmbient,
                    0.08,
                );
        }

        if (sunRef.current) {
            sunRef.current.intensity =
                THREE.MathUtils.lerp(
                    sunRef.current
                        .intensity,
                    targetSun,
                    0.08,
                );
        }

        if (fillRef.current) {
            fillRef.current.intensity =
                THREE.MathUtils.lerp(
                    fillRef.current
                        .intensity,
                    targetFill,
                    0.08,
                );
        }

        if (horizonRef.current) {
            horizonRef.current.intensity =
                THREE.MathUtils.lerp(
                    horizonRef.current
                        .intensity,
                    targetHorizon,
                    0.08,
                );
        }
    });

    return (
        <>
            {/* Polar night / day background */}
            <color
                attach="background"
                args={["#020617"]}
            />

            <fog
                attach="fog"
                args={[
                    "#020617",
                    twilight
                        ? 36
                        : 42,
                    twilight
                        ? 78
                        : 90,
                ]}
            />

            {/* Base ambient illumination */}
            <ambientLight
                ref={ambientRef}
                intensity={0.65}
            />

            {/* Simulated sun */}
            <directionalLight
                ref={sunRef}
                position={[
                    12,
                    24,
                    10,
                ]}
                intensity={2.15}
                castShadow
                shadow-mapSize-width={
                    2048
                }
                shadow-mapSize-height={
                    2048
                }
                shadow-camera-near={1}
                shadow-camera-far={90}
                shadow-camera-left={-40}
                shadow-camera-right={40}
                shadow-camera-top={40}
                shadow-camera-bottom={-40}
            />

            {/* Cool polar fill light */}
            <directionalLight
                ref={fillRef}
                position={[
                    -20,
                    14,
                    -16,
                ]}
                intensity={0.65}
                color="#8fb7ca"
            />

            {/* Night / horizon illumination */}
            <pointLight
                ref={horizonRef}
                position={[
                    0,
                    10,
                    -22,
                ]}
                intensity={0.7}
                distance={60}
                color="#6ba5c0"
            />

            {/* Technical grid */}
            <Grid
                position={[
                    0,
                    -0.72,
                    0,
                ]}
                args={[
                    70,
                    70,
                ]}
                cellSize={1}
                cellThickness={0.25}
                cellColor="#26384a"
                sectionSize={5}
                sectionThickness={0.55}
                sectionColor="#3b5064"
                fadeDistance={42}
                fadeStrength={1.2}
                infiniteGrid
            />
        </>
    );
}