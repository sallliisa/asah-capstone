import { defineScope } from '@southneuhof/sprindle'
import { getDb } from '../../../db'
import { rooms } from '../rooms/rooms.table'
import { activityCategories } from '../activity-categories/activity-categories.table'
import { recurringPlan } from './recurring-plans.entity'
import { recurringPlanPublicSchema } from './schema'

async function readLabels() {
  const [roomRows, categoryRows] = await Promise.all([
    getDb().select({ id: rooms.id, name: rooms.roomCode }).from(rooms),
    getDb().select({ id: activityCategories.id, name: activityCategories.name }).from(activityCategories),
  ])
  return { rooms: new Map(roomRows.map((row) => [row.id, row.name])), categories: new Map(categoryRows.map((row) => [row.id, row.name])) }
}

export default defineScope({
  entity: recurringPlan,
  context: () => {
    let labels: ReturnType<typeof readLabels> | undefined
    return { planLabels: () => labels ??= readLabels() }
  },
  enrich: {
    schema: recurringPlanPublicSchema,
    run: async (record, { context }) => {
      const labels = await context.planLabels()
      return recurringPlanPublicSchema.parse({ ...record, roomName: record.roomId ? labels.rooms.get(record.roomId) ?? null : null, categoryName: labels.categories.get(record.categoryId) })
    },
  },
})
