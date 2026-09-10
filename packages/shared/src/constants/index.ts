// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Shared Constants
// ═══════════════════════════════════════════════════════════════

/** API versioned base path */
export const API_BASE_PATH = '/api/v1';

/** API endpoint paths — single source of truth for frontend API client and backend routes */
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  USERS: '/users',
  STATIONS: '/stations',
  TELEMETRY: '/telemetry',
  SENSORS: '/sensors',
  ALERTS: '/alerts',
  PREDICTIONS: '/predictions',
  SIMULATIONS: '/simulations',
  MAINTENANCE: '/maintenance',
  REPORTS: '/reports',
  AUDIT: '/audit',
  DIGITAL_TWIN: '/digital-twin',
} as const;

/** Default telemetry thresholds for Antarctic stations */
export const TELEMETRY_THRESHOLDS = {
  TEMPERATURE: {
    unit: '°C',
    warning: { min: -60, max: 5 },
    critical: { min: -70, max: 15 },
  },
  HUMIDITY: {
    unit: '%',
    warning: { min: 15, max: 85 },
    critical: { min: 10, max: 95 },
  },
  PRESSURE: {
    unit: 'hPa',
    warning: { min: 950, max: 1050 },
    critical: { min: 930, max: 1070 },
  },
  WIND_SPEED: {
    unit: 'km/h',
    warning: { min: 0, max: 100 },
    critical: { min: 0, max: 150 },
  },
  POWER: {
    unit: '%',
    warning: { min: 30, max: 100 },
    critical: { min: 15, max: 100 },
  },
  FUEL: {
    unit: '%',
    warning: { min: 25, max: 100 },
    critical: { min: 10, max: 100 },
  },
} as const;

/** Station metadata */
export const STATIONS = {
  MAITRI: {
    name: 'Maitri Research Station',
    latitude: -70.7667,
    longitude: 11.7333,
    altitude: 117,
    timezone: 'UTC+5:30',
    established: 1989,
    description: 'Indian research station in Schirmacher Oasis, Antarctica',
  },
  BHARATI: {
    name: 'Bharati Research Station',
    latitude: -69.4067,
    longitude: 76.1947,
    altitude: 42,
    timezone: 'UTC+5:30',
    established: 2012,
    description: 'Indian research station in Larsemann Hills, Antarctica',
  },
} as const;

/** Pagination defaults */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/** Realtime event channel names */
export const REALTIME_CHANNELS = {
  TELEMETRY: 'telemetry',
  ALERTS: 'alerts',
  STATION_STATUS: 'station-status',
  MAINTENANCE: 'maintenance',
} as const;
