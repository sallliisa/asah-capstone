import { defineRoute } from '@southneuhof/sprindle'
import { count, desc, eq } from 'drizzle-orm'
import { z } from 'zod/v4'
import { getDb } from '../../../../../db'
import { requirePathParam } from '../../../../../identity'
import { detectorResultSchema } from '../../schema'
import { tenantDetectorPredictions } from '../../tenant-detector.table'

export const GET = defineRoute({ action: async (args) => {
  const tenantId = requirePathParam(args, 'tenantId')
  const page = z.coerce.number().int().positive().default(1).parse(args.c.req.query('page'))
  const where = eq(tenantDetectorPredictions.tenantId, tenantId)
  const rows = await getDb().select().from(tenantDetectorPredictions).where(where).orderBy(desc(tenantDetectorPredictions.generatedAt), desc(tenantDetectorPredictions.id)).limit(10).offset((page - 1) * 10)
  const total = (await getDb().select({ value: count() }).from(tenantDetectorPredictions).where(where))[0].value
  return { data: rows.map((row) => ({ id: row.id, generatedAt: row.generatedAt, sourceRevision: row.sourceRevision, inputHash: row.inputHash, ...detectorResultSchema.parse(row.result) })), total }
} })
