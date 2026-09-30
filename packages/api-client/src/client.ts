// ═══════════════════════════════════════════════════════════════
// @repo/api-client — Base HTTP Client
// ═══════════════════════════════════════════════════════════════

import type { ApiResponse, ApiError } from '@repo/shared';

export interface ClientConfig {
  baseUrl: string;
  token?: string;
  onUnauthorized?: () => void;
}

export class ApiClientError extends Error {
  code: string;
  details?: unknown;
  status: number;
  apiError?: unknown;

  constructor(
    message: string,
    status: number,
    code: string = 'HTTP_ERROR',
    details?: unknown,
    apiError?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.apiError = apiError;

    // Ensure enumerable properties so JSON serialization and console logs never display `{}`
    Object.defineProperty(this, 'name', {
      value: 'ApiClientError',
      enumerable: true,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(this, 'message', {
      value: message,
      enumerable: true,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(this, 'code', {
      value: code,
      enumerable: true,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(this, 'status', {
      value: status,
      enumerable: true,
      writable: true,
      configurable: true,
    });
    if (details !== undefined) {
      Object.defineProperty(this, 'details', {
        value: details,
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
  }

  override toString(): string {
    return `[${this.code}] ${this.message}`;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      details: this.details,
    };
  }
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
      throw new ApiClientError(
        `API Connection Failed: Unable to reach ${method} ${url.toString()} (${lastError?.message || 'Network error'})`,
        0,
        'NETWORK_ERROR',
      );
    }

    if (response.status === 401) {
      this.onUnauthorized?.();
    }

    if (!response.ok) {
      let payload: any;
      try {
        payload = await response.json();
      } catch {
        payload = {
          success: false,
          error: {
            code: 'HTTP_ERROR',
            message: `Request failed with status ${response.status}: ${response.statusText}`,
          },
          timestamp: new Date().toISOString(),
        };
      }

      const errCode =
        payload?.error?.code ||
        payload?.code ||
        (response.status === 401
          ? 'UNAUTHORIZED'
          : response.status === 404
            ? 'NOT_FOUND'
            : 'HTTP_ERROR');

      const errMsg =
        payload?.error?.message ||
        payload?.message ||
        (typeof payload?.error === 'string' ? payload.error : null) ||
        `Request failed with status ${response.status}: ${response.statusText}`;

      const errDetails = payload?.error?.details || payload?.details;

      const apiErr = new ApiClientError(errMsg, response.status, errCode, errDetails, payload);
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
