import { z } from 'zod';

export const incidentSeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const incidentStatusSchema = z.enum(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);

export const createIncidentSchema = z.object({
  stationId: z.string().uuid(),
  title: z.string().min(3).max(255),
  description: z.string().min(5).max(2000),
  severity: incidentSeveritySchema.default('MEDIUM'),
  sourceAlertId: z.string().uuid().optional(),
  affectedAssetId: z.string().uuid().optional(),
  affectedZoneId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  remediationSteps: z.array(z.string()).default([]),
  slaDueDate: z.string().datetime().optional(),
});
export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;

export const updateIncidentSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().min(5).max(2000).optional(),
  severity: incidentSeveritySchema.optional(),
  status: incidentStatusSchema.optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  rootCause: z.string().max(2000).optional(),
  remediationSteps: z.array(z.string()).optional(),
  resolutionNotes: z.string().max(2000).optional(),
  slaDueDate: z.string().datetime().nullable().optional(),
});
export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>;

export const escalateAlertSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().min(5).max(2000).optional(),
  severity: incidentSeveritySchema.optional(),
  assignedTo: z.string().uuid().optional(),
  remediationSteps: z.array(z.string()).default([]),
  slaDueDate: z.string().datetime().optional(),
});
export type EscalateAlertInput = z.infer<typeof escalateAlertSchema>;

export const incidentQuerySchema = z.object({
  stationId: z.string().uuid().optional(),
  severity: incidentSeveritySchema.optional(),
  status: incidentStatusSchema.optional(),
  assignedTo: z.string().uuid().optional(),
  sourceAlertId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type IncidentQueryInput = z.infer<typeof incidentQuerySchema>;

