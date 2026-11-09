import { pgTable, text, varchar } from 'drizzle-orm/pg-core'
import { auditFields } from '../roles/roles.table'

export const activityCategories = pgTable('activity_categories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 100 }).notNull().unique(),
  ...auditFields,
})
