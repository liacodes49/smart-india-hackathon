"use client";

import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

interface StationEnvironmentProps {
    stationId: string;
    selectedAssetId?: string | null;
    onSelectAsset?: (assetId: string) => void;
}

function InteractiveGroup({
    assetId,
    selected,
    onSelect,
    children,
}: {
    assetId: string;
    selected: boolean;
    onSelect?: (assetId: string) => void;
    children: React.ReactNode;
}) {
    const groupRef =
        useRef<THREE.Group>(null);

    useFrame(() => {
        if (!groupRef.current) {
            return;
        }

        const targetScale = selected
            ? 1.025
            : 1;

        groupRef.current.scale.lerp(
            new THREE.Vector3(
                targetScale,
                targetScale,
                targetScale,
            ),
            0.12,
        );
    });

    return (
        <group
            ref={groupRef}
            onClick={(event) => {
                event.stopPropagation();
                onSelect?.(assetId);
            }}
        >
            {children}

            {selected && (
                <mesh
                    position={[
                        0,
                        0.08,
                        0,
                    ]}
                    rotation={[
                        -Math.PI / 2,
                        0,
                        0,
                    ]}
                >
                    <ringGeometry
                        args={[
                            1.8,
                            2,
                            48,
                        ]}
                    />

                    <meshBasicMaterial
                        color="#38bdf8"
                        transparent
                        opacity={0.65}
                        side={
                            THREE.DoubleSide
                        }
                    />
                </mesh>
            )}
        </group>
    );
}

function Box({
    position,
    size,
    color,
    rotation = [0, 0, 0],
    metalness = 0.05,
    roughness = 0.82,
}: {
    position: [number, number, number];
    size: [number, number, number];
    color: string;
    rotation?: [number, number, number];
    metalness?: number;
    roughness?: number;
}) {
    return (
        <mesh
            position={position}
            rotation={rotation}
            castShadow
            receiveShadow
        >
            <boxGeometry args={size} />

            <meshStandardMaterial
                color={color}
                metalness={metalness}
                roughness={roughness}
            />
        </mesh>
    );
}

function Cylinder({
    position,
    radius,
    height,
    color,
    rotation = [0, 0, 0],
    metalness = 0.1,
    roughness = 0.72,
}: {
    position: [number, number, number];
    radius: number;
    height: number;
    color: string;
    rotation?: [number, number, number];
    metalness?: number;
    roughness?: number;
}) {
    return (
        <mesh
            position={position}
            rotation={rotation}
            castShadow
            receiveShadow
        >
            <cylinderGeometry
                args={[
                    radius,
                    radius,
                    height,
                    24,
                ]}
            />

            <meshStandardMaterial
                color={color}
                metalness={metalness}
                roughness={roughness}
            />
        </mesh>
    );
}

function Window({
    position,
    size,
}: {
    position: [number, number, number];
    size: [number, number, number];
}) {
    return (
        <Box
            position={position}
            size={size}
            color="#17384b"
            metalness={0.2}
            roughness={0.28}
        />
    );
}

function Pipe({
    start,
    end,
    radius = 0.055,
}: {
    start: THREE.Vector3;
    end: THREE.Vector3;
    radius?: number;
}) {
    const direction =
        new THREE.Vector3().subVectors(
            end,
            start,
        );

    const length =
        direction.length();

    const midpoint =
        new THREE.Vector3()
            .addVectors(
                start,
                end,
            )
            .multiplyScalar(0.5);

    const quaternion =
        new THREE.Quaternion();

    quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.normalize(),
    );

    return (
        <mesh
            position={midpoint}
            quaternion={quaternion}
            castShadow
        >
            <cylinderGeometry
                args={[
                    radius,
                    radius,
                    length,
                    12,
                ]}
            />

            <meshStandardMaterial
                color="#526873"
                metalness={0.65}
                roughness={0.4}
            />
        </mesh>
    );
}

/* -------------------------------------------------------------------------- */
/* Main building                                                               */
/* -------------------------------------------------------------------------- */

