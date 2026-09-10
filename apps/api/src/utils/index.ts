// Shared backend utility functions
export function formatResponse<T>(data: T, message?: string) {
  return { success: true as const, data, message, timestamp: new Date().toISOString() };
}

export function formatError(code: string, message: string, details?: unknown) {
  return { success: false as const, error: { code, message, details }, timestamp: new Date().toISOString() };
}
