import { pgTable, text, varchar } from 'drizzle-orm/pg-core'
import { roomTypes } from '../room-types/room-types.table'
import { users } from '../users/users.table'
import { auditFields } from '../roles/roles.table'

export const rooms = pgTable('rooms', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  roomCode: varchar('room_code', { length: 30 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  occupantId: text('occupant_id').references(() => users.id, { onDelete: 'set null' }),
  roomTypeId: text('room_type_id').notNull().default('room-type-standard').references(() => roomTypes.id, { onDelete: 'restrict' }),
  description: varchar('description', { length: 1000 }),
  ...auditFields,
})
