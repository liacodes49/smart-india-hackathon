// Shared backend utility functions
export function formatResponse<T>(data: T, message?: string) {
  return { success: true as const, data, message, timestamp: new Date().toISOString() };
}

export function formatError(code: string, message: string, details?: unknown) {
  return {
    success: false as const,
    error: { code, message, details },
    timestamp: new Date().toISOString(),
  };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATION_CODE_TO_UUID: Record<string, string> = {
  MAITRI: '00000000-0000-0000-0000-000000000001',
  BHARATI: '00000000-0000-0000-0000-000000000002',
};

export function isUuid(val?: string | null): boolean {
  if (!val) return false;
  return UUID_REGEX.test(val.trim());
}

export function resolveStationUuid(idOrCode?: string | null): string | null {
  if (!idOrCode) return null;
  const trimmed = idOrCode.trim();
  if (isUuid(trimmed)) return trimmed;
  return STATION_CODE_TO_UUID[trimmed.toUpperCase()] ?? null;
}
