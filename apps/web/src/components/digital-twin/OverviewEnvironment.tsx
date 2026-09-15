"use client";

import { Grid } from "@react-three/drei";

export default function OverviewEnvironment() {
    return (
        <>
            <color
                attach="background"
                args={["#020617"]}
            />

            <fog
                attach="fog"
                args={[
                    "#020617",
                    42,
                    82,
                ]}
            />

            <ambientLight
                intensity={1.25}
            />

            <directionalLight
                position={[12, 24, 10]}
                intensity={3.2}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-near={1}
                shadow-camera-far={90}
                shadow-camera-left={-40}
                shadow-camera-right={40}
                shadow-camera-top={40}
                shadow-camera-bottom={-40}
            />

            <directionalLight
                position={[-20, 15, -18]}
                intensity={1.2}
            />

            <hemisphereLight
                skyColor="#dbeafe"
                groundColor="#0f172a"
                intensity={0.7}
            />

            <pointLight
                position={[0, 10, -18]}
                intensity={1.4}
                distance={60}
            />

            <Grid
                position={[0, -0.72, 0]}
                args={[70, 70]}
                cellSize={1}
                cellThickness={0.3}
                cellColor="#334155"
                sectionSize={5}
                sectionThickness={0.65}
                sectionColor="#475569"
                fadeDistance={45}
                fadeStrength={1.4}
                infiniteGrid
            />
        </>
    );
}