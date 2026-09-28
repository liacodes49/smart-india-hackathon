"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

import {
    projectToShapeSpace,
} from "@/features/digital-twin/utils/projection";

type Coordinate = [number, number];

type GeoJSONGeometry =
    | {
        type: "Polygon";
        coordinates: Coordinate[][];
    }
    | {
        type: "MultiPolygon";
        coordinates: Coordinate[][][];
    };

type GeoJSONFeature = {
    geometry: GeoJSONGeometry | null;
};

type GeoJSONData =
    | {
        type: "FeatureCollection";
        features: GeoJSONFeature[];
    }
    | {
        type: "Feature";
        geometry: GeoJSONGeometry;
    }
    | GeoJSONGeometry;

function ringsFromGeoJson(
    data: GeoJSONData
): Coordinate[][] {
    const geometries: (GeoJSONGeometry | null)[] =
        "type" in data &&
            data.type === "FeatureCollection"
            ? data.features.map(
                (feature) => feature.geometry
            )
            : "type" in data &&
                data.type === "Feature"
                ? [data.geometry]
                : [data as GeoJSONGeometry];

    const rings: Coordinate[][] = [];

    for (const geometry of geometries) {
        if (!geometry) continue;

        if (geometry.type === "Polygon") {
            if (geometry.coordinates[0]) {
                rings.push(
                    geometry.coordinates[0]
                );
            }
        }

        if (geometry.type === "MultiPolygon") {
            for (const polygon of geometry.coordinates) {
                if (polygon[0]) {
                    rings.push(polygon[0]);
                }
            }
        }
    }

    return rings;
}

/**
 * Builds the main Antarctic ice mass.
 *
 * The extrusion gives the continent physical thickness,
 * while the bevel makes the coastline catch light instead
 * of looking like a completely flat SVG shape.
 */
function buildGeometry(
    ring: Coordinate[]
): THREE.ExtrudeGeometry {
    const shape = new THREE.Shape();

    ring.forEach(
        ([longitude, latitude], index) => {
            const point =
                projectToShapeSpace(
                    longitude,
                    latitude
                );

            if (index === 0) {
                shape.moveTo(
                    point.x,
                    point.y
                );
            } else {
                shape.lineTo(
                    point.x,
                    point.y
                );
            }
        }
    );

    shape.closePath();

    const geometry =
        new THREE.ExtrudeGeometry(
            shape,
            {
                depth: 0.8,

                bevelEnabled: true,
                bevelSegments: 5,
                bevelSize: 0.16,
                bevelThickness: 0.18,

                curveSegments: 4,
            }
        );

    geometry.rotateX(-Math.PI / 2);
    geometry.computeVertexNormals();

    return geometry;
}

/**
 * Generates a subtle procedural ice texture.
 *
 * This avoids needing another texture asset and gives the
 * snow surface tiny variations when light hits it.
 */
function createIceTexture(): THREE.CanvasTexture {
    const size = 256;

    const canvas =
        document.createElement("canvas");

    canvas.width = size;
    canvas.height = size;

    const context =
        canvas.getContext("2d");

    if (!context) {
        throw new Error(
            "Could not create ice texture canvas"
        );
    }

    const image =
        context.createImageData(
            size,
            size
        );

    for (
        let i = 0;
        i < image.data.length;
        i += 4
    ) {
        const value =
            205 +
            Math.random() * 40;

        image.data[i] = value;
        image.data[i + 1] = value;
        image.data[i + 2] = value;
        image.data[i + 3] = 255;
    }

    context.putImageData(
        image,
        0,
        0
    );

    const texture =
        new THREE.CanvasTexture(canvas);

    texture.wrapS =
        THREE.RepeatWrapping;

    texture.wrapT =
        THREE.RepeatWrapping;

    texture.repeat.set(
        5,
        5
    );

    texture.colorSpace =
        THREE.SRGBColorSpace;

    texture.needsUpdate = true;

    return texture;
}

function AntarcticaEdge({
    geometry,
}: {
    geometry: THREE.BufferGeometry;
}) {
    const edges = useMemo(
        () =>
            new THREE.EdgesGeometry(
                geometry,
                18
            ),
        [geometry]
    );

    return (
        <lineSegments
            geometry={edges}
            renderOrder={2}
        >
            <lineBasicMaterial
                color="#8edcf3"
                transparent
                opacity={0.16}
            />
        </lineSegments>
    );
}

function IceShelf({
    geometry,
}: {
    geometry: THREE.BufferGeometry;
}) {
    return (
        <mesh
            geometry={geometry}
            position={[0, 0.055, 0]}
            scale={[0.985, 1, 0.985]}
        >
            <meshStandardMaterial
                color="#c7edf7"
                roughness={0.94}
                metalness={0}
                transparent
                opacity={0.34}
                depthWrite={false}
            />
        </mesh>
    );
}

export default function AntarcticaSurface() {
    const [rings, setRings] =
        useState<Coordinate[][]>([]);

    useEffect(() => {
        let cancelled = false;

        async function loadGeoJSON() {
            try {
                const response =
                    await fetch(
                        "/data/antarctica.geojson"
                    );

                if (!response.ok) {
                    throw new Error(
                        `HTTP ${response.status}`
                    );
                }

                const data: GeoJSONData =
                    await response.json();

                if (!cancelled) {
                    setRings(
                        ringsFromGeoJson(
                            data
                        )
                    );
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(
                        "Failed to load Antarctica GeoJSON:",
                        error
                    );
                }
            }
        }

        loadGeoJSON();

        return () => {
            cancelled = true;
        };
    }, []);

    const geometries = useMemo(
        () =>
            rings
                .filter(
                    (ring) =>
                        ring.length >= 3
                )
                .map(buildGeometry),
        [rings]
    );

    const iceTexture = useMemo(() => {
        if (typeof document === "undefined") {
            return null;
        }

        return createIceTexture();
    }, []);

    useEffect(() => {
        return () => {
            iceTexture?.dispose();
        };
    }, [iceTexture]);

    if (geometries.length === 0) {
        return null;
    }

    return (
        <group>
            {geometries.map(
                (geometry, index) => (
                    <group
                        key={index}
                    >
                        {/* Main ice mass */}
                        <mesh
                            geometry={geometry}
                            castShadow
                            receiveShadow
                        >
                            <meshStandardMaterial
                                color="#d9f3fa"
                                roughness={0.88}
                                metalness={0}
                                bumpMap={
                                    iceTexture ??
                                    undefined
                                }
                                bumpScale={0.055}
                            />
                        </mesh>

                        {/* Thin translucent snow layer */}
                        <IceShelf
                            geometry={
                                geometry
                            }
                        />

                        {/* Coastline highlight */}
                        <AntarcticaEdge
                            geometry={
                                geometry
                            }
                        />

                        {/* Darker underside / ice wall */}
                        <mesh
                            geometry={
                                geometry
                            }
                            position={[
                                0,
                                -0.035,
                                0,
                            ]}
                        >
                            <meshStandardMaterial
                                color="#9fc9d7"
                                roughness={0.96}
                                metalness={0}
                            />
                        </mesh>
                    </group>
                )
            )}
        </group>
    );
}