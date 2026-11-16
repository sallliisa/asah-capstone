import { readJsonBody } from '../../../../../request-body'
import { defineRoute, notFound, validationError } from '@southneuhof/sprindle'
import { eq } from 'drizzle-orm'
import { getDb } from '../../../../../db'
import { requireOrgIdentity, requirePathParam, requirePermission } from '../../../../../identity'
import { validateTenant } from '../../../../../tenant-reference'
import { activities, activityTenantAttributionChanges } from '../../activities.table'
import { activityAttributionSchema, activityStateSchema } from '../../schema'

export const POST = defineRoute({
  authorize: requirePermission('update-activities'),
  openapi: { requestBody: activityAttributionSchema },
  action: async (args) => {
    await requirePermission('view-users')(args)
    const id = requirePathParam(args, 'id')
    const input = activityAttributionSchema.parse(await readJsonBody(args.c))
    const invalid = await validateTenant(input.tenantId)
    if (invalid) throw validationError(invalid.message)
    const actor = await requireOrgIdentity(args)
    const record = await getDb().transaction(async (tx) => {
      const original = (await tx.select().from(activities).where(eq(activities.id, id)).for('update'))[0]
      if (!original) throw notFound()
      if (original.tenantId === input.tenantId) return original
      await tx.insert(activityTenantAttributionChanges).values({ activityId: id, previousTenantId: original.tenantId, newTenantId: input.tenantId, changedBy: actor.userId, reason: input.reason })
      return (await tx.update(activities).set({ tenantId: input.tenantId, updatedByUserId: actor.userId, updatedAt: new Date().toISOString() }).where(eq(activities.id, id)).returning())[0]
    })
    return { data: activityStateSchema.parse(record) }
  },
})
