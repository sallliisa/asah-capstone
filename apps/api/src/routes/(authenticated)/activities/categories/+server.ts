import { defineRoute } from '@southneuhof/sprindle'
import { asc } from 'drizzle-orm'
import { getDb } from '../../../../db'
import { requirePermission } from '../../../../identity'
import { activityCategories } from '../../activity-categories/activity-categories.table'

export const GET = defineRoute({
  authorize: requirePermission('view-activities'),
  action: async () => {
    const data = await getDb().select({ id: activityCategories.id, name: activityCategories.name }).from(activityCategories).orderBy(asc(activityCategories.name))
    return { data, total: data.length }
  },
})
