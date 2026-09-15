"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

export type StationStatus = "NORMAL" | "WARNING" | "CRITICAL" | "OFFLINE";

const STATUS_COLOR: Record<StationStatus, string> = {
    NORMAL: "#22c55e",
    WARNING: "#eab308",
    CRITICAL: "#dc2626",
    OFFLINE: "#6b7280",
};

interface StationMarkerProps {
    name: string;
    position: [number, number, number];
    status: StationStatus;
    onSelect?: () => void;
}

export function StationMarker({ name, position, status, onSelect }: StationMarkerProps) {
    const ringRef = useRef<THREE.Mesh>(null);
    const color = STATUS_COLOR[status];
    const pulsing = status === "CRITICAL";

    useFrame(({ clock }) => {
        if (!pulsing || !ringRef.current) return;
        const t = clock.getElapsedTime();
        const s = 1 + 0.25 * Math.sin(t * 4);
        ringRef.current.scale.set(s, s, s);
    });

    return (
        <group
            position={position}
            onClick={(e) => {
                e.stopPropagation();
                onSelect?.();
            }}
        >
            <mesh position={[0, 1.5, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 3, 8]} />
                <meshStandardMaterial emissive={color} color={color} emissiveIntensity={1.5} />
            </mesh>

            <mesh position={[0, 3, 0]}>
                <sphereGeometry args={[0.35, 16, 16]} />
                <meshStandardMaterial emissive={color} color={color} emissiveIntensity={2} />
            </mesh>

            <mesh ref={ringRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.6, 0.9, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>

            <Html position={[0, 3.8, 0]} center distanceFactor={30}>
                <div
                    style={{
                        color: "white",
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        textShadow: "0 0 4px black",
                        pointerEvents: "none",
                    }}
                >
                    {name}
                </div>
            </Html>
        </group>
    );
}