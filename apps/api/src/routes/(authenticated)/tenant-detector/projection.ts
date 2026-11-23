import { notFound } from '@southneuhof/sprindle'
import { and, eq, lt, or, sql } from 'drizzle-orm'
import { getDb } from '../../../db'
import { readTenants } from '../../../tenant-reference'
import { activities } from '../activities/activities.table'
import { businessDate } from '../activities/dates'
import { users } from '../users/users.table'
import { detectorResultSchema } from './schema'
import { tenantDetectorPredictions, tenantDetectorState } from './tenant-detector.table'

export async function readTenantAssessment(tenantId: string) {
  if (!(await getDb().select({ id: users.id }).from(users).where(eq(users.id, tenantId))).length) throw notFound()
  const [state] = await getDb().select().from(tenantDetectorState).where(eq(tenantDetectorState.tenantId, tenantId))
  const prediction = state?.latestPredictionId ? (await getDb().select().from(tenantDetectorPredictions).where(eq(tenantDetectorPredictions.id, state.latestPredictionId)))[0] : null
  const today = businessDate()
  const overdue = await getDb()
    .select({ id: activities.id, roomId: activities.roomId, occurrenceDate: activities.occurrenceDate, amount: activities.amount })
    .from(activities)
    .where(
      and(
        eq(activities.tenantId, tenantId),
        eq(activities.categoryId, 'activity-category-room-rent'),
        eq(activities.financialKind, 'income'),
        lt(activities.occurrenceDate, today),
        or(eq(activities.paymentStatus, 'draft'), sql`${activities.paymentDate} > ${today}`)
      )
    )
  return {
    tenantId,
    isTenant: Boolean(state || (await readTenants(tenantId)).length),
    state: state ?? null,
    prediction: prediction ? { id: prediction.id, generatedAt: prediction.generatedAt, ...detectorResultSchema.parse(prediction.result) } : null,
    stale: Boolean(prediction && state?.sourceRevision !== prediction.sourceRevision),
    overdue,
  }
}
