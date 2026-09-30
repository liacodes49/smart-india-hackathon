import * as THREE from "three";

export const TERRAIN_RESOLUTION = 1024;
export const SCENE_SCALE = 1 / 150000;
export const ELEVATION_SCALE = 0.00035;

export interface TerrainBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}

export interface TerrainMetadata {
    resolution: number;
    width: number;
    height: number;
    minElevation: number;
    maxElevation: number;
    bounds: TerrainBounds;
    projection: string;
}

export interface TerrainData {
    metadata: TerrainMetadata;
    heights: Uint16Array;
}

let terrainPromise: Promise<TerrainData> | null = null;

export function loadTerrainData(): Promise<TerrainData> {
    if (terrainPromise) {
        return terrainPromise;
    }

    terrainPromise = Promise.all([
        fetch("/data/terrain/antarctica-terrain.json"),
        fetch("/data/terrain/antarctica-height.bin"),
    ])
        .then(async ([metadataResponse, heightResponse]) => {
            if (!metadataResponse.ok) {
                throw new Error("Failed to load Antarctica terrain metadata.");
            }

            if (!heightResponse.ok) {
                throw new Error("Failed to load Antarctica terrain height data.");
            }

            const metadata =
                (await metadataResponse.json()) as TerrainMetadata;

            const buffer = await heightResponse.arrayBuffer();
            const heights = new Uint16Array(buffer);

            const expectedSize =
                TERRAIN_RESOLUTION * TERRAIN_RESOLUTION;

            if (heights.length !== expectedSize) {
                throw new Error(
                    `Unexpected terrain heightmap size: ${heights.length}. Expected ${expectedSize}.`,
                );
            }

            return {
                metadata,
                heights,
            };
        })
        .catch((error) => {
            terrainPromise = null;
            throw error;
        });

    return terrainPromise;
}

export function decodeElevation(
    normalizedValue: number,
    metadata: TerrainMetadata,
): number {
    return (
        metadata.minElevation +
        normalizedValue *
        (metadata.maxElevation - metadata.minElevation)
    );
}

/**
 * Converts EPSG:3031 projected coordinates into the
 * local Three.js terrain coordinate system.
 */
export function projectedToTerrainWorld(
    projectedX: number,
    projectedY: number,
    metadata: TerrainMetadata,
): THREE.Vector2 {
    const centerX =
        ((metadata.bounds.minX + metadata.bounds.maxX) / 2) *
        SCENE_SCALE;

    const centerZ =
        -((metadata.bounds.minY + metadata.bounds.maxY) / 2) *
        SCENE_SCALE;

    const worldX = projectedX * SCENE_SCALE;
    const worldZ = -projectedY * SCENE_SCALE;

    return new THREE.Vector2(
        worldX - centerX,
        worldZ - centerZ,
    );
}

/**
 * Converts the GLOBAL Three.js projected coordinates
 * into terrain UV coordinates.
 *
 * Important:
 * The terrain mesh itself is translated to the projected
 * center, so we must subtract that same center here.
 */
export function worldToTerrainUV(
    worldX: number,
    worldZ: number,
    metadata: TerrainMetadata,
): THREE.Vector2 {
    const centerX =
        ((metadata.bounds.minX + metadata.bounds.maxX) / 2) *
        SCENE_SCALE;

    const centerZ =
        -((metadata.bounds.minY + metadata.bounds.maxY) / 2) *
        SCENE_SCALE;

    const localX = worldX - centerX;
    const localZ = worldZ - centerZ;

    const terrainWidth =
        (metadata.bounds.maxX - metadata.bounds.minX) *
        SCENE_SCALE;

    const terrainDepth =
        (metadata.bounds.maxY - metadata.bounds.minY) *
        SCENE_SCALE;

    const u = localX / terrainWidth + 0.5;
    const v = localZ / terrainDepth + 0.5;

    return new THREE.Vector2(u, v);
}

/**
 * Samples the terrain height at a GLOBAL Three.js position.
 */
export function sampleTerrainElevation(
    worldX: number,
    worldZ: number,
    terrainData: TerrainData,
): number {
    const { metadata, heights } = terrainData;

    const uv = worldToTerrainUV(
        worldX,
        worldZ,
        metadata,
    );

    const u = THREE.MathUtils.clamp(uv.x, 0, 1);
    const v = THREE.MathUtils.clamp(uv.y, 0, 1);

    const pixelX =
        u * (TERRAIN_RESOLUTION - 1);

    const pixelY =
        v * (TERRAIN_RESOLUTION - 1);

    const x0 = Math.floor(pixelX);
    const y0 = Math.floor(pixelY);

    const x1 = Math.min(
        x0 + 1,
        TERRAIN_RESOLUTION - 1,
    );

    const y1 = Math.min(
        y0 + 1,
        TERRAIN_RESOLUTION - 1,
    );

    const tx = pixelX - x0;
    const ty = pixelY - y0;

    const i00 =
        y0 * TERRAIN_RESOLUTION + x0;

    const i10 =
        y0 * TERRAIN_RESOLUTION + x1;

    const i01 =
        y1 * TERRAIN_RESOLUTION + x0;

    const i11 =
        y1 * TERRAIN_RESOLUTION + x1;

    const h00 = heights[i00] / 65535;
    const h10 = heights[i10] / 65535;
    const h01 = heights[i01] / 65535;
    const h11 = heights[i11] / 65535;

    const top = THREE.MathUtils.lerp(
        h00,
        h10,
        tx,
    );

    const bottom = THREE.MathUtils.lerp(
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

    const elevationMeters =
        decodeElevation(
            normalizedHeight,
            metadata,
        );

    return elevationMeters * ELEVATION_SCALE;
}