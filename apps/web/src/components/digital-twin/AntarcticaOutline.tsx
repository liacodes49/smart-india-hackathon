"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";

import { projectToShapeSpace } from "@/features/digital-twin/utils/projection";
import {
    loadTerrainData,
    projectedToTerrainWorld,
    type TerrainData,
} from "@/features/digital-twin/utils/terrain";

interface GeoJSONFeature {
    type: "Feature";
    geometry: {
        type: "Polygon" | "MultiPolygon";
        coordinates: unknown;
    };
}

interface OutlineProps {
    terrainData: TerrainData;
}

function createRingGeometry(
    ring: number[][],
    terrainData: TerrainData,
): THREE.BufferGeometry {
    const positions = new Float32Array(
        ring.length * 3,
    );

    ring.forEach((coordinate, index) => {
        const longitude = coordinate[0];
        const latitude = coordinate[1];

        const projected = projectToShapeSpace(
            longitude,
            latitude,
        );

        const world = projectedToTerrainWorld(
            projected.x,
            projected.y,
            terrainData.metadata,
        );

        positions[index * 3] = world.x;
        positions[index * 3 + 1] = 0.035;
        positions[index * 3 + 2] = world.y;
    });

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(
            positions,
            3,
        ),
    );

    return geometry;
}

function extractRings(
    feature: GeoJSONFeature,
): number[][][] {
    const { geometry } = feature;

    if (geometry.type === "Polygon") {
        return geometry.coordinates as number[][][];
    }

    if (geometry.type === "MultiPolygon") {
        const polygons =
            geometry.coordinates as number[][][][];

        const rings: number[][][] = [];

        for (const polygon of polygons) {
            for (const ring of polygon) {
                rings.push(ring);
            }
        }

        return rings;
    }

    return [];
}

export default function AntarcticaOutline() {
    const [geometries, setGeometries] =
        useState<THREE.BufferGeometry[]>([]);

    useEffect(() => {
        let cancelled = false;

        async function loadOutline() {
            try {
                const [
                    geojsonResponse,
                    terrainData,
                ] = await Promise.all([
                    fetch(
                        "/data/antarctica.geojson",
                    ),
                    loadTerrainData(),
                ]);

                if (!geojsonResponse.ok) {
                    throw new Error(
                        "Failed to load Antarctica GeoJSON.",
                    );
                }

                const geojson =
                    (await geojsonResponse.json()) as GeoJSONFeature;

                if (
                    !geojson ||
                    geojson.type !== "Feature" ||
                    !geojson.geometry
                ) {
                    throw new Error(
                        "Invalid Antarctica GeoJSON format.",
                    );
                }

                const rings = extractRings(
                    geojson,
                );

                if (rings.length === 0) {
                    throw new Error(
                        "No coastline rings found in Antarctica GeoJSON.",
                    );
                }

                const ringGeometries = rings.map(
                    (ring) =>
                        createRingGeometry(
                            ring,
                            terrainData,
                        ),
                );

                if (!cancelled) {
                    setGeometries(
                        ringGeometries,
                    );
                }
            } catch (error) {
                console.error(
                    "Failed to load Antarctica outline:",
                    error,
                );
            }
        }

        loadOutline();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        return () => {
            geometries.forEach((geometry) => {
                geometry.dispose();
            });
        };
    }, [geometries]);

    if (geometries.length === 0) {
        return null;
    }

    return (
        <group>
            {geometries.map(
                (geometry, index) => (
                    <lineLoop
                        key={`antarctica-outline-${index}`}
                        geometry={geometry}
                    >
                        <lineBasicMaterial
                            color="#7dd3fc"
                            transparent
                            opacity={0.7}
                            depthTest={false}
                        />
                    </lineLoop>
                ),
            )}
        </group>
    );
}