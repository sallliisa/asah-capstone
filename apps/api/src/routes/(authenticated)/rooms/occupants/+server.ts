import { defineRoute } from '@southneuhof/sprindle'
import { requirePermission } from '../../../../identity'
import { readOccupants } from '../occupants'

export const GET = defineRoute({
  authorize: requirePermission('view-rooms'),
  action: async () => {
    const data = await readOccupants()
    return { data, total: data.length }
  },
})