function MainBuilding({
    stationId,
}: {
    stationId: string;
}) {
    const isBharati =
        stationId
            .toLowerCase()
            .includes("bharati");

    const width = isBharati
        ? 8.8
        : 7.8;

    const depth = isBharati
        ? 4.6
        : 4.1;

    const height = isBharati
        ? 3.15
        : 2.8;

    return (
        <>
            {[
                [-3.2, -1.55],
                [3.2, -1.55],
                [-3.2, 1.55],
                [3.2, 1.55],
                [0, -1.55],
                [0, 1.55],
            ].map(
                ([x, z], index) => (
                    <Box
                        key={index}
                        position={[
                            x,
                            0.55,
                            z,
                        ]}
                        size={[
                            0.24,
                            1.1,
                            0.24,
                        ]}
                        color="#435660"
                        metalness={0.7}
                        roughness={0.38}
                    />
                ),
            )}

            <Box
                position={[
                    0,
                    1 +
                    height / 2,
                    0,
                ]}
                size={[
                    width,
                    height,
                    depth,
                ]}
                color="#aebdc2"
            />

            <Box
                position={[
                    0,
                    1.18,
                    depth / 2 +
                    0.01,
                ]}
                size={[
                    width - 0.25,
                    0.28,
                    0.08,
                ]}
                color="#536b76"
            />

            <Box
                position={[
                    0,
                    height + 1.12,
                    0,
                ]}
                size={[
                    width + 0.35,
                    0.24,
                    depth + 0.35,
                ]}
                color="#3f515b"
                metalness={0.45}
                roughness={0.48}
            />

            <Box
                position={[
                    -1.8,
                    height + 1.4,
                    0,
                ]}
                size={[
                    1.7,
                    0.48,
                    0.95,
                ]}
                color="#667982"
            />

            <Cylinder
                position={[
                    1.8,
                    height + 1.38,
                    0,
                ]}
                radius={0.3}
                height={0.48}
                color="#455862"
            />

            <Window
                position={[
                    -2.15,
                    1.85,
                    depth / 2 +
                    0.075,
                ]}
                size={[
                    2.2,
                    0.78,
                    0.12,
                ]}
            />

            <Window
                position={[
                    2.15,
                    1.85,
                    depth / 2 +
                    0.075,
                ]}
                size={[
                    2.2,
                    0.78,
                    0.12,
                ]}
            />

            <Box
                position={[
                    0,
                    1.08,
                    depth / 2 +
                    0.08,
                ]}
                size={[
                    1.05,
                    2.05,
                    0.14,
                ]}
                color="#263b45"
            />

            <Box
                position={[
                    0,
                    2.28,
                    depth / 2 +
                    0.5,
                ]}
                size={[
                    1.9,
                    0.16,
                    0.85,
                ]}
                color="#566b75"
            />

            <Box
                position={[
                    0,
                    0.18,
                    depth / 2 +
                    0.58,
                ]}
                size={[
                    1.55,
                    0.16,
                    0.7,
                ]}
                color="#73868e"
            />
        </>
    );
}

/* -------------------------------------------------------------------------- */
/* Fuel farm                                                                   */
/* -------------------------------------------------------------------------- */

function FuelFarm() {
    return (
        <group
            position={[
                -7,
                0,
                -4.3,
            ]}
        >
            <Box
                position={[
                    0,
                    0.1,
                    0,
                ]}
                size={[
                    5.2,
                    0.2,
                    3.8,
                ]}
                color="#657982"
            />

            <group
                rotation={[
                    0,
                    0,
                    Math.PI / 2,
                ]}
            >
                {[-1.35, 0, 1.35].map(
                    (x) => (
                        <Cylinder
                            key={x}
                            position={[
                                x,
                                1,
                                -0.75,
                            ]}
                            radius={0.72}
                            height={1.9}
                            color="#526771"
                            metalness={0.65}
                            roughness={0.38}
                        />
                    ),
                )}
            </group>

            {[-1.35, 0, 1.35].map(
                (x) => (
                    <Box
                        key={x}
                        position={[
                            x,
                            0.45,
                            -0.75,
                        ]}
                        size={[
                            0.18,
                            0.7,
                            1.35,
                        ]}
                        color="#3f525b"
                        metalness={0.65}
                    />
                ),
            )}

            <Box
                position={[
                    0,
                    0.85,
                    1,
                ]}
                size={[
                    2.7,
                    1.5,
                    1.2,
                ]}
                color="#73868e"
            />

            <Box
                position={[
                    0,
                    1.65,
                    1,
                ]}
                size={[
                    2.9,
                    0.18,
                    1.35,
                ]}
                color="#455b65"
            />
        </group>
    );
}

