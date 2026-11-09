import { sql } from 'drizzle-orm'
import { check, integer, pgTable, text, varchar } from 'drizzle-orm/pg-core'
import { auditFields } from '../roles/roles.table'

export const roomTypes = pgTable('room_types', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 100 }).notNull(),
  cost: integer('cost').notNull(),
  ...auditFields,
}, (table) => [check('room_types_cost_nonnegative', sql`${table.cost} >= 0`)])
