import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from '../users/users.table'

export const piRoutingEvents = pgTable('pi_routing_events', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  question: text('question').notNull(),
  result: jsonb('result').notNull(),
})
