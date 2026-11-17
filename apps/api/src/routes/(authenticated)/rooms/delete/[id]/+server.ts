import { deleteRoute } from '@southneuhof/sprindle'
import { requirePermission } from '../../../../../identity'

export const DELETE = deleteRoute({
  authorize: requirePermission('delete-rooms'),
  error: ({ error, c }) => {
    for (let cause: unknown = error; cause instanceof Error; cause = cause.cause) {
      if (Reflect.get(cause, 'code') === '23503') return c.json({ error: 'room_in_use', message: 'This room is used by an activity, recurring plan, or saved tenant assessment.' }, 409)
    }
  },
})
