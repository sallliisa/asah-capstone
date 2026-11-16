import { defineRoute } from '@southneuhof/sprindle'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod/v4'
import { getDb } from '../../../../db'
import { requirePermission } from '../../../../identity'
import { users } from '../../users/users.table'
import { activityTenantAttributionChanges } from '../activities.table'

export const GET = defineRoute({
  authorize: requirePermission('view-activities'),
  action: async (args) => {
    await requirePermission('view-users')(args)
    const activityId = z.string().min(1).parse(args.c.req.query('activityId'))
    const rows = await getDb().select().from(activityTenantAttributionChanges)
      .where(eq(activityTenantAttributionChanges.activityId, activityId))
      .orderBy(desc(activityTenantAttributionChanges.changedAt))
    const labels = new Map((await getDb().select({ id: users.id, name: users.name }).from(users)).map((user) => [user.id, user.name]))
    const data = rows.map((row) => ({
      id: row.id,
      previousTenant: row.previousTenantId ? labels.get(row.previousTenantId) ?? 'Unknown tenant' : 'None',
      newTenant: row.newTenantId ? labels.get(row.newTenantId) ?? 'Unknown tenant' : 'None',
      changedBy: labels.get(row.changedBy) ?? 'Unknown user',
      changedAt: row.changedAt,
      reason: row.reason,
    }))
    return { data, total: data.length }
  },
})
