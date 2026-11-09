import { defineRoute } from '@southneuhof/sprindle'
import { and, eq, lte } from 'drizzle-orm'
import { z } from 'zod/v4'
import { getDb } from '../../../../db'
import { requirePermission } from '../../../../identity'
import { activityCategories } from '../../activity-categories/activity-categories.table'
import { businessDate } from '../../activities/dates'
import { rooms } from '../../rooms/rooms.table'
import { occurrenceDate } from '../generate'
import { recurringPlans } from '../recurring-plans.table'
import { recurringPlanSelectSchema, upcomingPlanSchema } from '../schema'

export const GET = defineRoute({
  authorize: requirePermission('view-recurring-plans'),
  action: async () => {
    const today = businessDate()
    const throughDate = new Date(`${today}T00:00:00.000Z`)
    throughDate.setUTCDate(throughDate.getUTCDate() + 6)
    const through = throughDate.toISOString().slice(0, 10)
    const rows = await getDb().select({ plan: recurringPlans, roomName: rooms.roomCode, categoryName: activityCategories.name }).from(recurringPlans)
      .innerJoin(activityCategories, eq(recurringPlans.categoryId, activityCategories.id)).leftJoin(rooms, eq(recurringPlans.roomId, rooms.id))
      .where(and(eq(recurringPlans.active, true), lte(recurringPlans.nextOccurrenceDate, through)))
    const upcoming: z.output<typeof upcomingPlanSchema>[] = []
    for (const row of rows) {
      const plan = recurringPlanSelectSchema.parse(row.plan)
      if (plan.nextOccurrenceDate > through) continue
      const start = new Date(`${plan.startDate}T00:00:00.000Z`)
      const current = new Date(`${today}T00:00:00.000Z`)
      const elapsed = plan.intervalUnit === 'month'
        ? (current.getUTCFullYear() - start.getUTCFullYear()) * 12 + current.getUTCMonth() - start.getUTCMonth()
        : Math.floor((current.getTime() - start.getTime()) / 86400000) / (plan.intervalUnit === 'week' ? 7 : 1)
      let index = Math.max(plan.occurrenceIndex, Math.floor(elapsed / plan.intervalCount), 0)
      let expectedDate = occurrenceDate(plan.startDate, plan.intervalCount, plan.intervalUnit, index)
      while (expectedDate < today) {
        index += 1
        expectedDate = occurrenceDate(plan.startDate, plan.intervalCount, plan.intervalUnit, index)
      }
      while (expectedDate <= through) {
        upcoming.push(upcomingPlanSchema.parse({ planId: plan.id, name: plan.name, roomName: row.roomName, categoryName: row.categoryName, expectedDate, financialKind: plan.financialKind, amount: plan.amount }))
        index += 1
        expectedDate = occurrenceDate(plan.startDate, plan.intervalCount, plan.intervalUnit, index)
      }
    }
    upcoming.sort((a, b) => a.expectedDate.localeCompare(b.expectedDate) || a.planId.localeCompare(b.planId))
    return { data: upcoming.slice(0, 8), total: upcoming.length }
  },
})
