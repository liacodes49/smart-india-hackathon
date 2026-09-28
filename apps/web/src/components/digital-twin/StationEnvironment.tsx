"use client";

import * as THREE from "three";

import {
    useMemo,
    useRef,
    type ReactNode,
} from "react";

import {
    useFrame,
} from "@react-three/fiber";

import {
    Detailed,
} from "@react-three/drei";

import type {
    TelemetryAsset,
    AssetHealth,
} from "@/features/digital-twin/utils/StationTelemetry";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type StationViewMode =
    | "NORMAL"
    | "ENERGY"
    | "RISK"
    | "LOGISTICS";

interface StationEnvironmentProps {
    stationId: string;
    selectedAssetId?: string | null;
    telemetry?: TelemetryAsset[];
    viewMode?: StationViewMode;
    onSelectAsset?: (
        assetId: string,
    ) => void;
}

type AssetCategory =
    | "HABITAT"
    | "ENERGY"
    | "LOGISTICS"
    | "WATER"
    | "COMMUNICATION";

/*
 * Future GLB configuration.
 *
 * Nothing needs to be supplied today.
 * When real station models arrive, these paths can be populated without
 * changing the rest of the station architecture.
 */
export interface StationModelConfig {
    highDetail?: string | null;
    mediumDetail?: string | null;
    lowDetail?: string | null;
}

/*
 * The procedural model remains the default fallback.
 *
 * Future example:
 *
 * {
 *   highDetail: "/models/bharati-high.glb",
 *   mediumDetail: "/models/bharati-medium.glb",
 *   lowDetail: "/models/bharati-low.glb",
 * }
 */
export const STATION_MODEL_CONFIG: Record<
    string,
    StationModelConfig
> = {
    maitri: {
        highDetail: null,
        mediumDetail: null,
        lowDetail: null,
    },
    bharati: {
        highDetail: null,
        mediumDetail: null,
        lowDetail: null,
    },
};

/* -------------------------------------------------------------------------- */
/* Colors                                                                     */
/* -------------------------------------------------------------------------- */

const HEALTH_COLORS: Record<
    AssetHealth,
    string
> = {
    NORMAL: "#22c55e",
    WARNING: "#eab308",
    CRITICAL: "#dc2626",
    OFFLINE: "#6b7280",
};

/* -------------------------------------------------------------------------- */
/* Asset classification                                                       */
/* -------------------------------------------------------------------------- */

function getAssetCategory(
    assetId: string,
): AssetCategory {
    switch (assetId) {
        case "generator":
            return "ENERGY";

        case "fuel-farm":
            return "LOGISTICS";

        case "pump-house":
            return "WATER";

        case "antenna":
            return "COMMUNICATION";

        case "container-01":
            return "LOGISTICS";

        case "main-building":
        default:
            return "HABITAT";
    }
}

