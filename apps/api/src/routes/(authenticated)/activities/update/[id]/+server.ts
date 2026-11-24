import { validateTenant } from '../../../../../tenant-reference'
import { validateActivityCategory } from '../../../activity-categories/references'
import { defineRoute, notFound, validationError } from '@southneuhof/sprindle'
import { eq } from 'drizzle-orm'
import { getDb } from '../../../../../db'
import { requireOrgIdentity, requirePathParam, requirePermission } from '../../../../../identity'
import { readJsonBody } from '../../../../../request-body'
import { validateRoom } from '../../../../../room-reference'
import { activities, activityTenantAttributionChanges } from '../../activities.table'
import { businessDate } from '../../dates'
import { presentActivity, readActivityLabels } from '../../projection'
import { activityEditSchema, activityStateSchema } from '../../schema'

export const PATCH = defineRoute({
  authorize: requirePermission('update-activities'),
  openapi: { requestBody: activityEditSchema },
  action: async (args) => {
    const { tenantNote, ...values } = activityEditSchema.parse(await readJsonBody(args.c))
    const actor = await requireOrgIdentity(args)
    const where = eq(activities.id, requirePathParam(args, 'id'))
    const record = await getDb().transaction(async (tx) => {
      const original = (await tx.select().from(activities).where(where).for('update'))[0]
      if (!original) throw notFound()
      if (!original.dueDate && (values.dueDate !== undefined || values.taskTarget !== undefined))
        throw validationError([{ field: 'dueDate', message: 'Use Schedule once to create a scheduled task.' }])
      const tenantChanged = values.tenantId !== undefined && values.tenantId !== original.tenantId
      if (tenantChanged) await requirePermission('view-users')(args)
      const issues = (await Promise.all([
        tenantChanged ? validateTenant(values.tenantId) : undefined,
        values.roomId !== undefined && values.roomId !== original.roomId ? validateRoom(values.roomId) : undefined,
        values.categoryId !== undefined && values.categoryId !== original.categoryId ? validateActivityCategory(values.categoryId) : undefined,
      ])).filter((issue) => issue !== undefined)
      if (issues.length) throw validationError(issues)
      const merged = { ...original, ...values }
      const today = businessDate()
      const completedDate = merged.workStatus === 'completed' ? (original.completedDate ?? today) : null
      let paymentDate = merged.paymentDate
      if (merged.paymentStatus === 'settled') {
        if (Object.hasOwn(values, 'paymentDate')) paymentDate ??= today
        else if (original.paymentStatus !== 'settled' || original.financialKind !== merged.financialKind) paymentDate = today
      }
      const updated = activityStateSchema.parse({ ...merged, completedDate, paymentDate })
      if (tenantChanged) {
        await tx.insert(activityTenantAttributionChanges).values({
          activityId: original.id,
          previousTenantId: original.tenantId,
          newTenantId: updated.tenantId,
          changedBy: actor.userId,
          reason: tenantNote ?? '',
        })
      }
      const rows = await tx
        .update(activities)
        .set({ ...values, completedDate, paymentDate, updatedByUserId: actor.userId, updatedAt: new Date().toISOString() })
        .where(where)
        .returning()
      return activityStateSchema.parse(rows[0])
    })
    return { data: presentActivity(record, await readActivityLabels()) }
  },
})