/* -------------------------------------------------------------------------- */
/* Generator                                                                    */
/* -------------------------------------------------------------------------- */

function GeneratorModule() {
    return (
        <group
            position={[
                6,
                0,
                -3.7,
            ]}
        >
            <Box
                position={[
                    0,
                    1.05,
                    0,
                ]}
                size={[
                    3.5,
                    2.1,
                    2.3,
                ]}
                color="#586a73"
                metalness={0.35}
            />

            <Box
                position={[
                    0,
                    2.22,
                    0,
                ]}
                size={[
                    3.8,
                    0.2,
                    2.55,
                ]}
                color="#3e515a"
            />

            {[-0.8, 0, 0.8].map(
                (x) => (
                    <Box
                        key={x}
                        position={[
                            x,
                            1.15,
                            1.17,
                        ]}
                        size={[
                            0.48,
                            1,
                            0.08,
                        ]}
                        color="#263a43"
                    />
                ),
            )}

            <Cylinder
                position={[
                    1,
                    3.25,
                    0,
                ]}
                radius={0.2}
                height={2}
                color="#344750"
                metalness={0.75}
            />
        </group>
    );
}

/* -------------------------------------------------------------------------- */
/* Pump house                                                                  */
/* -------------------------------------------------------------------------- */

function PumpHouse() {
    return (
        <group
            position={[
                6,
                0,
                2.5,
            ]}
        >
            <Box
                position={[
                    0,
                    1,
                    0,
                ]}
                size={[
                    3,
                    2,
                    2.5,
                ]}
                color="#a9b8bd"
            />

            <Box
                position={[
                    0,
                    2.1,
                    0,
                ]}
                size={[
                    3.25,
                    0.22,
                    2.7,
                ]}
                color="#4c6069"
            />

            <Window
                position={[
                    0,
                    1.25,
                    1.28,
                ]}
                size={[
                    1.4,
                    0.9,
                    0.1,
                ]}
            />

            <Pipe
                start={
                    new THREE.Vector3(
                        -1,
                        1,
                        -1.5,
                    )
                }
                end={
                    new THREE.Vector3(
                        -1,
                        1,
                        -4,
                    )
                }
                radius={0.09}
            />
        </group>
    );
}

/* -------------------------------------------------------------------------- */
/* Containers                                                                  */
/* -------------------------------------------------------------------------- */

function ContainerModules() {
    return (
        <group>
            <Box
                position={[
                    -8,
                    0.85,
                    2,
                ]}
                size={[
                    3,
                    1.7,
                    1.8,
                ]}
                color="#71858f"
            />

            <Box
                position={[
                    -8,
                    0.85,
                    4.25,
                ]}
                size={[
                    3,
                    1.7,
                    1.8,
                ]}
                color="#647a85"
            />

            <Box
                position={[
                    7.6,
                    0.85,
                    5,
                ]}
                size={[
                    3,
                    1.7,
                    1.8,
                ]}
                color="#788c95"
            />
        </group>
    );
}

/* -------------------------------------------------------------------------- */
/* Antenna                                                                     */
/* -------------------------------------------------------------------------- */

