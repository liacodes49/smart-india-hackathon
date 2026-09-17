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

import StationEnvironment from "./StationEnvironment";

import AntarcticaTerrain from "./AntarcticaTerrain";
import AntarcticaOutline from "./AntarcticaOutline";
import OverviewEnvironment from "./OverviewEnvironment";

import {
    loadTerrainData,
    sampleTerrainElevation,
    type TerrainData,
} from "@/features/digital-twin/utils/terrain";

import {
    INITIAL_TELEMETRY,
    simulateTelemetry,
    type AssetHealth,
    type TelemetryAsset,
} from "@/features/digital-twin/utils/StationTelemetry";

const OVERVIEW_TARGET: CameraTarget = {
    position: [
        0,
        36,
        0,
    ],
    lookAt: [
        0,
        -3,
        0,
    ],
};

const HEALTH_COLORS: Record<
    AssetHealth,
    string
> = {
    NORMAL: "#22c55e",
    WARNING: "#eab308",
    CRITICAL: "#ef4444",
    OFFLINE: "#6b7280",
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

    const y =
        terrainData
            ? sampleTerrainElevation(
                x,
                z,
                terrainData,
            )
            : 0;

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

    return {
        position: [
            x + 8.5,
            y + 6.5,
            z + 10.5,
        ],

        lookAt: [
            x,
            y + 1,
            z,
        ],
    };
}

interface StationMarkersProps {
    terrainData: TerrainData | null;
    selectedStation:
    | StationCoordinates
    | null;
    onSelect: (
        station: StationCoordinates,
    ) => void;
}

function StationMarkers({
    terrainData,
    selectedStation,
    onSelect,
}: StationMarkersProps) {
    return (
        <>
            {STATIONS.map(
                (station) => {
                    const {
                        x,
                        y,
                        z,
                    } =
                        getStationWorldPosition(
                            station,
                            terrainData,
                        );

                    if (
                        selectedStation &&
                        selectedStation.id !==
                        station.id
                    ) {
                        return null;
                    }

                    return (
                        <StationMarker
                            key={
                                station.id
                            }
                            name={
                                station.name
                            }
                            position={[
                                x,
                                y,
                                z,
                            ]}
                            status={
                                station.status as StationStatus
                            }
                            onSelect={() =>
                                onSelect(
                                    station,
                                )
                            }
                        />
                    );
                },
            )}
        </>
    );
}

function StatusDot({
    health,
}: {
    health: AssetHealth;
}) {
    return (
        <span
            className="inline-block h-2 w-2 rounded-full"
            style={{
                backgroundColor:
                    HEALTH_COLORS[
                    health
                    ],
                boxShadow: `0 0 10px ${HEALTH_COLORS[health]}`,
            }}
        />
    );
}

function Metric({
    label,
    value,
    unit,
}: {
    label: string;
    value: number;
    unit: string;
}) {
    return (
        <div className="rounded-xl border border-white/8 bg-white/[0.035] p-3">
            <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
                {label}
            </p>

            <p className="mt-1 text-lg font-semibold text-white">
                {value.toFixed(1)}
                <span className="ml-1 text-[10px] font-normal text-slate-500">
                    {unit}
                </span>
            </p>
        </div>
    );
}

