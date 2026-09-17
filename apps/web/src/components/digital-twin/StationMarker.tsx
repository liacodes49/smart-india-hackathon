"use client";

import { useRef } from "react";

import { useFrame } from "@react-three/fiber";

import { Html } from "@react-three/drei";

import * as THREE from "three";

export type StationStatus =
    | "NORMAL"
    | "WARNING"
    | "CRITICAL"
    | "OFFLINE";

const STATUS_COLOR: Record<
    StationStatus,
    string
> = {
    NORMAL: "#22c55e",
    WARNING: "#eab308",
    CRITICAL: "#dc2626",
    OFFLINE: "#6b7280",
};

interface StationMarkerProps {
    name: string;
    position: [
        number,
        number,
        number,
    ];
    status: StationStatus;
    onSelect?: () => void;
}

export function StationMarker({
    name,
    position,
    status,
    onSelect,
}: StationMarkerProps) {
    const ringRef =
        useRef<THREE.Mesh>(null);

    const beaconRef =
        useRef<THREE.MeshStandardMaterial>(null);

    const color =
        STATUS_COLOR[status];

    const critical =
        status === "CRITICAL";

    const warning =
        status === "WARNING";

    const offline =
        status === "OFFLINE";

    useFrame(({ clock }) => {
        const time =
            clock.getElapsedTime();

        /*
         * Station state ring
         */
        if (ringRef.current) {
            if (critical) {
                const pulse =
                    1 +
                    0.25 *
                    Math.sin(
                        time * 4,
                    );

                ringRef.current.scale.set(
                    pulse,
                    pulse,
                    pulse,
                );
            } else {
                const target =
                    warning
                        ? 1.08
                        : 1;

                const current =
                    ringRef.current
                        .scale.x;

                const next =
                    current +
                    (target -
                        current) *
                    0.12;

                ringRef.current.scale.set(
                    next,
                    next,
                    next,
                );
            }
        }

        /*
         * Vertical beacon pulse
         *
         * beaconRef points directly to
         * MeshStandardMaterial, so we
         * update emissiveIntensity directly.
         */
        if (
            beaconRef.current &&
            (critical || warning)
        ) {
            const pulse =
                0.7 +
                0.3 *
                Math.sin(
                    time * 4,
                );

            beaconRef.current.emissiveIntensity =
                critical
                    ? 2.5 * pulse
                    : 1.4 * pulse;
        }
    });

    return (
        <group
            position={position}
            onClick={(event) => {
                event.stopPropagation();
                onSelect?.();
            }}
        >
            {/* Vertical beacon */}
            <mesh
                position={[
                    0,
                    1.5,
                    0,
                ]}
            >
                <cylinderGeometry
                    args={[
                        0.05,
                        0.05,
                        3,
                        8,
                    ]}
                />

                <meshStandardMaterial
                    ref={beaconRef}
                    emissive={color}
                    color={
                        offline
                            ? "#4b5563"
                            : color
                    }
                    emissiveIntensity={
                        critical
                            ? 2.5
                            : warning
                                ? 1.5
                                : 1.5
                    }
                />
            </mesh>

            {/* Beacon head */}
            <mesh
                position={[
                    0,
                    3,
                    0,
                ]}
            >
                <sphereGeometry
                    args={[
                        0.35,
                        16,
                        16,
                    ]}
                />

                <meshStandardMaterial
                    emissive={color}
                    color={
                        offline
                            ? "#4b5563"
                            : color
                    }
                    emissiveIntensity={
                        critical
                            ? 3
                            : warning
                                ? 2
                                : 1.8
                    }
                />
            </mesh>

            {/* State ring */}
            <mesh
                ref={ringRef}
                position={[
                    0,
                    0.02,
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
                        critical
                            ? 0.65
                            : 0.6,
                        critical
                            ? 0.95
                            : 0.9,
                        32,
                    ]}
                />

                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={
                        offline
                            ? 0.22
                            : critical
                                ? 0.9
                                : warning
                                    ? 0.72
                                    : 0.6
                    }
                    side={
                        THREE.DoubleSide
                    }
                />
            </mesh>

            {/* Warning / critical outer aura */}
            {(warning ||
                critical) && (
                    <mesh
                        position={[
                            0,
                            0.03,
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
                                1.05,
                                critical
                                    ? 1.25
                                    : 1.12,
                                32,
                            ]}
                        />

                        <meshBasicMaterial
                            color={color}
                            transparent
                            opacity={
                                critical
                                    ? 0.32
                                    : 0.2
                            }
                            side={
                                THREE.DoubleSide
                            }
                        />
                    </mesh>
                )}

            {/* Offline muted sphere */}
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
                            2.1,
                            16,
                            12,
                        ]}
                    />

                    <meshBasicMaterial
                        color="#6b7280"
                        transparent
                        opacity={0.08}
                        wireframe
                    />
                </mesh>
            )}

            {/* Station label */}
            <Html
                position={[
                    0,
                    3.8,
                    0,
                ]}
                center
                distanceFactor={30}
            >
                <div
                    style={{
                        color: "white",
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace:
                            "nowrap",
                        textShadow:
                            "0 0 4px black",
                        pointerEvents:
                            "none",
                    }}
                >
                    {name}
                </div>
            </Html>
        </group>
    );
}