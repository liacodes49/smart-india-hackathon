"use client";

import { Html } from "@react-three/drei";

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
        <Html
            position={position}
            center
            distanceFactor={8}
            zIndexRange={[10, 0]}
            style={{
                pointerEvents: "none",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "3px",
                    whiteSpace: "nowrap",
                    transform: "translateY(-50%)",
                }}
            >
                <div
                    style={{
                        padding: "5px 9px",
                        borderRadius: "7px",
                        border: "1px solid rgba(148, 163, 184, 0.28)",
                        background: "rgba(2, 6, 23, 0.82)",
                        color: "#f8fafc",
                        fontSize: "11px",
                        fontWeight: 600,
                        letterSpacing: "0.02em",
                        boxShadow:
                            "0 6px 20px rgba(0, 0, 0, 0.35)",
                        backdropFilter: "blur(8px)",
                    }}
                >
                    {name}
                </div>

                {subtitle && (
                    <div
                        style={{
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background:
                                "rgba(15, 23, 42, 0.72)",
                            color: "#7dd3fc",
                            fontSize: "8px",
                            fontWeight: 700,
                            letterSpacing: "0.16em",
                        }}
                    >
                        {subtitle}
                    </div>
                )}
            </div>
        </Html>
    );
}