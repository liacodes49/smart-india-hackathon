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

import StationEnvironment, {
    type StationViewMode,
} from "./StationEnvironment";

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

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

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

const VIEW_MODES: {
    id: StationViewMode;
    label: string;
    description: string;
}[] = [
        {
            id: "NORMAL",
            label: "Normal",
            description: "Full station view",
        },
        {
            id: "ENERGY",
            label: "Energy",
            description: "Power infrastructure",
        },
        {
            id: "RISK",
            label: "Risk",
            description: "Health and alerts",
        },
        {
            id: "LOGISTICS",
            label: "Logistics",
            description: "Fuel and logistics",
        },
    ];

type CameraPreset =
    | "OVERVIEW"
    | "POWER_STATION"
    | "FUEL_FARM"
    | "HABITAT"
    | "LOGISTICS";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

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

function getCameraPresetTarget(
    station: StationCoordinates,
    terrainData: TerrainData | null,
    preset: CameraPreset,
): CameraTarget {
    const {
        x,
        y,
        z,
    } = getStationWorldPosition(
        station,
        terrainData,
    );

    switch (preset) {
        case "POWER_STATION":
            return {
                position: [
                    x + 11,
                    y + 5.8,
                    z + 2.5,
                ],
                lookAt: [
                    x + 6,
                    y + 1.5,
                    z - 3.5,
                ],
            };

        case "FUEL_FARM":
            return {
                position: [
                    x - 13,
                    y + 5.2,
                    z + 4,
                ],
                lookAt: [
                    x - 7,
                    y + 0.9,
                    z - 4.3,
                ],
            };

        case "HABITAT":
            return {
                position: [
                    x + 9.5,
                    y + 4.8,
                    z + 9.5,
                ],
                lookAt: [
                    x,
                    y + 1.7,
                    z,
                ],
            };

        case "LOGISTICS":
            return {
                position: [
                    x - 11,
                    y + 5.5,
                    z - 1,
                ],
                lookAt: [
                    x - 3,
                    y + 1,
                    z + 2,
                ],
            };

        case "OVERVIEW":
        default:
            return getStationCameraTarget(
                station,
                terrainData,
            );
    }
}

function getStationHealth(
    telemetry: TelemetryAsset[],
): StationStatus {
    if (
        telemetry.some(
            (asset) =>
                asset.health ===
                "CRITICAL",
        )
    ) {
        return "CRITICAL";
    }

    if (
        telemetry.some(
            (asset) =>
                asset.health ===
                "WARNING",
        )
    ) {
        return "WARNING";
    }

    if (
        telemetry.some(
            (asset) =>
                asset.health ===
                "OFFLINE",
        )
    ) {
        return "OFFLINE";
    }

    return "NORMAL";
}

function getCriticalCameraPreset(
    assetId: string,
): CameraPreset | null {
    switch (assetId) {
        case "generator":
            return "POWER_STATION";

        case "fuel-farm":
            return "FUEL_FARM";

        case "main-building":
            return "HABITAT";

        case "container-01":
        case "pump-house":
            return "LOGISTICS";

        default:
            return null;
    }
}

/* -------------------------------------------------------------------------- */
/* Station markers                                                            */
/* -------------------------------------------------------------------------- */

interface StationMarkersProps {
    terrainData: TerrainData | null;
    selectedStation:
    | StationCoordinates
    | null;
    stationStatus: StationStatus;
    onSelect: (
        station: StationCoordinates,
    ) => void;
}

