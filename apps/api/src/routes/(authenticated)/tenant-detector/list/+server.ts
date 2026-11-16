import { defineRoute } from '@southneuhof/sprindle'
import { asc, eq, isNotNull, sql } from 'drizzle-orm'
import { getDb } from '../../../../db'
import { requirePermission } from '../../../../identity'
import { rooms } from '../../rooms/rooms.table'
import { users } from '../../users/users.table'
import { businessDate } from '../../activities/dates'
import { detectorResultSchema } from '../schema'
import { tenantDetectorPredictions, tenantDetectorState } from '../tenant-detector.table'

export const GET = defineRoute({ authorize: requirePermission('view-rooms'), action: async () => {
  const rows = await getDb().select({ tenantId: users.id, tenantName: users.name, state: tenantDetectorState, prediction: tenantDetectorPredictions }).from(tenantDetectorState).innerJoin(users, eq(users.id, tenantDetectorState.tenantId)).leftJoin(tenantDetectorPredictions, eq(tenantDetectorPredictions.id, tenantDetectorState.latestPredictionId)).where(sql`exists (select 1 from ${rooms} where ${rooms.occupantId} = ${users.id})`).orderBy(sql`case ${tenantDetectorPredictions.grade} when 'C' then 0 when 'B' then 1 when 'A' then 2 else 3 end`, sql`${tenantDetectorPredictions.score} desc nulls last`, asc(users.name))
  const roomRows = await getDb().select({ id: rooms.id, name: rooms.roomCode, tenantId: rooms.occupantId }).from(rooms).where(isNotNull(rooms.occupantId))
  const data = rows.map((row) => ({ tenantId: row.tenantId, tenantName: row.tenantName, rooms: roomRows.filter((room) => room.tenantId === row.tenantId), pending: row.state.pending, error: row.state.error, stale: !row.prediction || row.state.pending || row.prediction.asOfDate !== businessDate(), prediction: row.prediction ? { generatedAt: row.prediction.generatedAt, ...detectorResultSchema.parse(row.prediction.result) } : null }))
  return { data, total: data.length }
} })
