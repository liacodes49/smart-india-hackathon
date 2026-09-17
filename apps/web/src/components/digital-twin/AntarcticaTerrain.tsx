"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

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
    const geometry =
        new THREE.PlaneGeometry(
            1,
            1,
            MESH_SEGMENTS,
            MESH_SEGMENTS,
        );

    geometry.rotateX(-Math.PI / 2);

    const position =
        geometry.attributes.position;

    const {
        metadata,
        heights,
    } = terrainData;

    const width =
        (metadata.bounds.maxX -
            metadata.bounds.minX) *
        SCENE_SCALE;

    const depth =
        (metadata.bounds.maxY -
            metadata.bounds.minY) *
        SCENE_SCALE;

    const elevationRange =
        metadata.maxElevation -
        metadata.minElevation;

    for (
        let i = 0;
        i < position.count;
        i++
    ) {
        const localX =
            position.getX(i);

        const localZ =
            position.getZ(i);

        const u =
            localX + 0.5;

        const v =
            localZ + 0.5;

        const pixelX =
            THREE.MathUtils.clamp(
                u,
                0,
                1,
            ) *
            (TERRAIN_RESOLUTION - 1);

        const pixelY =
            THREE.MathUtils.clamp(
                v,
                0,
                1,
            ) *
            (TERRAIN_RESOLUTION - 1);

        const x0 =
            Math.floor(pixelX);

        const y0 =
            Math.floor(pixelY);

        const x1 =
            Math.min(
                x0 + 1,
                TERRAIN_RESOLUTION - 1,
            );

        const y1 =
            Math.min(
                y0 + 1,
                TERRAIN_RESOLUTION - 1,
            );

        const tx =
            pixelX - x0;

        const ty =
            pixelY - y0;

        const i00 =
            y0 *
            TERRAIN_RESOLUTION +
            x0;

        const i10 =
            y0 *
            TERRAIN_RESOLUTION +
            x1;

        const i01 =
            y1 *
            TERRAIN_RESOLUTION +
            x0;

        const i11 =
            y1 *
            TERRAIN_RESOLUTION +
            x1;

        const h00 =
            heights[i00] / 65535;

        const h10 =
            heights[i10] / 65535;

        const h01 =
            heights[i01] / 65535;

        const h11 =
            heights[i11] / 65535;

        const top =
            THREE.MathUtils.lerp(
                h00,
                h10,
                tx,
            );

        const bottom =
            THREE.MathUtils.lerp(
                h01,
                h11,
                tx,
            );

        const normalizedHeight =
            THREE.MathUtils.lerp(
                top,
                bottom,
                ty,
            );

        const elevation =
            metadata.minElevation +
            normalizedHeight *
            elevationRange;

        position.setX(
            i,
            localX * width,
        );

        position.setY(
            i,
            elevation *
            ELEVATION_SCALE,
        );

        position.setZ(
            i,
            localZ * depth,
        );
    }

    position.needsUpdate = true;

    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    return geometry;
}

export default function AntarcticaTerrain() {
    const [
        terrainData,
        setTerrainData,
    ] =
        useState<TerrainData | null>(
            null,
        );

    const [
        maskTexture,
        setMaskTexture,
    ] =
        useState<THREE.Texture | null>(
            null,
        );

    useEffect(() => {
        let cancelled = false;

        loadTerrainData()
            .then((data) => {
                if (!cancelled) {
                    setTerrainData(data);
                }
            })
            .catch((error) => {
                console.error(
                    "Failed to load Antarctica terrain:",
                    error,
                );
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const loader =
            new THREE.TextureLoader();

        loader.load(
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

                texture.flipY = false;

                setMaskTexture(texture);
            },
            undefined,
            (error) => {
                console.error(
                    "Failed to load Antarctica terrain mask:",
                    error,
                );
            },
        );
    }, []);

    const geometry =
        useMemo(() => {
            if (!terrainData) {
                return null;
            }

            return createTerrainGeometry(
                terrainData,
            );
        }, [terrainData]);

    useEffect(() => {
        return () => {
            geometry?.dispose();
        };
    }, [geometry]);

    useEffect(() => {
        return () => {
            maskTexture?.dispose();
        };
    }, [maskTexture]);

    if (
        !terrainData ||
        !geometry ||
        !maskTexture
    ) {
        return null;
    }

    const centerX =
        (
            terrainData.metadata.bounds
                .minX +
            terrainData.metadata.bounds
                .maxX
        ) /
        2 *
        SCENE_SCALE;

    const centerZ =
        -(
            (
                terrainData.metadata.bounds
                    .minY +
                terrainData.metadata.bounds
                    .maxY
            ) /
            2
        ) *
        SCENE_SCALE;

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
                color="#e8f3f8"
                roughness={0.92}
                metalness={0}
                alphaMap={maskTexture}
                transparent
                alphaTest={0.05}
                depthWrite
            />
        </mesh>
    );
}