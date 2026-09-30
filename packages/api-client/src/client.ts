// ═══════════════════════════════════════════════════════════════
// @repo/api-client — Base HTTP Client
// ═══════════════════════════════════════════════════════════════

import type { ApiResponse, ApiError } from '@repo/shared';

export interface ClientConfig {
  baseUrl: string;
  token?: string;
  onUnauthorized?: () => void;
}

export class ApiClient {
  private baseUrl: string;
  private token?: string;
  private onUnauthorized?: () => void;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.token = config.token;
    this.onUnauthorized = config.onUnauthorized;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = undefined;
  }

  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      params?: Record<string, string | number | undefined>;
    },
  ): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    let response: Response | undefined;
    let lastError: any;
    const maxAttempts = method === 'GET' ? 2 : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        response = await fetch(url.toString(), {
          method,
          headers,
          body: options?.body ? JSON.stringify(options.body) : undefined,
        });
        break;
      } catch (networkError: any) {
        lastError = networkError;
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }
    }

    if (!response) {
      throw new Error(
        `API Connection Failed: Unable to reach ${method} ${url.toString()} (${lastError?.message || 'Network error'})`
      );
    }

    if (response.status === 401) {
      this.onUnauthorized?.();
    }

    if (!response.ok) {
      let error: ApiError;
      try {
        error = (await response.json()) as ApiError;
      } catch {
        error = {
          success: false,
          error: {
            code: 'HTTP_ERROR',
            message: `Request failed with status ${response.status}: ${response.statusText}`,
          },
          timestamp: new Date().toISOString(),
        };
      }
      const errMsg = error.error?.message || `Request failed with status ${response.status}: ${response.statusText}`;
      const apiErr = new Error(errMsg);
      (apiErr as any).code = error.error?.code;
      (apiErr as any).details = error.error?.details;
      (apiErr as any).apiError = error;
      throw apiErr;
    }

    return (await response.json()) as ApiResponse<T>;
  }

  async get<T>(path: string, params?: Record<string, string | number | undefined>) {
    return this.request<T>('GET', path, { params });
  }

  async post<T>(path: string, body?: unknown) {
    return this.request<T>('POST', path, { body });
  }

  async put<T>(path: string, body?: unknown) {
    return this.request<T>('PUT', path, { body });
  }

  async patch<T>(path: string, body?: unknown) {
    return this.request<T>('PATCH', path, { body });
  }

  async delete<T>(path: string) {
    return this.request<T>('DELETE', path);
  }
}
