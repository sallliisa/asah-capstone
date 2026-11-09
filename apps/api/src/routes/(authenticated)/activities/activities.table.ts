import { activityCategories } from '../activity-categories/activity-categories.table'
import { sql } from 'drizzle-orm'
import { check, date, integer, pgTable, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core'
import { auditFields } from '../roles/roles.table'
import { rooms } from '../rooms/rooms.table'
import { recurringPlans } from '../recurring-plans/recurring-plans.table'

export const activities = pgTable('activities', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 160 }).notNull(),
  description: text('description'),
  roomId: text('room_id').references(() => rooms.id, { onDelete: 'restrict' }),
  workStatus: text('work_status').notNull().default('planned'),
  completedDate: date('completed_date'),
  financialKind: text('financial_kind').notNull().default('none'),
  categoryId: text('category_id').notNull().default('activity-category-general').references(() => activityCategories.id, { onDelete: 'restrict' }),
  amount: integer('amount'),
  paymentStatus: text('payment_status'),
  paymentDate: date('payment_date'),
  receipt: text('receipt'),
  recurringPlanId: text('recurring_plan_id').references(() => recurringPlans.id, { onDelete: 'restrict' }),
  occurrenceDate: date('occurrence_date'),
  ...auditFields,
}, (table) => [
  uniqueIndex('activities_plan_occurrence_unique').on(table.recurringPlanId, table.occurrenceDate),
  check('activities_work_status', sql`${table.workStatus} in ('planned','in_progress','completed','cancelled')`),
  check('activities_completion', sql`(${table.workStatus} = 'completed' and ${table.completedDate} is not null) or (${table.workStatus} <> 'completed' and ${table.completedDate} is null)`),
  check('activities_finance', sql`(${table.financialKind} = 'none' and ${table.amount} is null and ${table.paymentStatus} is null and ${table.paymentDate} is null and ${table.receipt} is null) or (${table.financialKind} in ('income','expense') and ${table.paymentStatus} is not null and (${table.amount} is null or ${table.amount} > 0) and ((${table.paymentStatus} = 'draft' and ${table.paymentDate} is null) or (${table.paymentStatus} = 'settled' and ${table.amount} is not null and ${table.paymentDate} is not null)))`),
  check('activities_occurrence', sql`(${table.recurringPlanId} is null and ${table.occurrenceDate} is null) or (${table.recurringPlanId} is not null and ${table.occurrenceDate} is not null)`),
])