function TelemetryPanel({
    asset,
    onClose,
}: {
    asset: TelemetryAsset;
    onClose: () => void;
}) {
    return (
        <div className="absolute right-5 top-5 z-30 w-[330px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 shadow-2xl backdrop-blur-xl">
            <div className="border-b border-white/8 p-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-sky-300">
                            Live Telemetry
                        </p>

                        <h2 className="mt-1 text-lg font-semibold text-white">
                            {asset.name}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={
                            onClose
                        }
                        className="rounded-lg px-2 py-1 text-slate-500 transition hover:bg-white/5 hover:text-white"
                    >
                        ×
                    </button>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs">
                    <StatusDot
                        health={
                            asset.health
                        }

                    />

                    <span
                        style={{
                            color:
                                HEALTH_COLORS[
                                asset.health
                                ],
                        }}
                        className="font-medium"
                    >
                        {asset.health}
                    </span>

                    <span className="ml-auto text-[10px] text-slate-500">
                        LIVE
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-4">
                <Metric
                    label="Temperature"
                    value={
                        asset.temperature
                    }
                    unit="°C"
                />

                <Metric
                    label="Power"
                    value={
                        asset.power
                    }
                    unit="kW"
                />

                {asset.fuel > 0 && (
                    <Metric
                        label="Fuel"
                        value={
                            asset.fuel
                        }
                        unit="%"
                    />
                )}

                {asset.water > 0 && (
                    <Metric
                        label="Water"
                        value={
                            asset.water
                        }
                        unit="%"
                    />
                )}
            </div>

            <div className="border-t border-white/8 px-4 py-3">
                <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">
                        Last update
                    </span>

                    <span className="font-mono text-slate-400">
                        {new Date(
                            asset.lastUpdated,
                        ).toLocaleTimeString()}
                    </span>
                </div>
            </div>
        </div>
    );
}

