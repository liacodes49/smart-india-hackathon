import { z } from 'zod';

export const createStationSchema = z.object({
  stationId: z.enum(['MAITRI', 'BHARATI']),
  name: z.string().min(2).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  altitude: z.number(),
  timezone: z.string().default('UTC+5:30'),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
});
export type CreateStationInput = z.infer<typeof createStationSchema>;

export const updateStationSchema = createStationSchema.partial();
export type UpdateStationInput = z.infer<typeof updateStationSchema>;

export const createBuildingSchema = z.object({
  stationId: z.string().uuid(),
  name: z.string().min(2).max(200),
  code: z.string().min(1).max(20),
  floors: z.number().int().min(1).max(10),
  purpose: z.string().min(2),
  coordinates: z
    .object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    })
    .optional(),
});
export type CreateBuildingInput = z.infer<typeof createBuildingSchema>;

export const createRoomSchema = z.object({
  buildingId: z.string().uuid(),
  name: z.string().min(2).max(200),
  code: z.string().min(1).max(20),
  floor: z.number().int().min(0),
  purpose: z.string().min(2),
  area: z.number().positive().optional(),
});
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