function AntennaArray() {
    return (
        <group
            position={[
                10,
                0,
                -6,
            ]}
        >
            <Cylinder
                position={[
                    0,
                    3.2,
                    0,
                ]}
                radius={0.12}
                height={6.4}
                color="#526670"
                metalness={0.75}
            />

            <Pipe
                start={
                    new THREE.Vector3(
                        0,
                        0.1,
                        0,
                    )
                }
                end={
                    new THREE.Vector3(
                        -1.25,
                        2.8,
                        0,
                    )
                }
                radius={0.045}
            />

            <Pipe
                start={
                    new THREE.Vector3(
                        0,
                        0.1,
                        0,
                    )
                }
                end={
                    new THREE.Vector3(
                        1.25,
                        2.8,
                        0,
                    )
                }
                radius={0.045}
            />

            <Box
                position={[
                    0,
                    2.8,
                    0,
                ]}
                size={[
                    2.7,
                    0.08,
                    0.08,
                ]}
                color="#657982"
            />

            <mesh
                position={[
                    0,
                    4.6,
                    0,
                ]}
                rotation={[
                    -0.5,
                    0,
                    0,
                ]}
                castShadow
            >
                <sphereGeometry
                    args={[
                        0.95,
                        24,
                        12,
                        0,
                        Math.PI * 2,
                        0,
                        Math.PI / 2,
                    ]}
                />

                <meshStandardMaterial
                    color="#d3dde0"
                    metalness={0.4}
                    roughness={0.4}
                    side={
                        THREE.DoubleSide
                    }
                />
            </mesh>
        </group>
    );
}

/* -------------------------------------------------------------------------- */
/* Ground                                                                      */
/* -------------------------------------------------------------------------- */

function StationGround() {
    return (
        <>
            <mesh
                position={[
                    0,
                    -0.08,
                    0,
                ]}
                rotation={[
                    -Math.PI / 2,
                    0,
                    0,
                ]}
                receiveShadow
            >
                <circleGeometry
                    args={[
                        14,
                        64,
                    ]}
                />

                <meshStandardMaterial
                    color="#cbd8dd"
                    roughness={0.98}
                />
            </mesh>

            <mesh
                position={[
                    0,
                    -0.065,
                    0,
                ]}
                rotation={[
                    -Math.PI / 2,
                    0,
                    0,
                ]}
                receiveShadow
            >
                <circleGeometry
                    args={[
                        9.5,
                        64,
                    ]}
                />

                <meshStandardMaterial
                    color="#aebfc6"
                    roughness={1}
                />
            </mesh>
        </>
    );
}

/* -------------------------------------------------------------------------- */
/* Environment                                                                  */
/* -------------------------------------------------------------------------- */

export default function StationEnvironment({
    stationId,
    selectedAssetId,
    onSelectAsset,
}: StationEnvironmentProps) {
    return (
        <group>
            <StationGround />

            <InteractiveGroup
                assetId="main-building"
                selected={
                    selectedAssetId ===
                    "main-building"
                }
                onSelect={
                    onSelectAsset
                }
            >
                <MainBuilding
                    stationId={
                        stationId
                    }
                />
            </InteractiveGroup>

            <InteractiveGroup
                assetId="fuel-farm"
                selected={
                    selectedAssetId ===
                    "fuel-farm"
                }
                onSelect={
                    onSelectAsset
                }
            >
                <FuelFarm />
            </InteractiveGroup>

            <InteractiveGroup
                assetId="generator"
                selected={
                    selectedAssetId ===
                    "generator"
                }
                onSelect={
                    onSelectAsset
                }
            >
                <GeneratorModule />
            </InteractiveGroup>

            <InteractiveGroup
                assetId="pump-house"
                selected={
                    selectedAssetId ===
                    "pump-house"
                }
                onSelect={
                    onSelectAsset
                }
            >
                <PumpHouse />
            </InteractiveGroup>

            <InteractiveGroup
                assetId="container-01"
                selected={
                    selectedAssetId ===
                    "container-01"
                }
                onSelect={
                    onSelectAsset
                }
            >
                <ContainerModules />
            </InteractiveGroup>

            <InteractiveGroup
                assetId="antenna"
                selected={
                    selectedAssetId ===
                    "antenna"
                }
                onSelect={
                    onSelectAsset
                }
            >
                <AntennaArray />
            </InteractiveGroup>
        </group>
    );
}