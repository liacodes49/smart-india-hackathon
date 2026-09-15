"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Canvas,
} from "@react-three/fiber";

import {
    OrbitControls,
} from "@react-three/drei";

import {
    projectToWorldXZ,
} from "@/features/digital-twin/utils/projection";

import {
    STATIONS,
    type StationCoordinates,
} from "@/features/digital-twin/utils/stations";

import {
    StationMarker,
    type StationStatus,
} from "@/components/digital-twin/StationMarker";

import {
    CameraController,
    type CameraTarget,
} from "@/components/digital-twin/CameraController";

import AntarcticaTerrain from "./AntarcticaTerrain";

import OverviewEnvironment from "./OverviewEnvironment";

import {
    loadTerrainData,
    sampleTerrainElevation,
    type TerrainData,
} from "@/features/digital-twin/utils/terrain";

import AntarcticaOutline from "./AntarcticaOutline";

const OVERVIEW_TARGET: CameraTarget = {
    position: [0, 36, 0],
    lookAt: [0, -3, 0],
};

const DEMO_STATUS: Record<
    string,
    StationStatus
> = {
    MAITRI: "NORMAL",
    BHARATI: "WARNING",
};

function getStationWorldPosition(
    station: StationCoordinates,
    terrainData: TerrainData | null,
) {
    const {
        x,
        z,
    } = projectToWorldXZ(
        station.longitude,
        station.latitude,
    );

    let y = 0;

    if (terrainData) {
        y = sampleTerrainElevation(
            x,
            z,
            terrainData,
        );
    }

    return {
        x,
        y,
        z,
    };
}

function getStationCameraTarget(
    station: StationCoordinates,
    terrainData: TerrainData | null,
): CameraTarget {
    const {
        x,
        y,
        z,
    } = getStationWorldPosition(
        station,
        terrainData,
    );

    /*
     * Raise the camera slightly above and
     * behind the station while looking directly
     * at the sampled terrain elevation.
     */
    return {
        position: [
            x + 4,
            y + 5,
            z + 6,
        ],
        lookAt: [
            x,
            y + 0.15,
            z,
        ],
    };
}

interface StationMarkersProps {
    terrainData: TerrainData | null;
    onSelectStation: (
        stationId: string,
    ) => void;
}

function StationMarkers({
    terrainData,
    onSelectStation,
}: StationMarkersProps) {
    return (
        <>
            {STATIONS.map((station) => {
                const {
                    x,
                    y,
                    z,
                } = getStationWorldPosition(
                    station,
                    terrainData,
                );

                return (
                    <StationMarker
                        key={station.id}
                        name={station.name}
                        position={[
                            x,
                            y,
                            z,
                        ]}
                        status={
                            DEMO_STATUS[
                            station.id
                            ] ?? "OFFLINE"
                        }
                        onSelect={() =>
                            onSelectStation(
                                station.id,
                            )
                        }
                    />
                );
            })}
        </>
    );
}

interface SceneProps {
    selectedStationId: string | null;
    terrainData: TerrainData | null;
    onSelectStation: (
        stationId: string,
    ) => void;
}

function Scene({
    selectedStationId,
    terrainData,
    onSelectStation,
}: SceneProps) {
    const cameraTarget =
        useMemo(() => {
            if (!selectedStationId) {
                return OVERVIEW_TARGET;
            }

            const station =
                STATIONS.find(
                    (item) =>
                        item.id ===
                        selectedStationId,
                );

            if (!station) {
                return OVERVIEW_TARGET;
            }

            return getStationCameraTarget(
                station,
                terrainData,
            );
        }, [
            selectedStationId,
            terrainData,
        ]);

    return (
        <>
            <OverviewEnvironment />

            <AntarcticaTerrain />

            <AntarcticaOutline />

            <StationMarkers
                stations={STATIONS}
                terrainData={terrainData}
            />

            <CameraController
                target={cameraTarget}
            />

            <OrbitControls
                makeDefault
                enablePan={false}
                enableZoom={true}
                zoomSpeed={1}
                minDistance={3}
                maxDistance={100}
                minPolarAngle={0.15}
                maxPolarAngle={Math.PI / 2.2}
            />
        </>
    );
}

export default function AntarcticaOverview() {
    const [
        selectedStationId,
        setSelectedStationId,
    ] = useState<string | null>(
        null,
    );

    const [
        terrainData,
        setTerrainData,
    ] = useState<TerrainData | null>(
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
                    "Failed to load terrain data for station positioning:",
                    error,
                );
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="relative w-full h-screen min-h-[700px]">
            <Canvas
                shadows
                className="block h-full w-full"
                camera={{
                    position: OVERVIEW_TARGET.position,
                    fov: 55,
                    near: 0.1,
                    far: 200,
                }}
            >
                <Scene
                    selectedStationId={selectedStationId}
                    terrainData={terrainData}
                    onSelectStation={setSelectedStationId}
                />
            </Canvas>

            {selectedStationId && (
                <button
                    type="button"
                    onClick={() => setSelectedStationId(null)}
                    className="absolute left-4 top-4 z-10 rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-sm text-white backdrop-blur-md transition hover:bg-black/70"
                >
                    Back to Antarctica
                </button>
            )}
        </div>
    );
}