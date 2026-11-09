import { deleteRoute, HttpError } from '@southneuhof/sprindle'
import { requirePermission } from '../../../../../identity'

export const DELETE = deleteRoute({
  authorize: requirePermission('delete-activity-categories'),
  validate: ({ state }) => { if (state.id === 'activity-category-general') throw new HttpError(409, 'default_category_required', 'The default activity category cannot be deleted.') },
  error: ({ error, c }) => {
    for (let cause: unknown = error; cause instanceof Error; cause = cause.cause) {
      if (Reflect.get(cause, 'code') === '23503') return c.json({ error: 'activity_category_in_use', message: 'This category is used by an activity or recurring plan.' }, 409)
    }
  },
})