function StationMarkers({
    terrainData,
    selectedStation,
    stationStatus,
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
                                stationStatus
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

/* -------------------------------------------------------------------------- */
/* UI helpers                                                                 */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Telemetry panel                                                            */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Command panel                                                              */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Alerts panel                                                               */
/* -------------------------------------------------------------------------- */

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

                                <span className="text-xs font-medium text-white">
                                    {asset.name}
                                </span>
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

/* -------------------------------------------------------------------------- */
/* Mode selector                                                              */
/* -------------------------------------------------------------------------- */

function ModeSelector({
    mode,
    onChange,
}: {
    mode: StationViewMode;
    onChange: (
        mode: StationViewMode,
    ) => void;
}) {
    return (
        <div className="absolute left-1/2 top-5 z-30 -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-950/80 p-1.5 shadow-2xl backdrop-blur-xl">
            <div className="flex gap-1">
                {VIEW_MODES.map(
                    (item) => (
                        <button
                            key={
                                item.id
                            }
                            type="button"
                            title={
                                item.description
                            }
                            onClick={() =>
                                onChange(
                                    item.id,
                                )
                            }
                            className={`rounded-xl px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] transition ${mode ===
                                    item.id
                                    ? "bg-sky-400/15 text-sky-300"
                                    : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                                }`}
                        >
                            {
                                item.label
                            }
                        </button>
                    ),
                )}
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Camera preset selector                                                     */
/* -------------------------------------------------------------------------- */

function CameraPresets({
    preset,
    onChange,
}: {
    preset: CameraPreset;
    onChange: (
        preset: CameraPreset,
    ) => void;
}) {
    const presets: {
        id: CameraPreset;
        label: string;
    }[] = [
            {
                id: "OVERVIEW",
                label: "Overview",
            },
            {
                id: "POWER_STATION",
                label: "Power Station",
            },
            {
                id: "FUEL_FARM",
                label: "Fuel Farm",
            },
            {
                id: "HABITAT",
                label: "Habitat",
            },
            {
                id: "LOGISTICS",
                label: "Logistics",
            },
        ];

    return (
        <div className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-950/80 p-1.5 shadow-2xl backdrop-blur-xl">
            <div className="flex gap-1">
                {presets.map(
                    (item) => (
                        <button
                            key={
                                item.id
                            }
                            type="button"
                            onClick={() =>
                                onChange(
                                    item.id,
                                )
                            }
                            className={`rounded-xl px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] transition ${preset ===
                                    item.id
                                    ? "bg-white/10 text-white"
                                    : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                                }`}
                        >
                            {
                                item.label
                            }
                        </button>
                    ),
                )}
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Scene                                                                      */
/* -------------------------------------------------------------------------- */

interface SceneProps {
    terrainData: TerrainData | null;
    selectedStation:
    | StationCoordinates
    | null;
    cameraTarget: CameraTarget;
    selectedAssetId: string | null;
    stationStatus: StationStatus;
    telemetry: TelemetryAsset[];
    viewMode: StationViewMode;
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
    stationStatus,
    telemetry,
    viewMode,
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
                stationStatus={
                    stationStatus
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
                        telemetry={
                            telemetry
                        }
                        viewMode={
                            viewMode
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

/* -------------------------------------------------------------------------- */
/* Main component                                                             */
/* -------------------------------------------------------------------------- */

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

    const [
        viewMode,
        setViewMode,
    ] =
        useState<StationViewMode>(
            "NORMAL",
        );

    const [
        cameraPreset,
        setCameraPreset,
    ] =
        useState<CameraPreset>(
            "OVERVIEW",
        );

    const [
        autoFocusEnabled,
        setAutoFocusEnabled,
    ] = useState(true);

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

    const selectedAsset =
        telemetry.find(
            (asset) =>
                asset.id ===
                selectedAssetId,
        ) ?? null;

    const stationStatus =
        useMemo(
            () =>
                getStationHealth(
                    telemetry,
                ),
            [telemetry],
        );

    const criticalAsset =
        useMemo(
            () =>
                telemetry.find(
                    (asset) =>
                        asset.health ===
                        "CRITICAL",
                ) ?? null,
            [telemetry],
        );

    /*
     * Automatically focus the camera when a NEW critical asset appears.
     *
     * The ref-like state is represented by the previous critical ID so
     * telemetry updates every 1.5 seconds do not constantly interrupt the
     * operator's camera movement.
     */
    const [
        lastAutoFocusedCriticalId,
        setLastAutoFocusedCriticalId,
    ] = useState<
        string | null
    >(null);

    useEffect(() => {
        if (
            !selectedStation ||
            !autoFocusEnabled ||
            !criticalAsset
        ) {
            if (
                !criticalAsset
            ) {
                setLastAutoFocusedCriticalId(
                    null,
                );
            }

            return;
        }

        if (
            criticalAsset.id ===
            lastAutoFocusedCriticalId
        ) {
            return;
        }

        const preset =
            getCriticalCameraPreset(
                criticalAsset.id,
            );

        if (preset) {
            setCameraPreset(
                preset,
            );
            setViewMode(
                "RISK",
            );
        }

        setLastAutoFocusedCriticalId(
            criticalAsset.id,
        );
    }, [
        selectedStation,
        autoFocusEnabled,
        criticalAsset,
        lastAutoFocusedCriticalId,
    ]);

    const cameraTarget =
        useMemo(() => {
            if (
                !selectedStation ||
                !terrainData
            ) {
                return OVERVIEW_TARGET;
            }

            return getCameraPresetTarget(
                selectedStation,
                terrainData,
                cameraPreset,
            );
        }, [
            selectedStation,
            terrainData,
            cameraPreset,
        ]);

    function handleSelectStation(
        station: StationCoordinates,
    ) {
        setSelectedAssetId(
            null,
        );

        setSelectedStation(
            station,
        );

        setCameraPreset(
            "OVERVIEW",
        );

        setViewMode(
            "NORMAL",
        );

        setLastAutoFocusedCriticalId(
            null,
        );
    }

    function handleReturn() {
        setSelectedAssetId(
            null,
        );

        setSelectedStation(
            null,
        );

        setCameraPreset(
            "OVERVIEW",
        );

        setViewMode(
            "NORMAL",
        );

        setLastAutoFocusedCriticalId(
            null,
        );
    }

    function handleModeChange(
        mode: StationViewMode,
    ) {
        setViewMode(
            mode,
        );
    }

    function handlePresetChange(
        preset: CameraPreset,
    ) {
        if (
            !selectedStation
        ) {
            return;
        }

        setAutoFocusEnabled(
            true,
        );

        setCameraPreset(
            preset,
        );
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
                    stationStatus={
                        stationStatus
                    }
                    telemetry={
                        telemetry
                    }
                    viewMode={
                        viewMode
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
                    <ModeSelector
                        mode={
                            viewMode
                        }
                        onChange={
                            handleModeChange
                        }
                    />

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
                                            stationStatus
                                            ],
                                        boxShadow: `0 0 10px ${HEALTH_COLORS[stationStatus]}`,
                                    }}
                                />

                                <span
                                    className="text-[10px]"
                                    style={{
                                        color:
                                            HEALTH_COLORS[
                                            stationStatus
                                            ],
                                    }}
                                >
                                    {stationStatus}
                                </span>

                                <span className="ml-auto font-mono text-[9px] text-slate-600">
                                    LIVE
                                </span>
                            </div>

                            <div className="mt-3 border-t border-white/8 pt-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] uppercase tracking-[0.15em] text-slate-600">
                                        Mode
                                    </span>

                                    <span className="text-[10px] font-medium text-slate-300">
                                        {
                                            viewMode
                                        }
                                    </span>
                                </div>

                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-[9px] uppercase tracking-[0.15em] text-slate-600">
                                        Camera
                                    </span>

                                    <span className="text-[10px] font-medium text-slate-300">
                                        {cameraPreset ===
                                            "POWER_STATION"
                                            ? "Power Station"
                                            : cameraPreset ===
                                                "FUEL_FARM"
                                                ? "Fuel Farm"
                                                : cameraPreset ===
                                                    "HABITAT"
                                                    ? "Habitat"
                                                    : cameraPreset ===
                                                        "LOGISTICS"
                                                        ? "Logistics"
                                                        : "Overview"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setAutoFocusEnabled(
                                (value) =>
                                    !value,
                            )
                        }
                        className={`absolute right-5 top-5 z-30 rounded-xl border px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.15em] shadow-xl backdrop-blur-xl transition ${autoFocusEnabled
                                ? "border-red-400/30 bg-red-500/10 text-red-300"
                                : "border-white/10 bg-slate-950/80 text-slate-500"
                            }`}
                    >
                        Auto Focus{" "}
                        {autoFocusEnabled
                            ? "ON"
                            : "OFF"}
                    </button>

                    <CameraPresets
                        preset={
                            cameraPreset
                        }
                        onChange={
                            handlePresetChange
                        }
                    />

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