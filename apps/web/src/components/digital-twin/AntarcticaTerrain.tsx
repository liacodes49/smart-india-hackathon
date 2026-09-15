"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";

import {
    ELEVATION_SCALE,
    SCENE_SCALE,
    TERRAIN_RESOLUTION,
    loadTerrainData,
    type TerrainData,
} from "@/features/digital-twin/utils/terrain";

const MESH_SEGMENTS = 512;

function createTerrainGeometry(
    terrainData: TerrainData,
): THREE.BufferGeometry {
    const { metadata, heights } = terrainData;

    const segments = MESH_SEGMENTS;

    const vertexCount =
        (segments + 1) * (segments + 1);

    const positions =
        new Float32Array(vertexCount * 3);

    const uvs =
        new Float32Array(vertexCount * 2);

    const indices =
        new Uint32Array(
            segments * segments * 6,
        );

    const terrainWidth =
        (metadata.bounds.maxX -
            metadata.bounds.minX) *
        SCENE_SCALE;

    const terrainDepth =
        (metadata.bounds.maxY -
            metadata.bounds.minY) *
        SCENE_SCALE;

    let vertexIndex = 0;

    for (
        let z = 0;
        z <= segments;
        z++
    ) {
        const v = z / segments;

        for (
            let x = 0;
            x <= segments;
            x++
        ) {
            const u = x / segments;

            const sampleX = Math.min(
                TERRAIN_RESOLUTION - 1,
                Math.round(
                    u *
                    (TERRAIN_RESOLUTION - 1),
                ),
            );

            const sampleY = Math.min(
                TERRAIN_RESOLUTION - 1,
                Math.round(
                    v *
                    (TERRAIN_RESOLUTION - 1),
                ),
            );

            const heightIndex =
                sampleY *
                TERRAIN_RESOLUTION +
                sampleX;

            const normalizedHeight =
                heights[heightIndex] / 65535;

            const elevation =
                metadata.minElevation +
                normalizedHeight *
                (metadata.maxElevation -
                    metadata.minElevation);

            /*
             * Terrain is centered around its own
             * local origin.
             *
             * The actual mesh position is then moved
             * to the exact projected center below.
             */
            const worldX =
                (u - 0.5) * terrainWidth;

            const worldZ =
                (v - 0.5) * terrainDepth;

            positions[
                vertexIndex * 3
            ] = worldX;

            positions[
                vertexIndex * 3 + 1
            ] =
                elevation *
                ELEVATION_SCALE;

            positions[
                vertexIndex * 3 + 2
            ] = worldZ;

            uvs[
                vertexIndex * 2
            ] = u;

            uvs[
                vertexIndex * 2 + 1
            ] = 1 - v;

            vertexIndex++;
        }
    }

    let indexOffset = 0;

    for (
        let z = 0;
        z < segments;
        z++
    ) {
        for (
            let x = 0;
            x < segments;
            x++
        ) {
            const a =
                z * (segments + 1) + x;

            const b = a + 1;

            const c =
                (z + 1) *
                (segments + 1) +
                x;

            const d = c + 1;

            indices[indexOffset++] = a;
            indices[indexOffset++] = c;
            indices[indexOffset++] = b;

            indices[indexOffset++] = b;
            indices[indexOffset++] = c;
            indices[indexOffset++] = d;
        }
    }

    const geometry =
        new THREE.BufferGeometry();

    geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(
            positions,
            3,
        ),
    );

    geometry.setAttribute(
        "uv",
        new THREE.BufferAttribute(
            uvs,
            2,
        ),
    );

    geometry.setIndex(
        new THREE.BufferAttribute(
            indices,
            1,
        ),
    );

    geometry.computeVertexNormals();

    return geometry;
}

export default function AntarcticaTerrain() {
    const [terrainData, setTerrainData] =
        useState<TerrainData | null>(null);

    const [geometry, setGeometry] =
        useState<THREE.BufferGeometry | null>(
            null,
        );

    const [maskTexture, setMaskTexture] =
        useState<THREE.Texture | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadTerrain() {
            try {
                const data =
                    await loadTerrainData();

                if (cancelled) {
                    return;
                }

                const terrainGeometry =
                    createTerrainGeometry(data);

                const textureLoader =
                    new THREE.TextureLoader();

                textureLoader.load(
                    "/data/terrain/antarctica-mask.png",
                    (texture) => {
                        texture.colorSpace =
                            THREE.NoColorSpace;

                        texture.wrapS =
                            THREE.ClampToEdgeWrapping;

                        texture.wrapT =
                            THREE.ClampToEdgeWrapping;

                        texture.minFilter =
                            THREE.LinearFilter;

                        texture.magFilter =
                            THREE.LinearFilter;

                        if (cancelled) {
                            texture.dispose();
                            terrainGeometry.dispose();
                            return;
                        }

                        setTerrainData(data);
                        setGeometry(
                            terrainGeometry,
                        );
                        setMaskTexture(texture);
                    },
                    undefined,
                    (error) => {
                        console.error(
                            "Failed to load Antarctica terrain mask:",
                            error,
                        );

                        terrainGeometry.dispose();
                    },
                );
            } catch (error) {
                console.error(
                    "Failed to load Antarctica terrain:",
                    error,
                );
            }
        }

        loadTerrain();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        return () => {
            geometry?.dispose();
            maskTexture?.dispose();
        };
    }, [geometry, maskTexture]);

    if (
        !terrainData ||
        !geometry ||
        !maskTexture
    ) {
        return null;
    }

    /*
     * IMPORTANT:
     *
     * The terrain geometry is centered around
     * its bounding box, so we now move that
     * geometry to the EXACT EPSG:3031 center
     * represented by the generated terrain data.
     */
    const centerX =
        ((terrainData.metadata.bounds.minX +
            terrainData.metadata.bounds.maxX) /
            2) *
        SCENE_SCALE;

    const centerZ =
        -(
            (terrainData.metadata.bounds.minY +
                terrainData.metadata.bounds.maxY) /
            2
        ) * SCENE_SCALE;

    return (
        <mesh
            geometry={geometry}
            position={[
                centerX,
                -0.02,
                centerZ,
            ]}
            receiveShadow
        >
            <meshStandardMaterial
                color="#dcebf2"
                roughness={0.92}
                metalness={0}
                transparent
                alphaMap={maskTexture}
                alphaTest={0.05}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}