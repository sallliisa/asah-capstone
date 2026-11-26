import { sql } from 'drizzle-orm'
import { check, index, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { activities } from '../activities/activities.table'
import { rooms } from '../rooms/rooms.table'
import { users } from '../users/users.table'
import type { IssueReportStatus } from './schema'

export const issueReports = pgTable('issue_reports', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  reporterId: text('reporter_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  roomId: text('room_id').notNull().references(() => rooms.id, { onDelete: 'restrict' }),
  title: varchar('title', { length: 160 }).notNull(),
  description: varchar('description', { length: 2000 }).notNull(),
  status: text('status').$type<IssueReportStatus>().notNull().default('open'),
  activityId: text('activity_id').references(() => activities.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('issue_reports_reporter_created_idx').on(table.reporterId, table.createdAt),
  index('issue_reports_created_idx').on(table.createdAt),
  check('issue_reports_status', sql`${table.status} in ('open', 'in_progress', 'resolved')`),
])