function isModeHighlighted(
    assetId: string,
    mode: StationViewMode,
): boolean {
    if (mode === "NORMAL") {
        return true;
    }

    const category =
        getAssetCategory(
            assetId,
        );

    if (mode === "ENERGY") {
        return (
            category ===
            "ENERGY"
        );
    }

    if (mode === "LOGISTICS") {
        return (
            category ===
            "LOGISTICS"
        );
    }

    if (mode === "RISK") {
        return true;
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* State effect                                                               */
/* -------------------------------------------------------------------------- */

function StateEffect({
    health,
    highlighted,
    selected,
}: {
    health: AssetHealth;
    highlighted: boolean;
    selected: boolean;
}) {
    const ringRef =
        useRef<THREE.Mesh>(null);

    const markerRef =
        useRef<THREE.Group>(null);

    const color =
        HEALTH_COLORS[
        health
        ];

    const critical =
        health ===
        "CRITICAL";

    const warning =
        health ===
        "WARNING";

    const offline =
        health ===
        "OFFLINE";

    useFrame(
        ({
            clock,
        }) => {
            const ring =
                ringRef.current;

            const marker =
                markerRef.current;

            if (ring) {
                if (
                    critical
                ) {
                    const t =
                        clock.getElapsedTime();

                    const scale =
                        1 +
                        0.18 *
                        Math.sin(
                            t * 5,
                        );

                    ring.scale.set(
                        scale,
                        scale,
                        scale,
                    );
                } else {
                    const target =
                        selected
                            ? 1.08
                            : 1;

                    ring.scale.lerp(
                        new THREE.Vector3(
                            target,
                            target,
                            target,
                        ),
                        0.12,
                    );
                }
            }

            if (marker) {
                if (
                    critical ||
                    warning
                ) {
                    marker.position.y =
                        2.8 +
                        Math.sin(
                            clock.getElapsedTime() *
                            2.5,
                        ) *
                        0.15;
                }
            }
        },
    );

    const visible =
        highlighted ||
        selected ||
        health !==
        "NORMAL";

    if (!visible) {
        return null;
    }

    return (
        <>
            <mesh
                ref={
                    ringRef
                }
                position={[
                    0,
                    0.06,
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
                        selected
                            ? 2.1
                            : 1.55,
                        selected
                            ? 2.35
                            : 1.72,
                        48,
                    ]}
                />

                <meshBasicMaterial
                    color={
                        selected
                            ? "#38bdf8"
                            : color
                    }
                    transparent
                    opacity={
                        offline
                            ? 0.25
                            : highlighted
                                ? 0.6
                                : 0.18
                    }
                    side={
                        THREE.DoubleSide
                    }
                />
            </mesh>

            {(warning ||
                critical) && (
                    <group
                        ref={
                            markerRef
                        }
                        position={[
                            0,
                            2.8,
                            0,
                        ]}
                    >
                        <mesh>
                            <sphereGeometry
                                args={[
                                    critical
                                        ? 0.24
                                        : 0.18,
                                    16,
                                    16,
                                ]}
                            />

                            <meshBasicMaterial
                                color={
                                    color
                                }
                                transparent
                                opacity={
                                    highlighted
                                        ? 1
                                        : 0.35
                                }
                            />
                        </mesh>

                        <pointLight
                            color={
                                color
                            }
                            intensity={
                                critical
                                    ? 1.8
                                    : 0.8
                            }
                            distance={
                                5
                            }
                        />
                    </group>
                )}

            {offline && (
                <mesh
                    position={[
                        0,
                        1.5,
                        0,
                    ]}
                >
                    <sphereGeometry
                        args={[
                            2.2,
                            16,
                            12,
                        ]}
                    />

                    <meshBasicMaterial
                        color="#6b7280"
                        transparent
                        opacity={
                            highlighted
                                ? 0.07
                                : 0.12
                        }
                        wireframe
                    />
                </mesh>
            )}
        </>
    );
}

/* -------------------------------------------------------------------------- */
/* Interactive group                                                          */
/* -------------------------------------------------------------------------- */

function InteractiveGroup({
    assetId,
    selected,
    health,
    highlighted,
    onSelect,
    children,
}: {
    assetId: string;
    selected: boolean;
    health: AssetHealth;
    highlighted: boolean;
    onSelect?: (
        assetId: string,
    ) => void;
    children: ReactNode;
}) {
    const groupRef =
        useRef<THREE.Group>(null);

    const targetScale =
        selected
            ? 1.025
            : 1;

    useFrame(() => {
        if (
            !groupRef.current
        ) {
            return;
        }

        const current =
            groupRef.current
                .scale.x;

        const next =
            THREE.MathUtils.lerp(
                current,
                targetScale,
                0.12,
            );

        groupRef.current.scale.set(
            next,
            next,
            next,
        );
    });

    return (
        <group
            ref={
                groupRef
            }
            onClick={(
                event,
            ) => {
                event.stopPropagation();

                onSelect?.(
                    assetId,
                );
            }}
        >
            <group
                scale={
                    highlighted ||
                        selected ||
                        health !==
                        "NORMAL"
                        ? 1
                        : 0.92
                }
            >
                {children}
            </group>

            <StateEffect
                health={
                    health
                }
                highlighted={
                    highlighted
                }
                selected={
                    selected
                }
            />
        </group>
    );
}

/* -------------------------------------------------------------------------- */
/* Basic geometry                                                             */
/* -------------------------------------------------------------------------- */

function Box({
    position,
    size,
    color,
    rotation = [
        0,
        0,
        0,
    ],
    metalness = 0.05,
    roughness = 0.82,
}: {
    position: [
        number,
        number,
        number,
    ];
    size: [
        number,
        number,
        number,
    ];
    color: string;
    rotation?: [
        number,
        number,
        number,
    ];
    metalness?: number;
    roughness?: number;
}) {
    return (
        <mesh
            position={
                position
            }
            rotation={
                rotation
            }
            castShadow
            receiveShadow
        >
            <boxGeometry
                args={size}
            />

            <meshStandardMaterial
                color={
                    color
                }
                metalness={
                    metalness
                }
                roughness={
                    roughness
                }
            />
        </mesh>
    );
}

function Cylinder({
    position,
    radius,
    height,
    color,
    rotation = [
        0,
        0,
        0,
    ],
    metalness = 0.1,
    roughness = 0.72,
}: {
    position: [
        number,
        number,
        number,
    ];
    radius: number;
    height: number;
    color: string;
    rotation?: [
        number,
        number,
        number,
    ];
    metalness?: number;
    roughness?: number;
}) {
    return (
        <mesh
            position={
                position
            }
            rotation={
                rotation
            }
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
                color={
                    color
                }
                metalness={
                    metalness
                }
                roughness={
                    roughness
                }
            />
        </mesh>
    );
}

function Window({
    position,
    size,
}: {
    position: [
        number,
        number,
        number,
    ];
    size: [
        number,
        number,
        number,
    ];
}) {
    return (
        <Box
            position={
                position
            }
            size={
                size
            }
            color="#17384b"
            metalness={
                0.2
            }
            roughness={
                0.28
            }
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
            .multiplyScalar(
                0.5,
            );

    const quaternion =
        new THREE.Quaternion();

    quaternion.setFromUnitVectors(
        new THREE.Vector3(
            0,
            1,
            0,
        ),
        direction.normalize(),
    );

    return (
        <mesh
            position={
                midpoint
            }
            quaternion={
                quaternion
            }
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
                metalness={
                    0.65
                }
                roughness={
                    0.4
                }
            />
        </mesh>
    );
}

/* -------------------------------------------------------------------------- */
/* Main building                                                              */
/* -------------------------------------------------------------------------- */

function MainBuilding({
    stationId,
}: {
    stationId: string;
}) {
    const isBharati =
        stationId
            .toLowerCase()
            .includes(
                "bharati",
            );

    const width =
        isBharati
            ? 8.8
            : 7.8;

    const depth =
        isBharati
            ? 4.6
            : 4.1;

    const height =
        isBharati
            ? 3.15
            : 2.8;

    return (
        <>
            {[
                [
                    -3.2,
                    -1.55,
                ],
                [
                    3.2,
                    -1.55,
                ],
                [
                    -3.2,
                    1.55,
                ],
                [
                    3.2,
                    1.55,
                ],
                [
                    0,
                    -1.55,
                ],
                [
                    0,
                    1.55,
                ],
            ].map(
                ([
                    x,
                    z,
                ], index) => (
                    <Box
                        key={
                            index
                        }
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
                        metalness={
                            0.7
                        }
                        roughness={
                            0.38
                        }
                    />
                ),
            )}

            <Box
                position={[
                    0,
                    1 +
                    height /
                    2,
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
                    depth /
                    2 +
                    0.01,
                ]}
                size={[
                    width -
                    0.25,
                    0.28,
                    0.08,
                ]}
                color="#536b76"
            />

            <Box
                position={[
                    0,
                    height +
                    1.12,
                    0,
                ]}
                size={[
                    width +
                    0.35,
                    0.24,
                    depth +
                    0.35,
                ]}
                color="#3f515b"
                metalness={
                    0.45
                }
                roughness={
                    0.48
                }
            />

            <Box
                position={[
                    -1.8,
                    height +
                    1.4,
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
                    height +
                    1.38,
                    0,
                ]}
                radius={
                    0.3
                }
                height={
                    0.48
                }
                color="#455862"
            />

            <Window
                position={[
                    -2.15,
                    1.85,
                    depth /
                    2 +
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
                    depth /
                    2 +
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
                    depth /
                    2 +
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
                    depth /
                    2 +
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
                    depth /
                    2 +
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
/* Fuel farm                                                                  */
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
                    Math.PI /
                    2,
                ]}
            >
                {[
                    -1.35,
                    0,
                    1.35,
                ].map(
                    (x) => (
                        <Cylinder
                            key={
                                x
                            }
                            position={[
                                x,
                                1,
                                -0.75,
                            ]}
                            radius={
                                0.72
                            }
                            height={
                                1.9
                            }
                            color="#526771"
                            metalness={
                                0.65
                            }
                            roughness={
                                0.38
                            }
                        />
                    ),
                )}
            </group>

            {[
                -1.35,
                0,
                1.35,
            ].map(
                (x) => (
                    <Box
                        key={
                            x
                        }
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
                        metalness={
                            0.65
                        }
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
/* Generator                                                                  */
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
                metalness={
                    0.35
                }
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

            {[
                -0.8,
                0,
                0.8,
            ].map(
                (x) => (
                    <Box
                        key={
                            x
                        }
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
                radius={
                    0.2
                }
                height={
                    2
                }
                color="#344750"
                metalness={
                    0.75
                }
            />
        </group>
    );
}

/* -------------------------------------------------------------------------- */
/* Pump house                                                                 */
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
                radius={
                    0.09
                }
            />
        </group>
    );
}

/* -------------------------------------------------------------------------- */
/* Containers                                                                 */
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
/* Antenna                                                                    */
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
                radius={
                    0.12
                }
                height={
                    6.4
                }
                color="#526670"
                metalness={
                    0.75
                }
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
                radius={
                    0.045
                }
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
                radius={
                    0.045
                }
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
                        Math.PI *
                        2,
                        0,
                        Math.PI /
                        2,
                    ]}
                />

                <meshStandardMaterial
                    color="#d3dde0"
                    metalness={
                        0.4
                    }
                    roughness={
                        0.4
                    }
                    side={
                        THREE.DoubleSide
                    }
                />
            </mesh>
        </group>
    );
}

/* -------------------------------------------------------------------------- */
/* Ground                                                                     */
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
                    -Math.PI /
                    2,
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
                    roughness={
                        0.98
                    }
                />
            </mesh>

            <mesh
                position={[
                    0,
                    -0.065,
                    0,
                ]}
                rotation={[
                    -Math.PI /
                    2,
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
                    roughness={
                        1
                    }
                />
            </mesh>
        </>
    );
}

/* -------------------------------------------------------------------------- */
/* Low-detail station                                                         */
/* -------------------------------------------------------------------------- */

function LowDetailStation() {
    return (
        <group>
            <Box
                position={[
                    0,
                    1.4,
                    0,
                ]}
                size={[
                    8,
                    2.8,
                    4.5,
                ]}
                color="#8fa1a7"
            />

            <Box
                position={[
                    -7,
                    0.8,
                    -4,
                ]}
                size={[
                    4,
                    1.6,
                    3,
                ]}
                color="#61747d"
            />

            <Box
                position={[
                    6,
                    1,
                    -3.5,
                ]}
                size={[
                    3.5,
                    2,
                    2.2,
                ]}
                color="#52646c"
            />

            <Box
                position={[
                    6,
                    1,
                    2.5,
                ]}
                size={[
                    3,
                    2,
                    2.5,
                ]}
                color="#91a2a8"
            />
        </group>
    );
}

/* -------------------------------------------------------------------------- */
/* Procedural station                                                         */
/* -------------------------------------------------------------------------- */

function ProceduralStation({
    stationId,
    selectedAssetId,
    getHealth,
    highlighted,
    onSelectAsset,
}: {
    stationId: string;
    selectedAssetId: string | null;
    getHealth: (
        assetId: string,
    ) => AssetHealth;
    highlighted: (
        assetId: string,
    ) => boolean;
    onSelectAsset?: (
        assetId: string,
    ) => void;
}) {
    return (
        <group>
            <InteractiveGroup
                assetId="main-building"
                selected={
                    selectedAssetId ===
                    "main-building"
                }
                health={
                    getHealth(
                        "main-building",
                    )
                }
                highlighted={highlighted(
                    "main-building",
                )}
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
                health={
                    getHealth(
                        "fuel-farm",
                    )
                }
                highlighted={highlighted(
                    "fuel-farm",
                )}
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
                health={
                    getHealth(
                        "generator",
                    )
                }
                highlighted={highlighted(
                    "generator",
                )}
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
                health={
                    getHealth(
                        "pump-house",
                    )
                }
                highlighted={highlighted(
                    "pump-house",
                )}
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
                health={
                    getHealth(
                        "container-01",
                    )
                }
                highlighted={highlighted(
                    "container-01",
                )}
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
                health={
                    getHealth(
                        "antenna",
                    )
                }
                highlighted={highlighted(
                    "antenna",
                )}
                onSelect={
                    onSelectAsset
                }
            >
                <AntennaArray />
            </InteractiveGroup>
        </group>
    );
}

/* -------------------------------------------------------------------------- */
/* Environment                                                                */
/* -------------------------------------------------------------------------- */

export default function StationEnvironment({
    stationId,
    selectedAssetId = null,
    telemetry = [],
    viewMode = "NORMAL",
    onSelectAsset,
}: StationEnvironmentProps) {
    const telemetryMap =
        useMemo(() => {
            return new Map(
                telemetry.map(
                    (
                        asset,
                    ) => [
                            asset.id,
                            asset,
                        ],
                ),
            );
        }, [
            telemetry,
        ]);

    function getHealth(
        assetId: string,
    ): AssetHealth {
        return (
            telemetryMap.get(
                assetId,
            )?.health ??
            "NORMAL"
        );
    }

    function highlighted(
        assetId: string,
    ) {
        return isModeHighlighted(
            assetId,
            viewMode,
        );
    }

    const modelKey =
        stationId
            .toLowerCase()
            .includes(
                "bharati",
            )
            ? "bharati"
            : "maitri";

    const modelConfig =
        STATION_MODEL_CONFIG[
        modelKey
        ];

    /*
     * GLB-ready LOD architecture.
     *
     * Currently all model paths are null, so the procedural station remains
     * the active representation. Real GLBs can be connected here later.
     *
     * The actual high-detail fallback remains the existing procedural model.
     */
    const hasRealHighDetailModel =
        Boolean(
            modelConfig?.highDetail,
        );

    return (
        <group>
            <StationGround />

            <Detailed
                distances={[
                    0,
                    28,
                ]}
            >
                {/*
                 * High-detail level.
                 *
                 * Real GLB integration point:
                 *
                 * <GLTFStation ... />
                 *
                 * when modelConfig.highDetail exists.
                 *
                 * Procedural model remains the fallback for now.
                 */}
                <group>
                    <ProceduralStation
                        stationId={
                            stationId
                        }
                        selectedAssetId={
                            selectedAssetId
                        }
                        getHealth={
                            getHealth
                        }
                        highlighted={
                            highlighted
                        }
                        onSelectAsset={
                            onSelectAsset
                        }
                    />

                    {hasRealHighDetailModel &&
                        /*
                         * Deliberately empty until actual GLB assets are
                         * added. The procedural model remains visible.
                         */
                        null}
                </group>

                {/* Low-detail fallback */}
                <LowDetailStation />
            </Detailed>
        </group>
    );
}