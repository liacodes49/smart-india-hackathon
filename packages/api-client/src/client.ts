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

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (response.status === 401) {
      this.onUnauthorized?.();
    }

    if (!response.ok) {
      const error = (await response.json()) as ApiError;
      throw error;
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
