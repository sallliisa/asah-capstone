import { defineRoute, validationError } from '@southneuhof/sprindle'
import { getDb } from '../../../../../db'
import { requirePathParam, requirePermission } from '../../../../../identity'
import { validateTenant } from '../../../../../tenant-reference'
import { tenantDetectorState } from '../../tenant-detector.table'

export const POST = defineRoute({
  authorize: requirePermission('update-users'),
  action: async (args) => {
    const tenantId = requirePathParam(args, 'tenantId')
    if (await validateTenant(tenantId)) throw validationError('Select an existing tenant.')
    await getDb().insert(tenantDetectorState).values({ tenantId }).onConflictDoUpdate({ target: tenantDetectorState.tenantId, set: { pending: true } })
    args.c.status(202)
    return { accepted: true }
  },
})
