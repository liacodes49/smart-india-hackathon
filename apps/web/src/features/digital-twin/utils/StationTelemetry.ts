export type AssetType =
    | "MAIN_BUILDING"
    | "FUEL_FARM"
    | "GENERATOR"
    | "PUMP_HOUSE"
    | "CONTAINER"
    | "ANTENNA";

export type AssetHealth =
    | "NORMAL"
    | "WARNING"
    | "CRITICAL"
    | "OFFLINE";

export interface TelemetryAsset {
    id: string;
    name: string;
    type: AssetType;
    health: AssetHealth;
    temperature: number;
    power: number;
    fuel: number;
    water: number;
    lastUpdated: number;
}

export const INITIAL_TELEMETRY: TelemetryAsset[] = [
    {
        id: "main-building",
        name: "Main Research Building",
        type: "MAIN_BUILDING",
        health: "NORMAL",
        temperature: 21.4,
        power: 68,
        fuel: 0,
        water: 82,
        lastUpdated: Date.now(),
    },
    {
        id: "fuel-farm",
        name: "Fuel Farm",
        type: "FUEL_FARM",
        health: "NORMAL",
        temperature: -18.2,
        power: 0,
        fuel: 76,
        water: 0,
        lastUpdated: Date.now(),
    },
    {
        id: "generator",
        name: "Primary Generator",
        type: "GENERATOR",
        health: "NORMAL",
        temperature: 74.8,
        power: 68,
        fuel: 71,
        water: 0,
        lastUpdated: Date.now(),
    },
    {
        id: "pump-house",
        name: "Water Pump House",
        type: "PUMP_HOUSE",
        health: "NORMAL",
        temperature: 8.4,
        power: 24,
        fuel: 0,
        water: 82,
        lastUpdated: Date.now(),
    },
    {
        id: "container-01",
        name: "Storage Module 01",
        type: "CONTAINER",
        health: "NORMAL",
        temperature: 12.8,
        power: 8,
        fuel: 0,
        water: 24,
        lastUpdated: Date.now(),
    },
    {
        id: "antenna",
        name: "Communications Mast",
        type: "ANTENNA",
        health: "NORMAL",
        temperature: -24.1,
        power: 4,
        fuel: 0,
        water: 0,
        lastUpdated: Date.now(),
    },
];

export function simulateTelemetry(
    previous: TelemetryAsset[],
): TelemetryAsset[] {
    return previous.map((asset) => {
        const noise =
            (Math.random() - 0.5) * 2;

        let next = {
            ...asset,
            lastUpdated: Date.now(),
        };

        switch (asset.type) {
            case "GENERATOR": {
                next.temperature =
                    Math.max(
                        55,
                        Math.min(
                            95,
                            asset.temperature +
                            noise * 2,
                        ),
                    );

                next.power =
                    Math.max(
                        35,
                        Math.min(
                            92,
                            asset.power +
                            noise * 3,
                        ),
                    );

                next.fuel =
                    Math.max(
                        0,
                        asset.fuel -
                        0.035 +
                        noise * 0.01,
                    );

                break;
            }

            case "FUEL_FARM": {
                next.fuel =
                    Math.max(
                        0,
                        asset.fuel -
                        0.018 +
                        noise * 0.01,
                    );

                next.temperature =
                    asset.temperature +
                    noise * 0.5;

                break;
            }

            case "PUMP_HOUSE": {
                next.temperature =
                    Math.max(
                        -5,
                        Math.min(
                            20,
                            asset.temperature +
                            noise,
                        ),
                    );

                next.power =
                    Math.max(
                        12,
                        Math.min(
                            45,
                            asset.power +
                            noise * 2,
                        ),
                    );

                next.water =
                    Math.max(
                        0,
                        Math.min(
                            100,
                            asset.water +
                            noise * 0.4,
                        ),
                    );

                break;
            }

            case "MAIN_BUILDING": {
                next.temperature =
                    Math.max(
                        16,
                        Math.min(
                            26,
                            asset.temperature +
                            noise * 0.25,
                        ),
                    );

                next.power =
                    Math.max(
                        45,
                        Math.min(
                            88,
                            asset.power +
                            noise * 1.5,
                        ),
                    );

                next.water =
                    Math.max(
                        60,
                        Math.min(
                            100,
                            asset.water +
                            noise * 0.2,
                        ),
                    );

                break;
            }

            case "CONTAINER": {
                next.temperature =
                    Math.max(
                        4,
                        Math.min(
                            22,
                            asset.temperature +
                            noise * 0.5,
                        ),
                    );

                next.power =
                    Math.max(
                        4,
                        Math.min(
                            18,
                            asset.power +
                            noise,
                        ),
                    );

                break;
            }

            case "ANTENNA": {
                next.temperature =
                    asset.temperature +
                    noise * 0.8;

                next.power =
                    Math.max(
                        2,
                        Math.min(
                            8,
                            asset.power +
                            noise * 0.5,
                        ),
                    );

                break;
            }
        }

        /*
         * Simulated health logic.
         * This deliberately creates occasional
         * warning states so the command-center
         * UI can be demonstrated.
         */
        if (
            next.type === "GENERATOR" &&
            next.temperature > 90
        ) {
            next.health = "CRITICAL";
        } else if (
            next.type === "GENERATOR" &&
            next.temperature > 82
        ) {
            next.health = "WARNING";
        } else if (
            next.type === "FUEL_FARM" &&
            next.fuel < 20
        ) {
            next.health = "CRITICAL";
        } else if (
            next.type === "FUEL_FARM" &&
            next.fuel < 35
        ) {
            next.health = "WARNING";
        } else if (
            next.type === "PUMP_HOUSE" &&
            next.water < 25
        ) {
            next.health = "WARNING";
        } else {
            next.health = "NORMAL";
        }

        return next;
    });
}