export interface StationCoordinates {
    id: "MAITRI" | "BHARATI";
    name: string;
    /** Degrees, negative = south */
    latitude: number;
    /** Degrees east */
    longitude: number;
}

// Real-world coordinates.
// Maitri: Schirmacher Oasis, Queen Maud Land — 70°45'30"S, 11°44'00"E
// Bharati: Larsemann Hills — 69°24'24"S, 76°11'11"E
export const STATIONS: StationCoordinates[] = [
    { id: "MAITRI", name: "Maitri", latitude: -70.7583, longitude: 11.7333 },
    { id: "BHARATI", name: "Bharati", latitude: -69.4067, longitude: 76.1864 },
];