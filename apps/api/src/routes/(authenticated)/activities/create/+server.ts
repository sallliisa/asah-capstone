import { validateTenant } from '../../../../tenant-reference'
import { validateActivityCategory } from '../../activity-categories/references'
import { create } from '@southneuhof/sprindle'
import { getDb } from '../../../../db'
import { requirePermission } from '../../../../identity'
import { validateRoom } from '../../../../room-reference'
import { activities } from '../activities.table'
import { businessDate } from '../dates'
import { activityCreateSchema, activityInsertSchema, activityStateSchema, defaultTaskTarget } from '../schema'
import { queueActivityNotifications } from '../../notifications/deliver'
import { notificationOwnerId } from '../../notifications/owner'

export const POST = create({
  authorize: requirePermission('create-activities'),
  validate: [({ state }) => validateTenant(state.input.tenantId), ({ state }) => validateRoom(state.input.roomId), ({ state }) => validateActivityCategory(state.input.categoryId)],
  run: async (args) => {
    const { state } = args
    const input = activityCreateSchema.parse(state.input)
    if (input.tenantId) await requirePermission('view-users')(args)
    const today = businessDate()
    const scheduled = input.dueDate !== undefined
    const paymentStatus = input.financialKind === 'none' ? null : scheduled ? 'draft' : 'settled'
    const row = activityInsertSchema.parse({
      ...input,
      ...state.values,
      workStatus: scheduled ? 'planned' : 'completed',
      completedDate: scheduled ? null : today,
      taskTarget: scheduled ? (input.taskTarget ?? defaultTaskTarget(input)) : null,
      paymentStatus,
      paymentDate: paymentStatus === 'settled' ? (input.paymentDate ?? today) : input.paymentDate,
    })
    const recipientId = scheduled ? await notificationOwnerId() : null
    return getDb().transaction(async (tx) => {
      const [record] = await tx.insert(activities).values(row).returning()
      if (recipientId && record.dueDate) await queueActivityNotifications(tx, recipientId, [{ ...record, dueDate: record.dueDate }])
      return activityStateSchema.parse(record)
    })
  },
})
