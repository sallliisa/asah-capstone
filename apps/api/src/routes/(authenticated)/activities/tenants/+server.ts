import { defineRoute } from '@southneuhof/sprindle'
import { requirePermission } from '../../../../identity'
import { readTenants } from '../../../../tenant-reference'

export const GET = defineRoute({
  authorize: requirePermission('view-users'),
  action: async () => {
    const data = await readTenants()
    return { data, total: data.length }
  },
})
