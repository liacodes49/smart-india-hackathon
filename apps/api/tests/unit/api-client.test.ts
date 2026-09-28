import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AntarcticTwinClient, ApiClient } from '../../../../packages/api-client/src/index.js';

describe('AntarcticTwinClient & Typed SDK', () => {
  let client: AntarcticTwinClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { message: 'OK' },
        timestamp: new Date().toISOString(),
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    client = new AntarcticTwinClient({
      baseUrl: 'http://localhost:4000/api/v1',
      token: 'jwt-test-token-123',
    });
  });

  describe('1. Authentication Header Injection & Token Management', () => {
    it('injects Bearer token in Authorization headers when token is set', async () => {
      await client.stations.getById('00000000-0000-0000-0000-000000000001');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('http://localhost:4000/api/v1/stations/00000000-0000-0000-0000-000000000001');
      expect(options.headers).toMatchObject({
        Authorization: 'Bearer jwt-test-token-123',
        'Content-Type': 'application/json',
      });
    });

    it('removes Authorization header when clearToken() is called', async () => {
      client.clearToken();
      await client.stations.list();

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers.Authorization).toBeUndefined();
    });

    it('triggers onUnauthorized callback on 401 response', async () => {
      const onUnauthorized = vi.fn();
      const authClient = new ApiClient({
        baseUrl: 'http://localhost:4000/api/v1',
        token: 'expired-token',
        onUnauthorized,
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ code: 'UNAUTHORIZED', message: 'Token expired' }),
      });

      await expect(authClient.get('/stations')).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });
  });

  describe('2. Domain Module Endpoints & Query Parameter Serialization', () => {
    it('serializes query parameters correctly in GET requests', async () => {
      await client.analytics.getEnergyTrend('station-maitri', {
        startTime: '2026-09-16T00:00:00Z',
        endTime: '2026-09-16T12:00:00Z',
        resolution: 'hourly',
      });

      const [url] = mockFetch.mock.calls[0];
      const parsedUrl = new URL(url);
      expect(parsedUrl.pathname).toBe('/api/v1/analytics/energy/station-maitri');
      expect(parsedUrl.searchParams.get('startTime')).toBe('2026-09-16T00:00:00Z');
      expect(parsedUrl.searchParams.get('endTime')).toBe('2026-09-16T12:00:00Z');
      expect(parsedUrl.searchParams.get('resolution')).toBe('hourly');
    });

    it('exposes edge synchronization push and pull endpoints', async () => {
      await client.edge.pushSyncBatch({
        stationId: '00000000-0000-0000-0000-000000000001',
        edgeNodeId: 'edge-node-01',
        batchNumber: 1,
        idempotencyKey: 'idemp-01',
        firstSequence: 1,
        lastSequence: 10,
        checksum: 'hash',
        readings: [],
      });

      const [url, options] = mockFetch.mock.calls[0];
      expect(new URL(url).pathname).toBe('/api/v1/edge/sync/push');
      expect(options.method).toBe('POST');
    });

    it('exposes multi-protocol gateway ingestion endpoints', async () => {
      await client.gateway.ingest('MQTT', {
        stationId: '00000000-0000-0000-0000-000000000001',
        payload: { d: { tags: [] } },
      });

      const [url, options] = mockFetch.mock.calls[0];
      expect(new URL(url).pathname).toBe('/api/v1/gateway/ingest/MQTT');
      expect(options.method).toBe('POST');
    });

    it('exposes operational incidents lifecycle endpoints', async () => {
      await client.incidents.assign('inc-123', { assigneeId: 'user-engineer-1' });

      const [url, options] = mockFetch.mock.calls[0];
      expect(new URL(url).pathname).toBe('/api/v1/incidents/inc-123/assign');
      expect(options.method).toBe('POST');
    });
  });
});
