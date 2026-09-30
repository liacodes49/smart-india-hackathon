import { AntarcticTwinClient } from '@repo/api-client';

// We initialize a singleton client instance for the frontend to use.
// In a real production app, the baseUrl would come from process.env.NEXT_PUBLIC_API_URL
export const apiClient = new AntarcticTwinClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
});
