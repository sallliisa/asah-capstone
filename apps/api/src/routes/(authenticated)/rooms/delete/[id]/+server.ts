import { deleteRoute } from '@southneuhof/sprindle'
import { requirePermission } from '../../../../../identity'

export const DELETE = deleteRoute({
  authorize: requirePermission('delete-rooms'),
  error: ({ error, c }) => {
    for (let cause: unknown = error; cause instanceof Error; cause = cause.cause) {
      const code: unknown = Reflect.get(cause, 'code')
      if (code === '23001' || code === '23503') return c.json({ error: 'room_in_use', message: 'This room is used by an activity, recurring plan, issue report, or saved tenant assessment.' }, 409)
    }
  },
})
