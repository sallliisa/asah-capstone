import { deleteRoute } from '@southneuhof/sprindle'
import { requirePermission } from '../../../../../identity'

export const DELETE = deleteRoute({
  authorize: requirePermission('delete-room-types'),
  error: ({ error, c }) => {
    for (let cause: unknown = error; cause instanceof Error; cause = cause.cause) {
      if (Reflect.get(cause, 'code') === '23503') return c.json({ error: 'room_type_in_use', message: 'This room type is assigned to a room.' }, 409)
    }
  },
})
