import { z } from 'zod/v4'

export const detectorCoverageSchema = z.object({
  repairsFrom: z.iso.date().nullable(),
  cleaningFrom: z.iso.date().nullable(),
  rentFrom: z.iso.date().nullable(),
  repairCostsComplete: z.boolean(),
})

export const detectorResultSchema = z.object({
  tenantId: z.string(),
  asOfDate: z.iso.date(),
  windowStart: z.iso.date(),
  observedDays: z.number().int().nonnegative(),
  featureVersion: z.literal('tenant-v1'),
  modelVersion: z.string().min(1),
  eligibilityReasons: z.array(z.string()),
  features: z.record(z.string(), z.number().finite()).nullable(),
  facts: z.array(z.object({ kind: z.string(), value: z.number().finite(), activityIds: z.array(z.string()) })),
  grade: z.enum(['A', 'B', 'C']).nullable(),
  score: z.number().finite().nullable(),
})

export const detectorHistorySchema = detectorResultSchema.extend({ id: z.string(), generatedAt: z.string(), sourceRevision: z.number().int(), inputHash: z.string() })
export const detectorDetailSchema = z.object({
  tenantId: z.string(),
  isTenant: z.boolean(),
  coverage: detectorCoverageSchema.extend({ tenantId: z.string(), confirmedAt: z.string(), confirmedBy: z.string() }).nullable(),
  state: z.object({ tenantId: z.string(), sourceRevision: z.number().int(), pending: z.boolean(), lastAttempt: z.string().nullable(), error: z.string().nullable(), latestPredictionId: z.string().nullable(), dailyDate: z.iso.date().nullable() }).nullable(),
  prediction: detectorResultSchema.extend({ id: z.string(), generatedAt: z.string() }).nullable(),
  stale: z.boolean(),
  overdue: z.array(z.object({ id: z.string(), roomId: z.string().nullable(), occurrenceDate: z.iso.date().nullable(), amount: z.number().nullable() })),
})
