"use client";

import {
    INITIAL_TELEMETRY,
    type AssetHealth,
    type TelemetryAsset,
} from "./StationTelemetry";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type OperationalScenario =
    | "NORMAL"
    | "EXTREME_COLD"
    | "BLIZZARD"
    | "GENERATOR_FAILURE"
    | "FUEL_SUPPLY_DELAY"
    | "WATER_SYSTEM_FAILURE"
    | "EMERGENCY_SHUTDOWN";

export interface EnvironmentState {
    temperature: number;
    windSpeed: number;
    visibility: number;
    snowIntensity: number;
    pressure: number;
}

export interface EnergyState {
    generation: number;
    consumption: number;
    generatorLoad: number;
    battery: number;
    batteryDischargeRate: number;
}

export interface FuelState {
    reserve: number;
    consumptionPerHour: number;
    estimatedDaysRemaining: number;
}

export interface WaterState {
    storage: number;
    consumptionPerDay: number;
    treatmentOnline: boolean;
}

export interface StationOperationalState {
    environment: EnvironmentState;
    energy: EnergyState;
    fuel: FuelState;
    water: WaterState;
    scenario: OperationalScenario;
    stationHealth: AssetHealth;
    timestamp: number;
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const MAX_GENERATOR_OUTPUT = 480;

const BASE_POWER_CONSUMPTION = 290;

const BASE_FUEL_RESERVE = 76;

const BASE_WATER_STORAGE = 82;

const BASE_TEMPERATURE = -18;

/* -------------------------------------------------------------------------- */
/* Scenario modifiers                                                         */
/* -------------------------------------------------------------------------- */

function getScenarioModifiers(
    scenario: OperationalScenario,
) {
    switch (scenario) {
        case "EXTREME_COLD":
            return {
                temperature: -32,
                windSpeed: 32,
                visibility: 7,
                snowIntensity: 28,
                pressure: 985,
                energyMultiplier: 1.32,
                fuelMultiplier: 1.24,
            };

        case "BLIZZARD":
            return {
                temperature: -27,
                windSpeed: 58,
                visibility: 1.8,
                snowIntensity: 92,
                pressure: 970,
                energyMultiplier: 1.18,
                fuelMultiplier: 1.16,
            };

        case "GENERATOR_FAILURE":
            return {
                temperature: -21,
                windSpeed: 24,
                visibility: 8,
                snowIntensity: 8,
                pressure: 992,
                energyMultiplier: 1,
                fuelMultiplier: 1.15,
            };

        case "FUEL_SUPPLY_DELAY":
            return {
                temperature: -20,
                windSpeed: 27,
                visibility: 8,
                snowIntensity: 12,
                pressure: 990,
                energyMultiplier: 1.05,
                fuelMultiplier: 1.12,
            };

        case "WATER_SYSTEM_FAILURE":
            return {
                temperature: -19,
                windSpeed: 22,
                visibility: 9,
                snowIntensity: 5,
                pressure: 994,
                energyMultiplier: 1.08,
                fuelMultiplier: 1.02,
            };

        case "EMERGENCY_SHUTDOWN":
            return {
                temperature: -22,
                windSpeed: 26,
                visibility: 7,
                snowIntensity: 10,
                pressure: 989,
                energyMultiplier: 0.58,
                fuelMultiplier: 0.52,
            };

        case "NORMAL":
        default:
            return {
                temperature: BASE_TEMPERATURE,
                windSpeed: 22,
                visibility: 10,
                snowIntensity: 4,
                pressure: 994,
                energyMultiplier: 1,
                fuelMultiplier: 1,
            };
    }
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function clamp(
    value: number,
    min: number,
    max: number,
) {
    return Math.max(
        min,
        Math.min(max, value),
    );
}

function randomNoise(
    amount: number,
) {
    return (
        (Math.random() - 0.5) *
        amount
    );
}

/* -------------------------------------------------------------------------- */
/* Initial operational state                                                  */
/* -------------------------------------------------------------------------- */

export function createInitialOperationalState(): StationOperationalState {
    return {
        environment: {
            temperature: BASE_TEMPERATURE,
            windSpeed: 22,
            visibility: 10,
            snowIntensity: 4,
            pressure: 994,
        },

        energy: {
            generation: 420,
            consumption:
                BASE_POWER_CONSUMPTION,
            generatorLoad: 68,
            battery: 74,
            batteryDischargeRate: 0,
        },

        fuel: {
            reserve: BASE_FUEL_RESERVE,
            consumptionPerHour: 18.4,
            estimatedDaysRemaining: 41,
        },

        water: {
            storage: BASE_WATER_STORAGE,
            consumptionPerDay: 1240,
            treatmentOnline: true,
        },

        scenario: "NORMAL",

        stationHealth: "NORMAL",

        timestamp: Date.now(),
    };
}

/* -------------------------------------------------------------------------- */
/* Environmental simulation                                                   */
/* -------------------------------------------------------------------------- */

function simulateEnvironment(
    previous: EnvironmentState,
    scenario: OperationalScenario,
): EnvironmentState {
    const modifiers =
        getScenarioModifiers(
            scenario,
        );

    return {
        temperature:
            previous.temperature +
            (modifiers.temperature -
                previous.temperature) *
            0.08 +
            randomNoise(0.35),

        windSpeed: clamp(
            previous.windSpeed +
            (modifiers.windSpeed -
                previous.windSpeed) *
            0.08 +
            randomNoise(1.8),
            0,
            100,
        ),

        visibility: clamp(
            previous.visibility +
            (modifiers.visibility -
                previous.visibility) *
            0.08 +
            randomNoise(0.15),
            0.2,
            12,
        ),

        snowIntensity: clamp(
            previous.snowIntensity +
            (modifiers.snowIntensity -
                previous.snowIntensity) *
            0.08 +
            randomNoise(2),
            0,
            100,
        ),

        pressure:
            previous.pressure +
            (modifiers.pressure -
                previous.pressure) *
            0.08 +
            randomNoise(0.8),
    };
}

/* -------------------------------------------------------------------------- */
/* Energy simulation                                                          */
/* -------------------------------------------------------------------------- */

function simulateEnergy(
    previous: EnergyState,
    environment: EnvironmentState,
    scenario: OperationalScenario,
): EnergyState {
    const modifiers =
        getScenarioModifiers(
            scenario,
        );

    const coldLoad =
        Math.max(
            0,
            (-environment.temperature -
                15) *
            4,
        );

    const windLoad =
        environment.windSpeed *
        0.45;

    const snowLoad =
        environment.snowIntensity *
        0.18;

    const targetConsumption =
        (BASE_POWER_CONSUMPTION +
            coldLoad +
            windLoad +
            snowLoad) *
        modifiers.energyMultiplier;

    let generation =
        previous.generation;

    if (
        scenario ===
        "GENERATOR_FAILURE"
    ) {
        generation = 0;
    } else if (
        scenario ===
        "EMERGENCY_SHUTDOWN"
    ) {
        generation =
            MAX_GENERATOR_OUTPUT *
            0.42;
    } else {
        generation =
            generation +
            (Math.min(
                MAX_GENERATOR_OUTPUT,
                targetConsumption *
                1.12,
            ) -
                generation) *
            0.12 +
            randomNoise(4);
    }

    const consumption =
        previous.consumption +
        (targetConsumption -
            previous.consumption) *
        0.1 +
        randomNoise(3);

    const powerBalance =
        generation - consumption;

    let battery =
        previous.battery;

    let batteryDischargeRate = 0;

    if (powerBalance >= 0) {
        battery = clamp(
            battery +
            powerBalance *
            0.003,
            0,
            100,
        );
    } else {
        batteryDischargeRate =
            Math.abs(
                powerBalance,
            );

        battery = clamp(
            battery -
            Math.abs(
                powerBalance,
            ) *
            0.012,
            0,
            100,
        );
    }

    const generatorLoad =
        generation === 0
            ? 0
            : clamp(
                (generation /
                    MAX_GENERATOR_OUTPUT) *
                100,
                0,
                100,
            );

    return {
        generation: clamp(
            generation,
            0,
            MAX_GENERATOR_OUTPUT,
        ),

        consumption: clamp(
            consumption,
            0,
            600,
        ),

        generatorLoad,

        battery,

        batteryDischargeRate,
    };
}

/* -------------------------------------------------------------------------- */
/* Fuel simulation                                                            */
/* -------------------------------------------------------------------------- */

function simulateFuel(
    previous: FuelState,
    energy: EnergyState,
    scenario: OperationalScenario,
): FuelState {
    const modifiers =
        getScenarioModifiers(
            scenario,
        );

    const loadFactor =
        energy.generatorLoad /
        68;

    let consumption =
        18.4 *
        Math.max(
            0.35,
            loadFactor,
        ) *
        modifiers.fuelMultiplier;

    if (
        scenario ===
        "GENERATOR_FAILURE"
    ) {
        consumption *= 0.72;
    }

    if (
        scenario ===
        "EMERGENCY_SHUTDOWN"
    ) {
        consumption *= 0.52;
    }

    consumption +=
        randomNoise(0.8);

    consumption = Math.max(
        0,
        consumption,
    );

    const reserveDrop =
        consumption *
        (1.5 / 3600) *
        0.055;

    const reserve = clamp(
        previous.reserve -
        reserveDrop,
        0,
        100,
    );

    const estimatedDaysRemaining =
        reserve <= 0
            ? 0
            : Math.max(
                0,
                (reserve /
                    76) *
                41,
            );

    return {
        reserve,
        consumptionPerHour:
            consumption,
        estimatedDaysRemaining,
    };
}

/* -------------------------------------------------------------------------- */
/* Water simulation                                                           */
/* -------------------------------------------------------------------------- */

function simulateWater(
    previous: WaterState,
    energy: EnergyState,
    scenario: OperationalScenario,
): WaterState {
    let treatmentOnline =
        previous.treatmentOnline;

    if (
        scenario ===
        "WATER_SYSTEM_FAILURE"
    ) {
        treatmentOnline = false;
    } else if (
        scenario === "NORMAL"
    ) {
        treatmentOnline = true;
    }

    const consumptionPerDay =
        1240 +
        energy.consumption *
        0.45;

    const storageDrop =
        (consumptionPerDay /
            86400) *
        1.5 *
        0.018;

    const storage = clamp(
        previous.storage -
        storageDrop,
        0,
        100,
    );

    return {
        storage,
        consumptionPerDay,
        treatmentOnline,
    };
}

/* -------------------------------------------------------------------------- */
/* Station health                                                             */
/* -------------------------------------------------------------------------- */

function calculateStationHealth(
    state: Omit<
        StationOperationalState,
        "stationHealth"
    >,
): AssetHealth {
    const {
        environment,
        energy,
        fuel,
        water,
        scenario,
    } = state;

    if (
        scenario ===
        "GENERATOR_FAILURE" &&
        energy.battery < 20
    ) {
        return "CRITICAL";
    }

    if (
        scenario ===
        "EMERGENCY_SHUTDOWN"
    ) {
        return "CRITICAL";
    }

    if (
        scenario ===
        "WATER_SYSTEM_FAILURE"
    ) {
        return water.storage <
            30
            ? "CRITICAL"
            : "WARNING";
    }

    if (
        energy.generation === 0
    ) {
        return "CRITICAL";
    }

    if (
        fuel.reserve < 15 ||
        energy.battery < 15 ||
        environment.visibility <
        2
    ) {
        return "CRITICAL";
    }

    if (
        fuel.reserve < 35 ||
        energy.generatorLoad > 90 ||
        energy.battery < 35 ||
        environment.windSpeed >
        50 ||
        environment.visibility <
        5 ||
        water.storage < 35 ||
        !water.treatmentOnline
    ) {
        return "WARNING";
    }

    return "NORMAL";
}

/* -------------------------------------------------------------------------- */
/* Main simulation                                                            */
/* -------------------------------------------------------------------------- */

export function simulateOperationalState(
    previous: StationOperationalState,
): StationOperationalState {
    const environment =
        simulateEnvironment(
            previous.environment,
            previous.scenario,
        );

    const energy =
        simulateEnergy(
            previous.energy,
            environment,
            previous.scenario,
        );

    const fuel =
        simulateFuel(
            previous.fuel,
            energy,
            previous.scenario,
        );

    const water =
        simulateWater(
            previous.water,
            energy,
            previous.scenario,
        );

    const nextWithoutHealth = {
        environment,
        energy,
        fuel,
        water,
        scenario: previous.scenario,
        timestamp: Date.now(),
    };

    const stationHealth =
        calculateStationHealth(
            nextWithoutHealth,
        );

    return {
        ...nextWithoutHealth,
        stationHealth,
    };
}

/* -------------------------------------------------------------------------- */
/* Scenario control                                                           */
/* -------------------------------------------------------------------------- */

export function applyOperationalScenario(
    previous: StationOperationalState,
    scenario: OperationalScenario,
): StationOperationalState {
    const base = {
        ...previous,
        scenario,
    };

    switch (scenario) {
        case "GENERATOR_FAILURE":
            return {
                ...base,
                energy: {
                    ...previous.energy,
                    generation: 0,
                    generatorLoad: 0,
                },
                stationHealth:
                    "CRITICAL",
                timestamp: Date.now(),
            };

        case "WATER_SYSTEM_FAILURE":
            return {
                ...base,
                water: {
                    ...previous.water,
                    treatmentOnline: false,
                },
                stationHealth:
                    "WARNING",
                timestamp: Date.now(),
            };

        case "EMERGENCY_SHUTDOWN":
            return {
                ...base,
                energy: {
                    ...previous.energy,
                    generation:
                        MAX_GENERATOR_OUTPUT *
                        0.42,
                },
                stationHealth:
                    "CRITICAL",
                timestamp: Date.now(),
            };

        case "EXTREME_COLD":
        case "BLIZZARD":
        case "FUEL_SUPPLY_DELAY":
            return {
                ...base,
                stationHealth:
                    "WARNING",
                timestamp: Date.now(),
            };

        case "NORMAL":
        default:
            return {
                ...createInitialOperationalState(),
                timestamp: Date.now(),
            };
    }
}

/* -------------------------------------------------------------------------- */
/* Existing telemetry bridge                                                  */
/* -------------------------------------------------------------------------- */

function getAssetHealth(
    type: TelemetryAsset["type"],
    state: StationOperationalState,
): AssetHealth {
    const {
        energy,
        fuel,
        water,
        environment,
        scenario,
    } = state;

    switch (type) {
        case "GENERATOR":
            if (
                scenario ===
                "GENERATOR_FAILURE"
            ) {
                return "CRITICAL";
            }

            if (
                energy.generatorLoad >
                95
            ) {
                return "CRITICAL";
            }

            if (
                energy.generatorLoad >
                82 ||
                energy.battery < 35
            ) {
                return "WARNING";
            }

            return "NORMAL";

        case "FUEL_FARM":
            if (
                fuel.reserve < 15
            ) {
                return "CRITICAL";
            }

            if (
                fuel.reserve < 35 ||
                scenario ===
                "FUEL_SUPPLY_DELAY"
            ) {
                return "WARNING";
            }

            return "NORMAL";

        case "PUMP_HOUSE":
            if (
                scenario ===
                "WATER_SYSTEM_FAILURE"
            ) {
                return "CRITICAL";
            }

            if (
                water.storage < 35
            ) {
                return "WARNING";
            }

            return "NORMAL";

        case "ANTENNA":
            if (
                environment.visibility <
                2
            ) {
                return "WARNING";
            }

            return "NORMAL";

        case "MAIN_BUILDING":
            if (
                environment.temperature <
                -30 ||
                energy.battery < 20
            ) {
                return "WARNING";
            }

            return "NORMAL";

        case "CONTAINER":
            if (
                scenario ===
                "BLIZZARD"
            ) {
                return "WARNING";
            }

            return "NORMAL";

        default:
            return "NORMAL";
    }
}

/* -------------------------------------------------------------------------- */
/* Operational state → existing telemetry                                    */
/* -------------------------------------------------------------------------- */

export function operationalStateToTelemetry(
    state: StationOperationalState,
): TelemetryAsset[] {
    return INITIAL_TELEMETRY.map(
        (asset) => {
            const next: TelemetryAsset = {
                ...asset,
                health: getAssetHealth(
                    asset.type,
                    state,
                ),
                lastUpdated:
                    state.timestamp,
            };

            switch (asset.type) {
                case "GENERATOR":
                    next.temperature =
                        54 +
                        state.energy
                            .generatorLoad *
                        0.3;

                    next.power =
                        state.energy
                            .generation;

                    next.fuel =
                        state.fuel
                            .reserve;

                    break;

                case "FUEL_FARM":
                    next.temperature =
                        state.environment
                            .temperature +
                        2;

                    next.fuel =
                        state.fuel
                            .reserve;

                    next.power = 2;

                    break;

                case "PUMP_HOUSE":
                    next.temperature =
                        state.environment
                            .temperature +
                        24;

                    next.power =
                        state.energy
                            .consumption *
                        0.08;

                    next.water =
                        state.water
                            .storage;

                    break;

                case "MAIN_BUILDING":
                    next.temperature =
                        20 +
                        (state.environment
                            .temperature +
                            20) *
                        0.025;

                    next.power =
                        state.energy
                            .consumption *
                        0.24;

                    next.water =
                        state.water
                            .storage;

                    break;

                case "CONTAINER":
                    next.temperature =
                        10 +
                        (state.environment
                            .temperature +
                            20) *
                        0.04;

                    next.power = 8;

                    next.water =
                        state.water
                            .storage *
                        0.3;

                    break;

                case "ANTENNA":
                    next.temperature =
                        state.environment
                            .temperature;

                    next.power = 4;

                    break;
            }

            return next;
        },
    );
}