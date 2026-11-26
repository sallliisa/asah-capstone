import { modelRequest } from '../../../model-service'
import { createHash } from 'node:crypto'
import { and, asc, between, eq, inArray, isNotNull, lte, or, sql, type SQLWrapper } from 'drizzle-orm'
import { z } from 'zod/v4'
import { getDb } from '../../../db'
import { businessDate } from '../activities/dates'
import { activities } from '../activities/activities.table'
import { recurringPlans } from '../recurring-plans/recurring-plans.table'
import { rooms } from '../rooms/rooms.table'
import { detectorResultSchema } from './schema'
import { tenantDetectorPredictions, tenantDetectorPredictionRooms, tenantDetectorState } from './tenant-detector.table'

export async function processTenantDetector() {
  if (!process.env.MODEL_SERVICE_URL || !process.env.MODEL_SERVICE_TOKEN) return { configured: false, saved: 0 }
  let modelVersion: string
  try {
    modelVersion = z.object({ ready: z.literal(true), modelVersion: z.string(), featureVersion: z.literal('tenant-v1') }).parse(await modelRequest('/health')).modelVersion
  } catch {
    await getDb().update(tenantDetectorState).set({ error: 'model_service_unavailable' }).where(eq(tenantDetectorState.pending, true))
    return { configured: true, saved: 0, error: 'model_service_unavailable' }
  }
  const today = businessDate()
  const withinWindow = (date: SQLWrapper) => between(date, sql`${today}::date - interval '1 year' + interval '1 day'`, sql`${today}::date`)
  const observedByToday = (date: SQLWrapper) => sql`case when ${date} <= ${today}::date then ${date} end`
  const recurringDueDate = sql<string | null>`case when ${activities.occurrenceDate} is not null then coalesce(${activities.dueDate}, ${activities.occurrenceDate}) end`
  const observationDate = sql`least(${observedByToday(recurringDueDate)}, ${observedByToday(activities.completedDate)}, ${observedByToday(activities.paymentDate)})`
  const scoringActivity = or(
    and(eq(activities.categoryId, 'activity-category-room-rent'), eq(activities.financialKind, 'income'), withinWindow(recurringDueDate)),
    and(eq(activities.categoryId, 'activity-category-extra-cleaning'), eq(activities.workStatus, 'completed'), withinWindow(activities.completedDate)),
    and(eq(activities.categoryId, 'activity-category-corrective-repairs'), or(
      and(eq(activities.workStatus, 'completed'), withinWindow(activities.completedDate)),
      and(eq(activities.financialKind, 'expense'), eq(activities.paymentStatus, 'settled'), withinWindow(activities.paymentDate)),
    )),
  )
  const clock = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date())
  const current = await getDb().selectDistinct({ tenantId: rooms.occupantId }).from(rooms).where(isNotNull(rooms.occupantId))
  for (const { tenantId } of current) {
    if (!tenantId) continue
    await getDb().insert(tenantDetectorState).values({ tenantId }).onConflictDoNothing()
    await getDb().update(tenantDetectorState).set({ pending: true, dailyDate: today }).where(and(eq(tenantDetectorState.tenantId, tenantId), or(
      clock >= '00:10' ? sql`${tenantDetectorState.dailyDate} is distinct from ${today}` : sql`false`,
      sql`exists (select 1 from ${tenantDetectorPredictions} where ${tenantDetectorPredictions.id} = ${tenantDetectorState.latestPredictionId} and ${tenantDetectorPredictions.modelVersion} <> ${modelVersion})`,
    )))
  }
  await getDb().update(tenantDetectorState).set({ pending: true }).where(and(
    eq(tenantDetectorState.pending, false),
    sql`exists (select 1 from ${tenantDetectorPredictions} where ${tenantDetectorPredictions.id} = ${tenantDetectorState.latestPredictionId} and not (${tenantDetectorPredictions.input} ? 'observationStart'))`,
  ))
  const candidates = await getDb().select({ tenantId: tenantDetectorState.tenantId }).from(tenantDetectorState).where(and(eq(tenantDetectorState.pending, true), sql`(${tenantDetectorState.lastAttempt} is null or ${tenantDetectorState.lastAttempt} < now() - interval '30 seconds')`)).orderBy(asc(tenantDetectorState.lastAttempt), asc(tenantDetectorState.tenantId)).limit(25)
  const snapshots = (await Promise.all(candidates.map(async (candidate) => getDb().transaction(async (tx) => {
      const state = (await tx.select().from(tenantDetectorState).where(and(eq(tenantDetectorState.tenantId, candidate.tenantId), eq(tenantDetectorState.pending, true), sql`(${tenantDetectorState.lastAttempt} is null or ${tenantDetectorState.lastAttempt} < now() - interval '30 seconds')`)).for('update', { skipLocked: true }))[0]
      if (!state) return null
      await tx.update(tenantDetectorState).set({ lastAttempt: new Date().toISOString() }).where(eq(tenantDetectorState.tenantId, state.tenantId))
      const associated = and(eq(activities.tenantId, state.tenantId), isNotNull(activities.roomId))
      const [{ observationStart }] = await tx.select({ observationStart: sql<string>`greatest(coalesce(min(${observationDate}), ${today}::date), ${today}::date - interval '1 year' + interval '1 day')::date::text` }).from(activities).where(associated)
      const records = await tx.select({ id: activities.id, roomId: activities.roomId, categoryId: activities.categoryId, workStatus: activities.workStatus, completedDate: activities.completedDate, financialKind: activities.financialKind, amount: activities.amount, paymentStatus: activities.paymentStatus, paymentDate: activities.paymentDate, occurrenceDate: recurringDueDate }).from(activities).where(and(associated, scoringActivity)).orderBy(asc(activities.id))
      const incomplete = await tx.select({ id: recurringPlans.id }).from(recurringPlans).where(and(eq(recurringPlans.tenantId, state.tenantId), isNotNull(recurringPlans.roomId), eq(recurringPlans.active, true), eq(recurringPlans.categoryId, 'activity-category-room-rent'), eq(recurringPlans.financialKind, 'income'), lte(recurringPlans.nextOccurrenceDate, today))).limit(1)
      const modelInput = {
        tenantId: state.tenantId,
        asOfDate: today,
        coverage: { repairsFrom: observationStart, cleaningFrom: observationStart, rentFrom: observationStart, repairCostsComplete: true },
        recurrenceComplete: !incomplete.length,
        activities: records,
      }
      const input = { ...modelInput, observationStart }
      return { state, modelInput, input, hash: createHash('sha256').update(JSON.stringify(input)).digest('hex') }
    }, { isolationLevel: 'repeatable read' })))).filter((snapshot) => snapshot !== null)
  if (!snapshots.length) return { configured: true, saved: 0 }
  let saved = 0
  try {
    const response = z.object({ results: z.array(detectorResultSchema).length(snapshots.length) }).parse(await modelRequest('/tenant-detector/score', { featureVersion: 'tenant-v1', tenants: snapshots.map((snapshot) => snapshot.modelInput) }))
    const results = new Map(response.results.map((result) => [result.tenantId, result]))
    if (results.size !== snapshots.length || snapshots.some((snapshot) => !results.has(snapshot.state.tenantId)) || response.results.some((result) => result.asOfDate !== today || result.modelVersion !== modelVersion)) throw new Error('model_response_mismatch')
    for (const snapshot of snapshots) {
      const result = results.get(snapshot.state.tenantId)
      if (!result) continue
      saved += await getDb().transaction(async (tx) => {
        const state = (await tx.select().from(tenantDetectorState).where(eq(tenantDetectorState.tenantId, snapshot.state.tenantId)).for('update'))[0]
        if (state.sourceRevision !== snapshot.state.sourceRevision) return 0
        let prediction = (await tx.insert(tenantDetectorPredictions).values({ tenantId: state.tenantId, asOfDate: today, sourceRevision: state.sourceRevision, inputHash: snapshot.hash, modelVersion, featureVersion: result.featureVersion, input: snapshot.input, result, grade: result.grade, score: result.score }).onConflictDoNothing().returning())[0]
        prediction ??= (await tx.select().from(tenantDetectorPredictions).where(and(eq(tenantDetectorPredictions.tenantId, state.tenantId), eq(tenantDetectorPredictions.asOfDate, today), eq(tenantDetectorPredictions.inputHash, snapshot.hash), eq(tenantDetectorPredictions.modelVersion, modelVersion))))[0]
        const roomIds = [...new Set(snapshot.input.activities.map((activity) => activity.roomId).filter((id): id is string => id !== null))]
        if (roomIds.length) await tx.insert(tenantDetectorPredictionRooms).values(roomIds.map((roomId) => ({ predictionId: prediction.id, roomId }))).onConflictDoNothing()
        await tx.update(tenantDetectorState).set({ pending: false, latestPredictionId: prediction.id, error: null }).where(eq(tenantDetectorState.tenantId, state.tenantId))
        return 1
      })
    }
  } catch {
    await getDb().update(tenantDetectorState).set({ error: 'model_assessment_failed' }).where(inArray(tenantDetectorState.tenantId, snapshots.map((snapshot) => snapshot.state.tenantId)))
  }
  return { configured: true, saved }
}
