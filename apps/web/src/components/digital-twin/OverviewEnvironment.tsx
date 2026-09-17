"use client";

import { Grid } from "@react-three/drei";

export default function OverviewEnvironment() {
    return (
        <>
            {/* Deep polar-night style background */}
            <color
                attach="background"
                args={["#020617"]}
            />

            <fog
                attach="fog"
                args={[
                    "#020617",
                    42,
                    90,
                ]}
            />

            {/* Base ambient illumination */}
            <ambientLight
                intensity={0.65}
            />

            {/* Main directional light */}
            <directionalLight
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

            {/* Cool fill light */}
            <directionalLight
                position={[
                    -20,
                    14,
                    -16,
                ]}
                intensity={0.65}
                color="#8fb7ca"
            />

            {/* Subtle horizon illumination */}
            <pointLight
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