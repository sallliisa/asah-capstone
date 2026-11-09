import { z } from 'zod/v4'
import { eq } from 'drizzle-orm'
import { getDb } from '../../../db'
import { activityCategories } from './activity-categories.table'

export async function validateActivityCategory(value: unknown) {
  const categoryId = z.string().trim().min(1).optional().parse(value)
  if (categoryId && !(await getDb().select({ id: activityCategories.id }).from(activityCategories).where(eq(activityCategories.id, categoryId)).limit(1)).length) return { field: 'categoryId', message: 'Select an existing activity category.' }
}
