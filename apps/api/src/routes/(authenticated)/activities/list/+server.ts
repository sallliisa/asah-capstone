import { list, validationError } from '@southneuhof/sprindle'
import { count, SQL } from 'drizzle-orm'
import { getDb } from '../../../../db'
import { requirePermission } from '../../../../identity'
import { activities } from '../activities.table'
import { activityOrder, activityQuerySchema, activityWhere } from '../query'
import { activitySelectSchema } from '../schema'

export const GET = list({
  authorize: requirePermission('view-activities'),
  run: async ({ state }) => {
    const query = activityQuerySchema.parse(state.query)
    if (state.where !== undefined && !(state.where instanceof SQL)) throw validationError('Unsupported activity scope.')
    const where = activityWhere(query, state.where)
    const [rows, totals] = await Promise.all([
      getDb().select().from(activities).where(where).orderBy(...activityOrder(query)).limit(query.limit).offset((query.page - 1) * query.limit),
      getDb().select({ total: count() }).from(activities).where(where),
    ])
    return { data: rows.map((row) => activitySelectSchema.parse(row)), total: Number(totals[0]?.total ?? 0) }
  },
})