function CommandPanel({
    telemetry,
    selectedAsset,
    onSelectAsset,
}: {
    telemetry: TelemetryAsset[];
    selectedAsset: string | null;
    onSelectAsset: (
        id: string,
    ) => void;
}) {
    const normal =
        telemetry.filter(
            (asset) =>
                asset.health ===
                "NORMAL",
        ).length;

    const warnings =
        telemetry.filter(
            (asset) =>
                asset.health ===
                "WARNING",
        ).length;

    const critical =
        telemetry.filter(
            (asset) =>
                asset.health ===
                "CRITICAL",
        ).length;

    return (
        <div className="absolute bottom-5 left-5 z-20 w-[300px] rounded-2xl border border-white/10 bg-slate-950/80 shadow-2xl backdrop-blur-xl">
            <div className="border-b border-white/8 px-5 py-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-sky-300">
                    Station Command
                </p>

                <div className="mt-3 flex gap-2">
                    <div className="flex-1 rounded-lg bg-green-500/10 px-3 py-2">
                        <p className="text-[9px] text-slate-500">
                            NORMAL
                        </p>

                        <p className="text-sm font-semibold text-green-400">
                            {normal}
                        </p>
                    </div>

                    <div className="flex-1 rounded-lg bg-yellow-500/10 px-3 py-2">
                        <p className="text-[9px] text-slate-500">
                            WARNING
                        </p>

                        <p className="text-sm font-semibold text-yellow-400">
                            {warnings}
                        </p>
                    </div>

                    <div className="flex-1 rounded-lg bg-red-500/10 px-3 py-2">
                        <p className="text-[9px] text-slate-500">
                            CRITICAL
                        </p>

                        <p className="text-sm font-semibold text-red-400">
                            {critical}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-h-[245px] overflow-y-auto p-3">
                {telemetry.map(
                    (asset) => (
                        <button
                            key={
                                asset.id
                            }
                            type="button"
                            onClick={() =>
                                onSelectAsset(
                                    asset.id,
                                )
                            }
                            className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${selectedAsset ===
                                asset.id
                                ? "bg-sky-400/10"
                                : "hover:bg-white/5"
                                }`}
                        >
                            <StatusDot
                                health={
                                    asset.health
                                }
                            />

                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-medium text-slate-200">
                                    {
                                        asset.name
                                    }
                                </span>

                                <span className="block text-[9px] text-slate-500">
                                    {
                                        asset.type.replace(
                                            "_",
                                            " ",
                                        )
                                    }
                                </span>
                            </span>

                            <span
                                className="text-[9px] font-medium"
                                style={{
                                    color:
                                        HEALTH_COLORS[
                                        asset.health
                                        ],
                                }}
                            >
                                {
                                    asset.health
                                }
                            </span>
                        </button>
                    ),
                )}
            </div>
        </div>
    );
}

function AlertsPanel({
    telemetry,
}: {
    telemetry: TelemetryAsset[];
}) {
    const alerts =
        telemetry.filter(
            (asset) =>
                asset.health ===
                "WARNING" ||
                asset.health ===
                "CRITICAL",
        );

    if (alerts.length === 0) {
        return null;
    }

    return (
        <div className="absolute right-5 bottom-5 z-20 w-[330px] rounded-2xl border border-red-400/15 bg-slate-950/85 shadow-2xl backdrop-blur-xl">
            <div className="border-b border-white/8 px-4 py-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-red-300">
                    Active Alerts
                </p>
            </div>

            <div className="p-3">
                {alerts.map(
                    (asset) => (
                        <div
                            key={
                                asset.id
                            }
                            className="mb-2 rounded-xl border border-white/5 bg-white/[0.025] p-3"
                        >
                            <div className="flex items-center gap-2">
                                <StatusDot
                                    health={
                                        asset.health
                                    }
                                />

                                <div className="flex items-center gap-2">
                                    <StatusDot
                                        health={
                                            asset.health
                                        }
                                    />

                                    <span className="text-xs font-medium text-white">
                                        {asset.name}
                                    </span>
                                </div>
                            </div>

                            <p className="mt-1 text-[10px] text-slate-500">
                                {asset.type ===
                                    "GENERATOR"
                                    ? "Generator thermal load requires monitoring."
                                    : asset.type ===
                                        "FUEL_FARM"
                                        ? "Fuel reserve is approaching threshold."
                                        : "Infrastructure telemetry outside normal range."}
                            </p>
                        </div>
                    ),
                )}
            </div>
        </div>
    );
}

interface SceneProps {
    terrainData: TerrainData | null;
    selectedStation:
    | StationCoordinates
    | null;
    cameraTarget: CameraTarget;
    selectedAssetId: string | null;
    onSelectStation: (
        station: StationCoordinates,
    ) => void;
    onSelectAsset: (
        assetId: string,
    ) => void;
}

function Scene({
    terrainData,
    selectedStation,
    cameraTarget,
    selectedAssetId,
    onSelectStation,
    onSelectAsset,
}: SceneProps) {
    return (
        <>
            <OverviewEnvironment />

            <AntarcticaTerrain />

            <AntarcticaOutline />

            <StationMarkers
                terrainData={
                    terrainData
                }
                selectedStation={
                    selectedStation
                }
                onSelect={
                    onSelectStation
                }
            />

            {selectedStation && (
                <group
                    position={(() => {
                        const {
                            x,
                            y,
                            z,
                        } =
                            getStationWorldPosition(
                                selectedStation,
                                terrainData,
                            );

                        return [
                            x,
                            y,
                            z,
                        ];
                    })()}
                >
                    <StationEnvironment
                        stationId={
                            selectedStation.id
                        }
                        selectedAssetId={
                            selectedAssetId
                        }
                        onSelectAsset={
                            onSelectAsset
                        }
                    />
                </group>
            )}

            <CameraController
                target={
                    cameraTarget
                }
            />

            <OrbitControls
                makeDefault
                enablePan={false}
                enableZoom={true}
                zoomSpeed={1}
                minDistance={3}
                maxDistance={100}
                minPolarAngle={0.15}
                maxPolarAngle={
                    Math.PI / 2.2
                }
            />
        </>
    );
}

export default function AntarcticaOverview() {
    const [
        terrainData,
        setTerrainData,
    ] =
        useState<TerrainData | null>(
            null,
        );

    const [
        selectedStation,
        setSelectedStation,
    ] =
        useState<
            StationCoordinates | null
        >(null);

    const [
        selectedAssetId,
        setSelectedAssetId,
    ] =
        useState<string | null>(
            null,
        );

    const [
        telemetry,
        setTelemetry,
    ] = useState<TelemetryAsset[]>(
        INITIAL_TELEMETRY,
    );

    useEffect(() => {
        let cancelled = false;

        loadTerrainData()
            .then((data) => {
                if (!cancelled) {
                    setTerrainData(
                        data,
                    );
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

    /*
     * Live telemetry simulator.
     *
     * Updates every 1.5 seconds.
     */
    useEffect(() => {
        if (!selectedStation) {
            return;
        }

        const interval =
            window.setInterval(() => {
                setTelemetry(
                    (previous) =>
                        simulateTelemetry(
                            previous,
                        ),
                );
            }, 1500);

        return () =>
            window.clearInterval(
                interval,
            );
    }, [selectedStation]);

    const cameraTarget =
        useMemo(() => {
            if (
                !selectedStation ||
                !terrainData
            ) {
                return OVERVIEW_TARGET;
            }

            return getStationCameraTarget(
                selectedStation,
                terrainData,
            );
        }, [
            selectedStation,
            terrainData,
        ]);

    const selectedAsset =
        telemetry.find(
            (asset) =>
                asset.id ===
                selectedAssetId,
        ) ?? null;

    function handleSelectStation(
        station: StationCoordinates,
    ) {
        setSelectedAssetId(null);
        setSelectedStation(
            station,
        );
    }

    function handleReturn() {
        setSelectedAssetId(null);
        setSelectedStation(null);
    }

    return (
        <div className="relative h-screen min-h-[700px] w-full overflow-hidden">
            <Canvas
                shadows
                className="block h-full w-full"
                camera={{
                    position:
                        OVERVIEW_TARGET.position,
                    fov: 55,
                    near: 0.1,
                    far: 200,
                }}
                dpr={[
                    1,
                    1.75,
                ]}
            >
                <Scene
                    terrainData={
                        terrainData
                    }
                    selectedStation={
                        selectedStation
                    }
                    cameraTarget={
                        cameraTarget
                    }
                    selectedAssetId={
                        selectedAssetId
                    }
                    onSelectStation={
                        handleSelectStation
                    }
                    onSelectAsset={
                        setSelectedAssetId
                    }
                />
            </Canvas>

            {selectedStation && (
                <>
                    <div className="absolute left-5 top-5 z-20">
                        <button
                            type="button"
                            onClick={
                                handleReturn
                            }
                            className="rounded-full border border-white/15 bg-slate-950/80 px-4 py-2 text-sm font-medium text-white shadow-xl backdrop-blur-md transition hover:bg-slate-900"
                        >
                            ← Antarctica
                        </button>

                        <div className="mt-3 w-[265px] rounded-2xl border border-white/10 bg-slate-950/80 px-5 py-4 shadow-2xl backdrop-blur-xl">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-sky-300">
                                Station Digital Twin
                            </p>

                            <h1 className="mt-1 text-xl font-semibold text-white">
                                {
                                    selectedStation.name
                                }
                            </h1>

                            <div className="mt-3 flex items-center gap-2">
                                <span
                                    className="h-2 w-2 rounded-full"
                                    style={{
                                        backgroundColor:
                                            HEALTH_COLORS[
                                            selectedStation.status as AssetHealth
                                            ] ??
                                            "#22c55e",
                                    }}
                                />

                                <span className="text-[10px] text-slate-400">
                                    Systems
                                    online
                                </span>

                                <span className="ml-auto font-mono text-[9px] text-slate-600">
                                    LIVE
                                </span>
                            </div>
                        </div>
                    </div>

                    <CommandPanel
                        telemetry={
                            telemetry
                        }
                        selectedAsset={
                            selectedAssetId
                        }
                        onSelectAsset={
                            setSelectedAssetId
                        }
                    />

                    <AlertsPanel
                        telemetry={
                            telemetry
                        }
                    />

                    {selectedAsset && (
                        <TelemetryPanel
                            asset={
                                selectedAsset
                            }
                            onClose={() =>
                                setSelectedAssetId(
                                    null,
                                )
                            }
                        />
                    )}
                </>
            )}

            {!selectedStation && (
                <div className="pointer-events-none absolute left-6 top-6 z-10">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-5 py-4 shadow-2xl backdrop-blur-md">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-sky-300">
                            Antarctic Digital Twin
                        </p>

                        <h1 className="mt-1 text-lg font-semibold text-white">
                            Research Stations
                        </h1>

                        <p className="mt-1 text-xs text-slate-400">
                            Select a station
                            to explore
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}