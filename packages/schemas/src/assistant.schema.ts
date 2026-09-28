// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — AI Operations Assistant Validation Schemas
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';

export const assistantQuerySchema = z
  .object({
    message: z.string().min(2).max(1000).optional(),
    query: z.string().min(2).max(1000).optional(),
    stationId: z.string().uuid().optional(),
    conversationContext: z
      .array(
        z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string().max(2000),
        })
      )
      .optional(),
  })
  .refine((data) => !!(data.message || data.query), {
    message: "Either 'message' or 'query' must be provided",
  });
export type AssistantQueryInput = z.infer<typeof assistantQuerySchema>;
