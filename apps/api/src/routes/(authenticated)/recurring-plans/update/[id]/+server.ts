import { validateTenant } from '../../../../../tenant-reference'
import { validateActivityCategory } from '../../../activity-categories/references'
import { update, validationError } from '@southneuhof/sprindle'
import { and, eq, max, SQL } from 'drizzle-orm'
import { getDb } from '../../../../../db'
import { requirePermission } from '../../../../../identity'
import { validateRoom } from '../../../../../room-reference'
import { activities } from '../../../activities/activities.table'
import { addCalendarDays, businessDate } from '../../../activities/dates'
import { notificationOwnerId } from '../../../notifications/owner'
import { generatePlanOccurrences, occurrenceDate } from '../../generate'
import { recurringPlans } from '../../recurring-plans.table'
import { recurringPlanStateSchema } from '../../schema'

export const PATCH = update({
  authorize: requirePermission('update-recurring-plans'),
  run: async (args) => {
    const { state } = args
    if (state.where !== undefined && !(state.where instanceof SQL)) throw validationError('Unsupported recurring plan scope.')
    const where = and(eq(recurringPlans.id, state.id), state.where)
    const recipientId = await notificationOwnerId()
    return getDb().transaction(async (tx) => {
      const original = (await tx.select().from(recurringPlans).where(where).for('update'))[0]
      if (!original) return undefined
      const values = { ...state.input, ...state.values }
      const merged = recurringPlanStateSchema.parse({ ...original, ...values })
      const tenantChanged = merged.tenantId !== original.tenantId
      const categoryChanged = merged.categoryId !== original.categoryId
      if (tenantChanged) await requirePermission('view-users')(args)
      const issues = (await Promise.all([
        tenantChanged ? validateTenant(merged.tenantId) : undefined,
        merged.roomId !== original.roomId ? validateRoom(merged.roomId) : undefined,
        categoryChanged ? validateActivityCategory(merged.categoryId) : undefined,
      ])).filter((issue) => issue !== undefined)
      if (issues.length) throw validationError(issues)
      if ((tenantChanged || categoryChanged || (merged.active && !original.active)) && merged.categoryId === 'activity-category-room-rent' && !merged.tenantId) {
        throw validationError('Select the tenant for this rent plan.')
      }
      const startChanged = merged.startDate !== original.startDate
      const scheduleChanged = startChanged || merged.intervalCount !== original.intervalCount || merged.intervalUnit !== original.intervalUnit
      let startDate = merged.startDate
      let cursor = { occurrenceIndex: original.occurrenceIndex, nextOccurrenceDate: original.nextOccurrenceDate }
      if (tenantChanged || scheduleChanged) {
        const today = businessDate()
        const openThrough = addCalendarDays(today, original.leadDays)
        if (original.active && original.nextOccurrenceDate <= openThrough) {
          const generated = await generatePlanOccurrences(tx, recurringPlanStateSchema.parse(original), today, recipientId)
          if (generated.nextOccurrenceDate <= openThrough) throw validationError('Wait for existing tasks to finish opening, then save the change again.')
          cursor = { occurrenceIndex: generated.occurrenceIndex, nextOccurrenceDate: generated.nextOccurrenceDate }
        }
        if (scheduleChanged || (!original.active && cursor.nextOccurrenceDate <= today)) {
          const [{ latest }] = await tx.select({ latest: max(activities.occurrenceDate) }).from(activities).where(eq(activities.recurringPlanId, original.id))
          if (latest || cursor.occurrenceIndex > 0 || tenantChanged) {
            const earliest = occurrenceDate(latest && latest > today ? latest : today, 1, 'day', 1)
            if (!startChanged) startDate = cursor.nextOccurrenceDate > earliest ? cursor.nextOccurrenceDate : earliest
            if (startDate < earliest) throw validationError([{ field: 'startDate', message: `The revised schedule must begin on or after ${earliest}.` }])
          }
          cursor = { occurrenceIndex: 0, nextOccurrenceDate: startDate }
        }
      }
      const rows = await tx.update(recurringPlans).set({ ...values, startDate, ...cursor }).where(where).returning()
      return recurringPlanStateSchema.parse(rows[0])
    })
  },
})
