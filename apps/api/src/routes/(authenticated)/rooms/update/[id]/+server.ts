import { update, validationError } from '@southneuhof/sprindle'
import { and, eq, SQL } from 'drizzle-orm'
import { getDb } from '../../../../../db'
import { requirePermission } from '../../../../../identity'

import { validateAssignment } from '../../validate-assignment'
import { rooms } from '../../rooms.table'
import { roomSelectSchema } from '../../schema'

export const PATCH = update({
  authorize: requirePermission('update-rooms'),
  run: ({ state }) => {
    if (state.where !== undefined && !(state.where instanceof SQL)) throw validationError('Unsupported room scope.')
    const where = and(eq(rooms.id, state.id), state.where)
    return getDb().transaction(async (tx) => {
      const [room] = await tx.select().from(rooms).where(where).for('update')
      if (!room) return undefined
      const values = { ...state.input, ...state.values }
      const occupantId = typeof values.occupantId === 'string' && values.occupantId !== room.occupantId ? values.occupantId : undefined
      const roomTypeId = typeof values.roomTypeId === 'string' && values.roomTypeId !== room.roomTypeId ? values.roomTypeId : undefined
      const issue = await validateAssignment({ occupantId, roomTypeId })
      if (issue) throw validationError([issue])
      const [saved] = await tx.update(rooms).set(values).where(where).returning()
      return roomSelectSchema.parse(saved)
    })
  },
})
