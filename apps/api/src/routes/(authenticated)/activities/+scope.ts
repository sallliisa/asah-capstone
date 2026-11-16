import { users } from '../users/users.table'
import { activityCategories } from '../activity-categories/activity-categories.table'
import { defineScope } from '@southneuhof/sprindle'
import { getDb } from '../../../db'
import { publicRecord } from '../../../storage/assets'
import { rooms } from '../rooms/rooms.table'
import { recurringPlans } from '../recurring-plans/recurring-plans.table'
import { activity } from './activities.entity'
import { activityPublicSchema } from './schema'

async function readLabels() {
  const [roomRows, planRows, categoryRows, tenantRows] = await Promise.all([
    getDb().select({ id: rooms.id, name: rooms.roomCode }).from(rooms),
    getDb().select({ id: recurringPlans.id, name: recurringPlans.name }).from(recurringPlans),
    getDb().select({ id: activityCategories.id, name: activityCategories.name }).from(activityCategories),
    getDb().select({ id: users.id, name: users.name }).from(users),
  ])
  return { tenants: new Map(tenantRows.map((row) => [row.id, row.name])), categories: new Map(categoryRows.map((row) => [row.id, row.name])), rooms: new Map(roomRows.map((row) => [row.id, row.name])), plans: new Map(planRows.map((row) => [row.id, row.name])) }
}

export default defineScope({
  entity: activity,
  context: () => {
    let labels: ReturnType<typeof readLabels> | undefined
    return { activityLabels: () => labels ??= readLabels() }
  },
  enrich: {
    schema: activityPublicSchema,
    run: async (record, { context }) => {
      const labels = await context.activityLabels()
      return publicRecord(activityPublicSchema, { ...record, tenantName: record.tenantId ? labels.tenants.get(record.tenantId) ?? null : null, categoryName: labels.categories.get(record.categoryId), roomName: record.roomId ? labels.rooms.get(record.roomId) ?? null : null, planName: record.recurringPlanId ? labels.plans.get(record.recurringPlanId) ?? null : null })
    },
  },
})
