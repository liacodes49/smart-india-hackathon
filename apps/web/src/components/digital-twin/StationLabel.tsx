"use client";

import { Billboard, Text } from "@react-three/drei";

interface StationLabelProps {
    name: string;
    subtitle?: string;
    position: [number, number, number];
}

export default function StationLabel({
    name,
    subtitle,
    position,
}: StationLabelProps) {
    return (
        <Billboard position={position}>
            <Text
                fontSize={0.9}
                color="#f8fafc"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.06}
                outlineColor="#020617"
            >
                {name}
            </Text>
            {subtitle && (
                <Text
                    position={[0, -0.6, 0]}
                    fontSize={0.45}
                    color="#7dd3fc"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.04}
                    outlineColor="#0f172a"
                >
                    {subtitle}
                </Text>
            )}
        </Billboard>
    );
}