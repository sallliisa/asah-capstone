import { users } from '../users/users.table'
import { activityCategories } from '../activity-categories/activity-categories.table'
import { sql } from 'drizzle-orm'
import { boolean, check, date, integer, pgTable, text, varchar } from 'drizzle-orm/pg-core'
import { auditFields } from '../roles/roles.table'
import { rooms } from '../rooms/rooms.table'

export const recurringPlans = pgTable('recurring_plans', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 160 }).notNull(),
  description: text('description'),
  tenantId: text('tenant_id').references(() => users.id, { onDelete: 'restrict' }),
  roomId: text('room_id').references(() => rooms.id, { onDelete: 'restrict' }),
  startDate: date('start_date').notNull(),
  intervalCount: integer('interval_count').notNull().default(1),
  intervalUnit: text('interval_unit').notNull().default('week'),
  leadDays: integer('lead_days').notNull().default(0),
  active: boolean('active').notNull().default(true),
  financialKind: text('financial_kind').notNull().default('none'),
  categoryId: text('category_id').notNull().default('activity-category-general').references(() => activityCategories.id, { onDelete: 'restrict' }),
  amount: integer('amount'),
  taskTarget: text('task_target', { enum: ['work', 'payment'] }),
  occurrenceIndex: integer('occurrence_index').notNull().default(0),
  nextOccurrenceDate: date('next_occurrence_date').notNull(),
  ...auditFields,
}, (table) => [
  check('recurring_plans_interval', sql`${table.intervalCount} between 1 and 366 and ${table.intervalUnit} in ('day', 'week', 'month')`),
  check('recurring_plans_opening', sql`${table.leadDays} between 0 and 366 and (${table.taskTarget} is null or ${table.taskTarget} = 'work' or (${table.taskTarget} = 'payment' and ${table.financialKind} <> 'none'))`),
  check('recurring_plans_finance', sql`(${table.financialKind} = 'none' and ${table.amount} is null) or (${table.financialKind} in ('income','expense') and (${table.amount} is null or ${table.amount} > 0))`),
])
